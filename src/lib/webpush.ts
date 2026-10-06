/* Notificaciones en la versión web (iPhone con la app agregada a la pantalla de inicio,
   iOS 16.4+): igual que NORTE, a través del servidor (worker de Cloudflare). El servidor
   manda los recordatorios, los avisos de la agenda y el tip del Plan Cut de las próximas 48 h. */
import { Platform } from 'react-native';

import { pushCall } from '@/lib/nexo';
import { CUT_TIPS, dstr } from '@/lib/norteData';
import { getState, up, type State } from '@/lib/store';

export const webPushSupported = () =>
  Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && 'PushManager' in window;

/* Registra el service worker de Vamo (también reemplaza el viejo de NORTE). */
export function registerServiceWorker() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

const b64ToU8 = (s: string) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (ch) => ch.charCodeAt(0));
};

export async function enableWebPush(): Promise<string> {
  const p = getState().push || {};
  if (!p.url || !p.token) return 'Completá la URL y el token del servidor primero';
  if (!webPushSupported()) return 'Este navegador no soporta push. En iPhone: agregá Vamo a la pantalla de inicio (iOS 16.4+).';
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'Permiso de notificaciones denegado';
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const vr = await fetch(String(p.url).replace(/\/+$/, '') + '/vapid');
    const { publicKey } = await vr.json();
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) });
    const r = await pushCall('/subscribe', { subscription: sub.toJSON() });
    if (!r || !r.ok) return 'El servidor rechazó la suscripción. Revisá la URL y el token.';
    up((s) => { s.push = { ...(s.push || {}), enabled: true }; });
    return '✅ Notificaciones activadas en este teléfono';
  } catch (e: any) {
    return 'Error activando push: ' + (e?.message || e);
  }
}

export async function disableWebPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch {}
  up((s) => { s.push = { ...(s.push || {}), enabled: false }; });
}

/* Agenda en el servidor los avisos de las próximas 48 h (ids fijos → re-agendar no duplica). */
export function scheduleServerPush(s: State) {
  if (Platform.OS !== 'web' || !s.push?.enabled) return;
  const items: any[] = [];
  for (let off = 0; off < 2; off++) {
    const d = new Date();
    d.setDate(d.getDate() + off);
    const ds = dstr(d);
    for (const r of s.reminders || []) {
      if (!r.days.includes(d.getDay())) continue;
      const [hh, mm] = String(r.time || '0:0').split(':').map(Number);
      const t = new Date(d); t.setHours(hh || 0, mm || 0, 0, 0);
      if (t.getTime() > Date.now()) items.push({ id: `rem-${r.id}-${ds}`, at: t.getTime(), title: 'Vamo', body: r.text, ttl: 1800 });
    }
    const aa = s.agendaAlerts || { on: true, lead: 15 };
    if (aa.on) {
      for (const e of s.schedule || []) {
        if (e.day !== d.getDay() || !e.start) continue;
        const [hh, mm] = e.start.split(':').map(Number);
        const t = new Date(d); t.setHours(hh || 0, mm || 0, 0, 0);
        const at = t.getTime() - (aa.lead || 0) * 60000;
        if (at > Date.now()) items.push({ id: `agenda-${e.id}-${ds}`, at, ttl: 1800, title: e.who === 'novia' ? 'Agenda · Novia' : 'Agenda', body: `⏰ ${e.title} · ${e.end ? `${e.start}–${e.end}` : e.start} (en ${aa.lead} min)` });
      }
    }
    if (s.cut) {
      const t = new Date(d); t.setHours(17, 0, 0, 0);
      if (t.getTime() > Date.now()) {
        const doy = Math.floor((t.getTime() - new Date(t.getFullYear(), 0, 0).getTime()) / 86400000);
        items.push({ id: `tip-${ds}`, at: t.getTime(), title: '💡 Tip del Plan Cut', body: CUT_TIPS[doy % CUT_TIPS.length], ttl: 3600 });
      }
    }
  }
  if (items.length) pushCall('/schedule', items);
}

/* Cronómetro de descanso en la web: aviso por el servidor. */
export function scheduleTimerPush(at: number | null) {
  const s = getState();
  if (Platform.OS !== 'web' || !s.push?.enabled) return;
  if (at) pushCall('/schedule', { id: 'timer', at, title: '⏱️ ¡Descanso terminado!', body: 'Siguiente serie 💪', ttl: 120 });
  else pushCall('/cancel', { id: 'timer' });
}
