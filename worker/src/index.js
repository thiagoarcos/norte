/* Mini-servidor de notificaciones de NORTE (Cloudflare Worker + Durable Object).
   La app le pide "avisame a las X" y el Durable Object usa una alarma para mandar
   el Web Push exacto a esa hora, con la app cerrada.

   Endpoints (todos JSON, auth: "Authorization: Bearer <AUTH_TOKEN>"):
     GET  /vapid              → { publicKey }   (sin auth: la clave pública no es secreta)
     POST /subscribe          → { subscription } de PushManager.subscribe()
     POST /schedule           → { id, at(ms), title, body, ttl? } o un array de esos
     POST /cancel             → { id } o { prefix }
     POST /test               → manda una notificación ya mismo
     GET  /status             → { subscribed, pending[] }                       */

import { sendPush } from "./webpush.js";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "authorization,content-type",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...CORS } });

export class Scheduler {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req) {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    if (url.pathname === "/subscribe") {
      if (!body.subscription || !body.subscription.endpoint) return json({ error: "suscripción inválida" }, 400);
      await this.state.storage.put("sub", body.subscription);
      return json({ ok: true });
    }

    if (url.pathname === "/schedule") {
      const items = Array.isArray(body) ? body : [body];
      for (const n of items) {
        if (!n.id || !n.at) continue;
        await this.state.storage.put("n:" + n.id, {
          at: Number(n.at), title: n.title || "NORTE", body: n.body || "", ttl: n.ttl,
        });
      }
      await this.resetAlarm();
      return json({ ok: true, scheduled: items.length });
    }

    if (url.pathname === "/cancel") {
      if (body.prefix) {
        const all = await this.state.storage.list({ prefix: "n:" + body.prefix });
        for (const k of all.keys()) await this.state.storage.delete(k);
      } else if (body.id) {
        await this.state.storage.delete("n:" + body.id);
      }
      await this.resetAlarm();
      return json({ ok: true });
    }

    if (url.pathname === "/test") {
      const sub = await this.state.storage.get("sub");
      if (!sub) return json({ ok: false, error: "sin suscripción: activá las notificaciones primero" }, 400);
      const res = await sendPush(sub, { title: "NORTE", body: "🎉 ¡Las notificaciones funcionan!" }, this.env, 60);
      return json({ ok: res.ok, status: res.status, detail: res.ok ? undefined : await res.text() });
    }

    if (url.pathname === "/status") {
      const sub = await this.state.storage.get("sub");
      const pending = await this.state.storage.list({ prefix: "n:" });
      return json({
        subscribed: !!sub,
        pending: [...pending.entries()].map(([k, v]) => ({ id: k.slice(2), ...v })).sort((a, b) => a.at - b.at),
      });
    }

    return json({ error: "not found" }, 404);
  }

  async resetAlarm() {
    const all = await this.state.storage.list({ prefix: "n:" });
    let min = null;
    for (const v of all.values()) if (min === null || v.at < min) min = v.at;
    if (min !== null) await this.state.storage.setAlarm(Math.max(min, Date.now() + 1000));
    else await this.state.storage.deleteAlarm();
  }

  async alarm() {
    const sub = await this.state.storage.get("sub");
    const all = await this.state.storage.list({ prefix: "n:" });
    const now = Date.now() + 500;
    for (const [k, v] of all.entries()) {
      if (v.at > now) continue;
      if (sub) {
        try {
          const res = await sendPush(sub, { title: v.title, body: v.body }, this.env, v.ttl || 300);
          // 404/410 = la suscripción murió (app desinstalada, permiso revocado)
          if (res.status === 404 || res.status === 410) await this.state.storage.delete("sub");
        } catch (e) {
          // error de red: se descarta esta notificación, no queremos acumular atrasadas
        }
      }
      await this.state.storage.delete(k);
    }
    await this.resetAlarm();
  }
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    if (url.pathname === "/vapid") return json({ publicKey: env.VAPID_PUBLIC_KEY });
    const auth = req.headers.get("authorization") || "";
    if (!env.AUTH_TOKEN || auth !== "Bearer " + env.AUTH_TOKEN) return json({ error: "no autorizado" }, 401);
    const id = env.SCHEDULER.idFromName("nexo");
    return env.SCHEDULER.get(id).fetch(req);
  },
};
