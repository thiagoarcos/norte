/* Web Push desde cero con WebCrypto (sin dependencias).
   Cifrado del payload: RFC 8291 (aes128gcm) — el ÚNICO que acepta Apple.
   Identificación del servidor: RFC 8292 (VAPID, header "vapid t=...,k=..."). */

const te = new TextEncoder();

export const b64u = {
  decode(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
    const bin = atob(s + pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  },
  encode(buf) {
    const b = new Uint8Array(buf);
    let s = "";
    for (const x of b) s += String.fromCharCode(x);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
};

async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, len * 8),
  );
}

/* JWT ES256 firmado con la clave VAPID privada. aud = origen del push service.
   Apple exige que `sub` sea un mailto: o https: real, si no responde 403 BadJwtToken. */
export async function vapidAuthHeader(endpoint, publicKey, privateKey, subject) {
  const pub = b64u.decode(publicKey);
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC", crv: "P-256",
      x: b64u.encode(pub.slice(1, 33)),
      y: b64u.encode(pub.slice(33, 65)),
      d: privateKey,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const enc = (o) => b64u.encode(te.encode(JSON.stringify(o)));
  const unsigned =
    enc({ typ: "JWT", alg: "ES256" }) + "." +
    enc({
      aud: new URL(endpoint).origin,
      exp: Math.floor(Date.now() / 1000) + 12 * 3600,
      sub: subject,
    });
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, te.encode(unsigned));
  return `vapid t=${unsigned}.${b64u.encode(sig)}, k=${publicKey}`;
}

/* RFC 8291: ECDH efímero + HKDF + AES-128-GCM, un solo registro.
   Devuelve el body completo: salt(16) | rs(4) | idlen(1) | clave_pública_efímera(65) | ciphertext */
export async function encryptPayload(subscription, plaintext) {
  const uaPub = b64u.decode(subscription.keys.p256dh);   // 65 bytes, punto sin comprimir
  const authSecret = b64u.decode(subscription.keys.auth); // 16 bytes
  const asKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeys.privateKey, 256));
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));

  const keyInfo = new Uint8Array([...te.encode("WebPush: info\0"), ...uaPub, ...asPub]);
  const ikm = await hkdf(authSecret, ecdh, keyInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);

  const record = new Uint8Array([...te.encode(plaintext), 2]); // delimitador 0x02 = último registro
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, record));

  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096); // record size
  header[20] = 65;
  header.set(asPub, 21);

  const body = new Uint8Array(header.length + ct.length);
  body.set(header);
  body.set(ct, header.length);
  return body;
}

/* Envía una notificación { title, body, tag? } a la suscripción.
   ttl en segundos (cuánto la guarda el push service si el teléfono está offline). */
export async function sendPush(subscription, data, env, ttl = 300) {
  const body = await encryptPayload(subscription, JSON.stringify(data));
  const authorization = await vapidAuthHeader(
    subscription.endpoint, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT,
  );
  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      authorization,
      ttl: String(ttl),
      urgency: "high",
      "content-encoding": "aes128gcm",
      "content-type": "application/octet-stream",
    },
    body,
  });
}
