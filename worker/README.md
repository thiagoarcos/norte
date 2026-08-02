# nexofit-push — servidor de notificaciones

Mini-servidor en Cloudflare Workers (plan gratuito) que manda notificaciones push
nativas al iPhone aunque NORTE esté cerrada: temporizador de descanso,
recordatorios y tips del Plan Cut.

## Deploy (una sola vez)

Desde esta carpeta (`worker/`):

```bash
# 1. Iniciar sesión en Cloudflare (crea la cuenta gratis si no tenés; abre el navegador)
npx wrangler login

# 2. Desplegar el worker
npx wrangler deploy

# 3. Cargar los secretos (los valores están en worker/.dev.vars, que NO se commitea)
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put AUTH_TOKEN
```

El deploy imprime la URL, algo como `https://nexofit-push.<tu-cuenta>.workers.dev`.

## Activar en el iPhone

1. Abrí NORTE **instalada en la pantalla de inicio** (no en Safari suelto) — iOS 16.4+.
2. Pestaña **Más → Notificaciones push**: pegá la URL del worker y el token (el valor
   `AUTH_TOKEN` de `.dev.vars`).
3. Tocá **Activar en este teléfono** y aceptá el permiso.
4. Tocá **Probar**: tiene que llegar una notificación nativa.

## Cómo funciona

- La app le pide al worker "avisame a las X" (`/schedule`); un Durable Object con
  alarma manda el Web Push a la hora exacta — por eso el temporizador de 90 s llega
  a los 90 s, no "en el próximo minuto de un cron".
- Cifrado RFC 8291 (`aes128gcm`) + VAPID RFC 8292 implementados a mano con WebCrypto
  (`src/webpush.js`, sin dependencias). Apple **solo** acepta `aes128gcm`; las
  librerías que usan el viejo `aesgcm` fallan con web.push.apple.com.
- `VAPID_SUBJECT` tiene que ser un `mailto:` real: Apple responde 403 BadJwtToken
  si es inventado.
- Si se pierden los recordatorios: la app re-agenda las próximas 48 h cada vez que
  se abre, así que abrir la app una vez cada dos días alcanza.

## Regenerar claves VAPID

Si alguna vez hace falta (invalida las suscripciones existentes):

```bash
node -e "crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign']).then(async k=>{const j=await crypto.subtle.exportKey('jwk',k.privateKey);const p=Buffer.from(await crypto.subtle.exportKey('raw',k.publicKey)).toString('base64url');console.log('public:',p);console.log('private:',j.d)})"
```

Actualizá `VAPID_PUBLIC_KEY` en `wrangler.jsonc`, el secreto `VAPID_PRIVATE_KEY`,
y volvé a activar las notificaciones en el teléfono.
