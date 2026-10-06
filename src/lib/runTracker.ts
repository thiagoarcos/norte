/* Registro de salidas a correr con GPS (tipo Strava / adidas Running).
   - Con build propia: sigue grabando con la pantalla bloqueada (tarea en segundo plano;
     en Android aparece la notificación fija "Vamo está registrando tu salida").
   - En Expo Go (pruebas): solo con la app abierta; la pantalla se mantiene prendida.
   La salida en curso se guarda en el teléfono a cada punto: si la app se cierra, no se pierde. */
import * as KeepAwake from 'expo-keep-awake';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { acceptPoint, computeSplits, downsample, haversineKm, runKcal } from '@/lib/fitness';
import { addRec, today, type Rec } from '@/lib/store';

export const RUN_TASK = 'norte-run-location';
const LIVE_KEY = 'norte-run-live-v1';

export type Pt = { lat: number; lon: number; t: number; a: number; d: number; alt: number | null };
export type Live = {
  status: 'running' | 'paused';
  startedAt: number;
  activeMs: number;
  segStart: number | null;
  points: Pt[];
  gap: boolean;
  elevGain: number;
  refAlt: number | null;
  acc: number | null; // precisión del último fix (m)
  speed: number | null; // velocidad instantánea (m/s)
  mode: 'background' | 'foreground';
};

export type RunData = {
  startedAt: number;
  km: number;
  sec: number;
  kcal: number;
  elevGain: number;
  splits: number[]; // segundos por km
  route: [number, number][]; // [lat, lon]
  paceSeries: [number, number][]; // [km, seg/km] para el gráfico de ritmo
  maxKmh: number;
  source: 'gps' | 'manual';
};

let live: Live | null = load();
let fgSub: Location.LocationSubscription | null = null;
const listeners = new Set<() => void>();

function load(): Live | null {
  try {
    const raw = localStorage.getItem(LIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
let lastSave = 0;
function save(force = false) {
  try {
    if (!live) localStorage.removeItem(LIVE_KEY);
    else if (force || Date.now() - lastSave > 5000) {
      lastSave = Date.now();
      localStorage.setItem(LIVE_KEY, JSON.stringify(live));
    }
  } catch {}
}
function set(next: Live | null, force = false) {
  live = next;
  save(force);
  listeners.forEach((l) => l());
}

export const activeMs = (l: Live | null) =>
  l ? l.activeMs + (l.status === 'running' && l.segStart ? Date.now() - l.segStart : 0) : 0;
export const liveKm = (l: Live | null) => (l && l.points.length ? l.points[l.points.length - 1].d : 0);

function ingest(loc: Location.LocationObject) {
  const l = live;
  if (!l || l.status !== 'running') return;
  const { latitude: lat, longitude: lon, accuracy, altitude, altitudeAccuracy, speed } = loc.coords;
  const pt = { lat, lon, t: loc.timestamp, acc: accuracy ?? 0 };
  const prev = l.points[l.points.length - 1];
  const base = { ...l, acc: accuracy ?? null, speed: speed != null && speed >= 0 ? speed : l.speed };
  if (!acceptPoint(l.gap ? null : prev, pt)) {
    set(base);
    return;
  }
  const d = (prev ? prev.d : 0) + (prev && !l.gap ? haversineKm(prev, pt) : 0);
  // desnivel positivo con histéresis de 3 m (filtra el ruido de la altitud del GPS)
  let { elevGain, refAlt } = l;
  if (altitude != null && (altitudeAccuracy == null || altitudeAccuracy < 15)) {
    if (refAlt == null) refAlt = altitude;
    else if (altitude - refAlt > 3) { elevGain += altitude - refAlt; refAlt = altitude; }
    else if (refAlt - altitude > 3) refAlt = altitude;
  }
  const point: Pt = { lat: +lat.toFixed(6), lon: +lon.toFixed(6), t: loc.timestamp, a: activeMs(l), d, alt: altitude ?? null };
  set({ ...base, gap: false, elevGain, refAlt, points: [...l.points, point] });
}

// La tarea se define al cargar el módulo (lo importa el layout raíz): así también corre
// cuando el sistema despierta la app en segundo plano.
try {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(RUN_TASK, async ({ data, error }) => {
    if (error || !data) return;
    if (!live) live = load();
    data.locations.forEach(ingest);
  });
} catch {
  // en el navegador no hay tareas en segundo plano: se usa el GPS con la página abierta
}

AppState.addEventListener('change', (s) => {
  if (s === 'background') save(true);
});

async function startUpdates(): Promise<'background' | 'foreground'> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('Necesito permiso de ubicación para registrar tu salida.');
  try {
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') throw new Error('sin permiso de segundo plano');
    await Location.startLocationUpdatesAsync(RUN_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 3,
      activityType: Location.LocationActivityType.Fitness,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Vamo está registrando tu salida',
        notificationBody: 'Tocá para volver a la app',
        notificationColor: '#FF5A1F',
        killServiceOnDestroy: false,
      },
    });
    return 'background';
  } catch {
    // Expo Go o permiso "solo mientras se usa": registramos con la app abierta
    fgSub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 3 },
      ingest,
    );
    try { await KeepAwake.activateKeepAwakeAsync('norte-run'); } catch { /* el navegador puede no permitir mantener la pantalla prendida */ }
    return 'foreground';
  }
}

async function stopUpdates() {
  fgSub?.remove();
  fgSub = null;
  try { Promise.resolve(KeepAwake.deactivateKeepAwake('norte-run')).catch(() => {}); } catch {}
  try {
    if (await Location.hasStartedLocationUpdatesAsync(RUN_TASK)) await Location.stopLocationUpdatesAsync(RUN_TASK);
  } catch {}
}

export async function startRun() {
  const now = Date.now();
  set({
    status: 'running', startedAt: now, activeMs: 0, segStart: now, points: [], gap: false,
    elevGain: 0, refAlt: null, acc: null, speed: null, mode: 'foreground',
  }, true);
  try {
    const mode = await startUpdates();
    if (live) set({ ...live, mode }, true);
  } catch (e) {
    set(null, true);
    throw e;
  }
}

export async function pauseRun() {
  if (!live || live.status !== 'running') return;
  await stopUpdates();
  set({ ...live, status: 'paused', activeMs: activeMs(live), segStart: null, gap: true, speed: null }, true);
}

export async function resumeRun() {
  if (!live || live.status === 'running') return;
  set({ ...live, status: 'running', segStart: Date.now(), gap: true }, true);
  const mode = await startUpdates();
  if (live) set({ ...live, mode }, true);
}

/* Si la app se cerró en medio de una salida en modo "app abierta", ya no llegan puntos:
   la dejamos en pausa (con el tiempo hasta el último punto) para que el usuario siga o termine. */
export async function recoverRun() {
  if (!live || live.status !== 'running' || fgSub) return;
  let bg = false;
  try { bg = await Location.hasStartedLocationUpdatesAsync(RUN_TASK); } catch {}
  if (bg) return;
  const last = live.points[live.points.length - 1];
  set({ ...live, status: 'paused', activeMs: last ? last.a : live.activeMs, segStart: null, gap: true, speed: null }, true);
}

export async function discardRun() {
  await stopUpdates();
  set(null, true);
}

/* Ritmo suavizado cada ~200 m, para el gráfico. */
function paceSeries(points: Pt[]): [number, number][] {
  const out: [number, number][] = [];
  let j = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].d - points[j].d >= 0.2) {
      const dd = points[i].d - points[j].d;
      out.push([+points[i].d.toFixed(2), Math.round((points[i].a - points[j].a) / 1000 / dd)]);
      j = i;
    }
  }
  return out;
}

export async function finishRun(bodyKg: number): Promise<Rec<RunData> | null> {
  const l = live;
  if (!l) return null;
  await stopUpdates();
  const sec = Math.round(activeMs(l) / 1000);
  const km = Math.round(liveKm(l) * 100) / 100;
  if (km < 0.05) {
    set({ ...l, status: 'paused', activeMs: activeMs(l), segStart: null, gap: true }, true);
    return null;
  }
  const series = paceSeries(l.points);
  const data: RunData = {
    startedAt: l.startedAt, km, sec, kcal: runKcal(km, bodyKg), elevGain: Math.round(l.elevGain),
    splits: computeSplits(l.points.map((p) => ({ t: p.a, d: p.d }))),
    route: downsample(l.points, 600).map((p: Pt) => [p.lat, p.lon]),
    paceSeries: series,
    maxKmh: series.length ? Math.round((3600 / Math.min(...series.map((s) => s[1]))) * 10) / 10 : 0,
    source: 'gps',
  };
  const rec = addRec<RunData>('run', data, today(new Date(l.startedAt)));
  set(null, true);
  return rec;
}

/* ---------- hook ---------- */
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snap = () => live;
export function useLiveRun() {
  return useSyncExternalStore(subscribe, snap, snap);
}
