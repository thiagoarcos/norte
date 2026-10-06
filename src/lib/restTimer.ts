/* Cronómetro de descanso del gym (anclado a la hora de fin, como en NORTE: aunque el
   teléfono congele la app, al volver muestra el tiempo real). En el teléfono además avisa
   con una notificación cuando termina. */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import { scheduleTimerPush } from '@/lib/webpush';

type T = { end: number | null; total: number; paused: number | null };
let t: T = { end: null, total: 60, paused: null };
const ls = new Set<() => void>();
const set = (n: T) => { t = n; ls.forEach((l) => l()); };

const NOTIF_ID = 'vamo-rest-timer';
async function schedule(end: number) {
  if (Platform.OS === 'web') { scheduleTimerPush(end); return; }
  try {
    await Notifications.cancelScheduledNotificationAsync(NOTIF_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_ID,
      content: { title: '⏱️ ¡Descanso terminado!', body: 'Siguiente serie 💪' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(end) },
    });
  } catch {}
}
function cancel() {
  if (Platform.OS === 'web') { scheduleTimerPush(null); return; }
  Notifications.cancelScheduledNotificationAsync(NOTIF_ID).catch(() => {});
}

export const startTimer = (secs: number) => { const end = Date.now() + secs * 1000; set({ end, total: secs, paused: null }); schedule(end); };
export const stopTimer = () => { set({ ...t, end: null, paused: null }); cancel(); };
export const pauseTimer = () => { if (!t.end) return; set({ ...t, paused: Math.max(1, Math.ceil((t.end - Date.now()) / 1000)), end: null }); cancel(); };
export const resumeTimer = () => { if (!t.paused) return; const end = Date.now() + t.paused * 1000; set({ ...t, end, paused: null }); schedule(end); };
export const addTimer = (secs: number) => { if (!t.end) return; const end = t.end + secs * 1000; set({ ...t, end, total: t.total + secs }); schedule(end); };

const sub = (l: () => void) => { ls.add(l); return () => ls.delete(l); };
const snap = () => t;
export const useRestTimer = () => useSyncExternalStore(sub, snap, snap);
