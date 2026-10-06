/* Datos de Vamo: primero en el teléfono, después en la nube.

   Vamo guarda TODO en el mismo formato que NORTE (un "estado" con hábitos, agenda, plata,
   gym, comidas, agua, peso, materias…). Así un backup de NORTE entra tal cual y los
   comandos de NEXO siguen funcionando igual. Ese estado es un único documento que se
   sincroniza con tu cuenta (Supabase, tabla `records`, id "norte").

   Lo único que vive aparte son las salidas a correr (registros "run"): traen el recorrido
   GPS y pesan mucho para meterlas en el documento.

   Para que las pantallas nuevas sigan siendo simples, `useRecs('meal' | 'water' | 'weight' |
   'body')` lee del documento y `addRec` / `removeRec` escriben en él. */
import * as Crypto from 'expo-crypto';
import { useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import type { NotifSettings } from '@/lib/notify';
import { supabase } from '@/lib/supabase';

export type Kind = 'meal' | 'water' | 'weight' | 'body' | 'run' | 'state';

export type Rec<T = any> = {
  id: string;
  kind: Kind;
  date: string; // YYYY-MM-DD (día al que pertenece)
  data: T;
  updated_at: string;
  deleted?: boolean;
};

type Saved = { recs: Record<string, Rec>; dirty: string[]; lastPull: string | null };

let userId: string | null = null;
let cloud = false;
let recs: Record<string, Rec> = {};
let dirty = new Set<string>();
let lastPull: string | null = null;
let version = 0;
const listeners = new Set<() => void>();
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;
export let syncStatus: 'local' | 'ok' | 'pending' | 'error' = 'local';

const keyFor = (uid: string) => `norte-data-v1-${uid}`;
const DOC_ID = 'norte';

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const uid = () => Math.random().toString(36).slice(2, 9);

function emit() {
  version++;
  listeners.forEach((l) => l());
}

/* Guardado en el teléfono: espera 300 ms sin cambios (mientras tipeás no reescribe todo a cada letra). */
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persistNow() {
  if (!userId) return;
  try {
    const s: Saved = { recs, dirty: [...dirty], lastPull };
    localStorage.setItem(keyFor(userId), JSON.stringify(s));
  } catch {}
}
function persist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, 300);
}
AppState.addEventListener('change', (st) => { if (st !== 'active') persistNow(); });

/* Se llama al iniciar sesión (o al entrar sin cuenta). */
export function initStore(id: string, isCloud: boolean) {
  if (userId === id) return;
  userId = id;
  cloud = isCloud && !!supabase;
  recs = {};
  dirty = new Set();
  lastPull = null;
  try {
    const raw = localStorage.getItem(keyFor(id));
    if (raw) {
      const s: Saved = JSON.parse(raw);
      recs = s.recs || {};
      dirty = new Set(s.dirty || []);
      lastPull = s.lastPull || null;
    }
  } catch {}
  syncStatus = cloud ? 'pending' : 'local';
  emit();
  if (cloud) sync();
}

export function resetStore() {
  userId = null;
  recs = {};
  dirty = new Set();
  emit();
}

function touch(r: Rec) {
  recs[r.id] = r;
  dirty.add(r.id);
  persist();
  emit();
  scheduleSync();
}

/* ============ el documento (estado estilo NORTE) ============ */
export type State = Record<string, any>;

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const inAYear = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return today(d); };

/* Valores de arranque para alguien nuevo (los tuyos llegan con el import de NORTE). */
export function defaultState(): State {
  return {
    theme: 'system',
    habits: [
      { id: 'h1', name: 'Entrenar', icon: '🏋️', days: [1, 2, 3, 4, 5], history: {} },
      { id: 'h3', name: 'Dormir antes de las 00', icon: '😴', days: ALL_DAYS, history: {} },
    ],
    workoutLog: {},
    sessionLog: {},
    exerciseHistory: {},
    currentWeek: 0,
    currentDay: 0,
    program: { weeks: [] },
    meals: {},
    mealLibrary: [],
    waterLog: {},
    fasting: { windows: [] },
    weightLog: {},
    measurements: [],
    notes: {},
    reminders: [
      { id: 'r1', text: 'Hora de entrenar 💪', time: '18:00', days: [1, 2, 3, 4, 5] },
      { id: 'r2', text: 'Registrá tu cena 🍽️', time: '21:30', days: ALL_DAYS },
    ],
    goals: { kcal: 2400, protein: 140, carbs: 280, fat: 75, waterMl: 2000 },
    customTips: [],
    cut: null,
    finance: {
      usdRate: 1400,
      rateUpdated: null,
      accounts: [],
      debts: [],
      budget: [
        { id: 'bud-alquiler', name: 'Alquiler', tipo: 'fijo', monto: 0, icon: '🏠' },
        { id: 'bud-servicios', name: 'Servicios', tipo: 'fijo', monto: 0, icon: '💡' },
        { id: 'bud-comida', name: 'Comida', tipo: 'variable', monto: 0, icon: '🛒' },
        { id: 'bud-transporte', name: 'Transporte', tipo: 'variable', monto: 0, icon: '🚌' },
        { id: 'bud-ocio', name: 'Ocio', tipo: 'variable', monto: 0, icon: '🎉' },
      ],
      movs: [],
      plan: { nombre: 'Mi meta de ahorro', fecha: inAYear(), ahorroMensual: 0, items: [] },
    },
    push: { url: '', token: '', enabled: false },
    agendaAlerts: { on: true, lead: 15 },
    subjects: [],
    schedule: [],
    bonus: {},
    running: { plan: null },
    bodyComp: {},
    profile: { sex: 'm' },
    notifs: {},
    health: false,
  };
}

function withDefaults(d: State | undefined): State {
  const D = defaultState();
  if (!d) return D;
  return {
    ...D,
    ...d,
    goals: { ...D.goals, ...(d.goals || {}) },
    finance: { ...D.finance, ...(d.finance || {}), plan: { ...D.finance.plan, ...((d.finance || {}).plan || {}) } },
    fasting: { windows: [], ...(d.fasting || {}) },
    running: { plan: null, ...(d.running || {}) },
    profile: { ...D.profile, ...(d.profile || {}) },
    program: d.program && Array.isArray(d.program.weeks) ? d.program : D.program,
  };
}

export function getState(): State {
  return withDefaults(recs[DOC_ID]?.data);
}

/* Igual que `up` en NORTE: recibe una copia del estado, la modificás y se guarda. */
export function up(fn: (s: State) => State | void) {
  const next = structuredClone(getState());
  const out = fn(next) ?? next;
  touch({ id: DOC_ID, kind: 'state', date: '', data: out, updated_at: new Date().toISOString() });
}

export function useAppState(): State {
  const v = useStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getState(), [v]);
}

/* ============ registros (salidas) + adaptador para comida/agua/peso/cuerpo ============ */
const DOC_KINDS = new Set<Kind>(['meal', 'water', 'weight', 'body']);

function docRecs(kind: Kind, s: State): Rec[] {
  const out: Rec[] = [];
  if (kind === 'meal') {
    for (const [date, arr] of Object.entries<any[]>(s.meals || {}))
      (arr || []).forEach((m, i) => out.push({ id: m.id, kind, date, data: m, updated_at: String(i).padStart(4, '0') }));
  } else if (kind === 'water') {
    for (const [date, arr] of Object.entries<any[]>(s.waterLog || {}))
      (arr || []).forEach((w, i) => out.push({ id: w.id, kind, date, data: w, updated_at: String(i).padStart(4, '0') }));
  } else if (kind === 'weight') {
    for (const [date, kg] of Object.entries<any>(s.weightLog || {}))
      out.push({ id: `w-${date}`, kind, date, data: { kg: Number(kg) }, updated_at: '' });
  } else if (kind === 'body') {
    for (const [date, b] of Object.entries<any>(s.bodyComp || {}))
      if (b) out.push({ id: `b-${date}`, kind, date, data: b, updated_at: '' });
  }
  return out;
}

export function addRec<T>(kind: Kind, data: T, date = today()): Rec<T> {
  const now = new Date().toISOString();
  if (DOC_KINDS.has(kind)) {
    const d: any = { ...data };
    let id = d.id || uid();
    up((s) => {
      if (kind === 'meal') { s.meals[date] = [...(s.meals[date] || []), { ...d, id }]; }
      else if (kind === 'water') { s.waterLog[date] = [...(s.waterLog[date] || []), { ...d, id, t: d.t ? new Date(d.t).toISOString() : now }]; }
      else if (kind === 'weight') { s.weightLog[date] = d.kg; id = `w-${date}`; }
      else if (kind === 'body') { s.bodyComp = s.bodyComp || {}; s.bodyComp[date] = d; id = `b-${date}`; }
    });
    return { id, kind, date, data: { ...d, id }, updated_at: now };
  }
  const r: Rec<T> = { id: Crypto.randomUUID(), kind, date, data, updated_at: now };
  touch(r);
  return r;
}

export function updateRec<T>(id: string, patch: Partial<T>) {
  const r = recs[id];
  if (!r) return;
  touch({ ...r, data: { ...r.data, ...patch }, updated_at: new Date().toISOString() });
}

export function removeRec(id: string) {
  if (recs[id] && id !== DOC_ID) {
    touch({ ...recs[id], deleted: true, updated_at: new Date().toISOString() });
    return;
  }
  up((s) => {
    if (id.startsWith('w-')) { delete s.weightLog[id.slice(2)]; return; }
    if (id.startsWith('b-')) { if (s.bodyComp) delete s.bodyComp[id.slice(2)]; return; }
    for (const k of ['meals', 'waterLog'])
      for (const date of Object.keys(s[k] || {})) s[k][date] = (s[k][date] || []).filter((x: any) => x.id !== id);
  });
}

/* ---------- ajustes: vista simplificada sobre el estado (metas, plan, ayuno, perfil) ---------- */
export type Settings = {
  name?: string;
  sex?: 'm' | 'f';
  height?: number;
  goals: { kcal: number; protein: number; carbs: number; fat: number; waterMl: number };
  runPlan: { startDate: string; startKm: number; stepKm: number; everyDays: number; maxKm: number } | null;
  fasting: { id: string; days: number[]; start: string; end: string }[];
  notifs?: Partial<NotifSettings>;
  health?: boolean; // conectado a Apple Health / Health Connect
  theme?: 'system' | 'light' | 'dark';
};

function settingsOf(s: State): Settings {
  return {
    name: s.profile?.name,
    sex: s.profile?.sex,
    height: s.profile?.height,
    goals: s.goals,
    runPlan: s.running?.plan || null,
    fasting: s.fasting?.windows || [],
    notifs: s.notifs || {},
    health: !!s.health,
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system',
  };
}

export function setSettings(patch: Partial<Settings>) {
  up((s) => {
    if ('name' in patch) s.profile = { ...s.profile, name: patch.name };
    if ('sex' in patch) s.profile = { ...s.profile, sex: patch.sex };
    if ('height' in patch) s.profile = { ...s.profile, height: patch.height };
    if (patch.goals) s.goals = { ...s.goals, ...patch.goals };
    if ('runPlan' in patch) s.running = { ...(s.running || {}), plan: patch.runPlan };
    if (patch.fasting) s.fasting = { ...(s.fasting || {}), windows: patch.fasting };
    if (patch.notifs) s.notifs = patch.notifs;
    if ('health' in patch) s.health = !!patch.health;
    if (patch.theme) s.theme = patch.theme;
  });
}

/* ---------- hooks ---------- */
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getVersion = () => version;

export function useStoreVersion() {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

/* Registros de un tipo (opcional: de un día), más nuevos primero. */
export function useRecs<T = any>(kind: Kind, date?: string): Rec<T>[] {
  const v = useStoreVersion();
  return useMemo(() => {
    const all = DOC_KINDS.has(kind) ? docRecs(kind, getState()) : Object.values(recs).filter((r) => r.kind === kind && !r.deleted);
    return all
      .filter((r) => date == null || r.date === date)
      .sort((a, b) => (b.date + b.updated_at).localeCompare(a.date + a.updated_at)) as Rec<T>[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, kind, date]);
}

export function useSettings(): Settings {
  const v = useStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => settingsOf(getState()), [v]);
}

export function getRec(id: string): Rec | undefined {
  return recs[id];
}

/* ============ importar desde NORTE ============
   Recibe el backup de NORTE (el JSON de "Exportar backup", o lo que NORTE dejó guardado en
   este navegador) y lo vuelve tu estado de Vamo. Las salidas a correr pasan a ser registros. */
export function isNorteBackup(x: unknown): x is State {
  return !!x && typeof x === 'object' && Array.isArray((x as State).habits);
}

export function importNorte(backup: State): { runs: number } {
  const data = structuredClone(backup);
  const runs: any[] = (data.running && data.running.runs) || [];
  if (data.running) delete data.running.runs;
  // backups viejos de NORTE: agua en vasos (water) y meta en vasos (goals.water)
  if (!data.waterLog && data.water) {
    data.waterLog = Object.fromEntries(Object.entries<number>(data.water).filter(([, n]) => n > 0)
      .map(([d, n]) => [d, [{ id: Crypto.randomUUID(), ml: n * 250, t: d + 'T12:00' }]]));
  }
  if (data.goals && !data.goals.waterMl && data.goals.water) data.goals.waterMl = data.goals.water * 250;
  data.importedFromNorte = new Date().toISOString();
  touch({ id: DOC_ID, kind: 'state', date: '', data: withDefaults(data), updated_at: new Date().toISOString() });
  for (const r of runs) {
    if (!r || !(r.km > 0)) continue;
    const rec: Rec = {
      id: Crypto.randomUUID(), kind: 'run', date: r.date || today(new Date(r.startedAt || Date.now())),
      data: {
        startedAt: r.startedAt || Date.now(), km: r.km, sec: r.sec || 0, kcal: r.kcal || 0, elevGain: r.elevGain || 0,
        splits: r.splits || [], route: r.route || [], paceSeries: r.paceSeries || [], maxKmh: r.maxKmh || 0,
        source: r.source === 'manual' ? 'manual' : 'gps',
      },
      updated_at: new Date().toISOString(),
    };
    touch(rec);
  }
  return { runs: runs.length };
}

/* Exporta todo (estado + salidas) en el mismo formato que NORTE: sirve de backup. */
export function exportAll(): State {
  const s = getState();
  const runs = Object.values(recs).filter((r) => r.kind === 'run' && !r.deleted).map((r) => ({ id: r.id, date: r.date, ...r.data }));
  return { ...s, running: { ...(s.running || {}), runs } };
}

/* ---------- sincronización con Supabase ----------
   Tabla `records` (ver supabase/migrations/). Subimos lo pendiente (upsert) y bajamos lo que
   cambió en el servidor desde la última vez (`server_at`, lo pone la base). */
function scheduleSync() {
  if (!cloud) return;
  syncStatus = 'pending';
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(sync, 1500);
}

export async function sync() {
  if (!cloud || !supabase || !userId || syncing) return;
  syncing = true;
  try {
    const ids = [...dirty];
    if (ids.length) {
      const rows = ids
        .map((id) => recs[id])
        .filter(Boolean)
        .map((r) => ({
          user_id: userId,
          id: r.id,
          kind: r.kind,
          date: r.date,
          data: r.data,
          deleted: !!r.deleted,
          updated_at: r.updated_at,
        }));
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase.from('records').upsert(rows.slice(i, i + 200));
        if (error) throw error;
      }
      ids.forEach((id) => dirty.delete(id));
    }
    // bajamos en páginas de 1000 hasta quedar al día
    for (;;) {
      let q = supabase.from('records').select('id,kind,date,data,deleted,updated_at,server_at').order('server_at').limit(1000);
      if (lastPull) q = q.gt('server_at', lastPull);
      const { data, error } = await q;
      if (error) throw error;
      for (const row of data || []) {
        const local = recs[row.id];
        // gana el cambio más nuevo (un cambio local pendiente más nuevo se respeta)
        if (!local || local.updated_at <= row.updated_at) {
          recs[row.id] = { id: row.id, kind: row.kind, date: row.date, data: row.data, deleted: row.deleted, updated_at: row.updated_at };
          dirty.delete(row.id);
        }
        lastPull = row.server_at;
      }
      if (!data || data.length < 1000) break;
    }
    syncStatus = dirty.size ? 'pending' : 'ok';
    persist();
    emit();
  } catch (e) {
    syncStatus = 'error';
    console.warn('sync', e);
  } finally {
    syncing = false;
  }
}

AppState.addEventListener('change', (s) => {
  if (s === 'active') sync();
});
setInterval(() => sync(), 60000);
