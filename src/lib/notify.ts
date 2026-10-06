/* Notificaciones locales en el teléfono (no necesitan servidor): recordatorios, bloques de la
   agenda (X minutos antes), agua, ayuno, plan de correr y el tip del Plan Cut.
   Se reprograman cada vez que cambia algo de eso. En la web se usa el push de NORTE (webpush.ts). */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { runTargetKm } from '@/lib/fitness';
import { CUT_TIPS } from '@/lib/norteData';
import { today, type State } from '@/lib/store';

export type NotifSettings = {
  water: boolean; waterFrom: number; waterTo: number; waterEvery: number;
  fasting: boolean;
  run: boolean; runTime: string;
};
export const DEFAULT_NOTIFS: NotifSettings = {
  water: true, waterFrom: 9, waterTo: 21, waterEvery: 2,
  fasting: true,
  run: true, runTime: '18:00',
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function askNotifPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

const hm = (t: string) => {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return { hour: Math.min(23, Math.max(0, h || 0)), minute: Math.min(59, Math.max(0, m || 0)) };
};

let running: Promise<void> | null = null;

export function rescheduleAll(s: State) {
  if (Platform.OS === 'web') return Promise.resolve();
  // encadenamos para que dos cambios seguidos no se pisen
  running = (running ?? Promise.resolve()).then(() => doSchedule(s)).catch(() => {});
  return running;
}

async function doSchedule(s: State) {
  const n = { ...DEFAULT_NOTIFS, ...(s.notifs || {}) };
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('norte', { name: 'Vamo', importance: Notifications.AndroidImportance.DEFAULT });
  }
  // el cronómetro de descanso tiene su propia notificación: no la borramos
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(pending.filter((p) => p.identifier !== 'vamo-rest-timer').map((p) => Notifications.cancelScheduledNotificationAsync(p.identifier)));
  const channelId = 'norte';
  const weekly = (weekday0: number, at: { hour: number; minute: number }, title: string, body: string) =>
    Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: weekday0 + 1, ...at, channelId } });

  // Recordatorios (los de NORTE)
  for (const r of s.reminders || []) {
    for (const day of r.days || []) await weekly(day, hm(r.time), 'Vamo', r.text);
  }

  // Agenda: aviso `lead` minutos antes de cada bloque
  const aa = s.agendaAlerts || { on: true, lead: 15 };
  if (aa.on) {
    for (const e of s.schedule || []) {
      if (!e.start) continue;
      const t = hm(e.start);
      let mins = t.hour * 60 + t.minute - (aa.lead || 0);
      let day = e.day;
      if (mins < 0) { mins += 1440; day = (day + 6) % 7; }
      const rango = e.end ? `${e.start}–${e.end}` : e.start;
      await weekly(day, { hour: Math.floor(mins / 60), minute: mins % 60 }, e.who === 'novia' ? 'Agenda · Novia' : 'Agenda', `⏰ ${e.title} · ${rango} (en ${aa.lead} min)`);
    }
  }

  // Agua: cada N horas entre "desde" y "hasta"
  if (n.water) {
    for (let h = n.waterFrom; h <= n.waterTo; h += Math.max(1, n.waterEvery)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Hora de tomar agua', body: `Tu meta es ${((s.goals?.waterMl || 2000) / 1000).toLocaleString('es-AR')} L. Sumá un vaso en Vamo.` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: 0, channelId },
      });
    }
  }

  // Ayuno: al empezar y al terminar
  if (n.fasting) {
    for (const f of s.fasting?.windows || []) {
      const a = hm(f.start), b = hm(f.end);
      const nextDay = b.hour * 60 + b.minute <= a.hour * 60 + a.minute;
      for (const d of f.days) {
        await weekly(d, a, '⏳ Empieza tu ayuno', `Hasta las ${f.end}: solo agua, café o té sin azúcar.`);
        await weekly((d + (nextDay ? 1 : 0)) % 7, b, '🍽️ Terminó tu ayuno', '¡Bien ahí! Ya podés comer. Registralo en Vamo.');
      }
    }
  }

  // Plan Cut: tip diario a las 17
  if (s.cut) {
    await Notifications.scheduleNotificationAsync({
      content: { title: '💡 Tip del Plan Cut', body: CUT_TIPS[Math.floor(Date.now() / 86400000) % CUT_TIPS.length] },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 17, minute: 0, channelId },
    });
  }

  // Correr: los próximos 7 días con los km exactos que tocan
  const plan = s.running?.plan;
  if (n.run && plan) {
    const t = hm(n.runTime);
    for (let i = 0; i < 7; i++) {
      const at = new Date();
      at.setDate(at.getDate() + i);
      at.setHours(t.hour, t.minute, 0, 0);
      if (at.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: '🏃 Tu salida de hoy', body: `Te tocan ${runTargetKm(plan, today(at))} km. ¡Dale que se puede!` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId },
      });
    }
  }
}
