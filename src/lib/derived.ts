/* Cálculos derivados que usan varias pantallas. */
import { useMemo } from 'react';

import { runTargetKm } from '@/lib/fitness';
import type { RunData } from '@/lib/runTracker';
import { today, useRecs, useSettings } from '@/lib/store';

export type Meal = { name: string; kcal: number; protein: number; carbs: number; fat: number };
export type Water = { ml: number; t: number };
export type Weight = { kg: number };
export type Body = { bf: number; muscle?: number | null; neck?: number; waist?: number; hip?: number; method: 'cinta' | 'balanza' };
export type WorkSet = { exercise: string; weight: number; reps: number; t: number };

export function useBodyWeight(): number {
  const ws = useRecs<Weight>('weight');
  return ws.length ? Number(ws[0].data.kg) || 0 : 0;
}

export function useDay(date = today()) {
  const meals = useRecs<Meal>('meal', date);
  const water = useRecs<Water>('water', date);
  const runs = useRecs<RunData>('run', date);
  const settings = useSettings();
  return useMemo(() => {
    const sum = (k: keyof Meal) => meals.reduce((a, m) => a + (Number(m.data[k]) || 0), 0);
    const runKm = Math.round(runs.reduce((a, r) => a + r.data.km, 0) * 100) / 100;
    return {
      meals, water, runs,
      kcal: sum('kcal'), protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat'),
      waterMl: water.reduce((a, w) => a + (Number(w.data.ml) || 0), 0),
      runKm,
      runKcal: runs.reduce((a, r) => a + (r.data.kcal || 0), 0),
      runTarget: settings.runPlan ? runTargetKm(settings.runPlan, date) : 0,
      settings,
    };
  }, [meals, water, runs, settings, date]);
}

export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
export const durTxt = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60000));
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const dayWord = (d: Date) => {
  const diff = Math.round((new Date(today(d) + 'T00:00:00').getTime() - new Date(today() + 'T00:00:00').getTime()) / 86400000);
  return diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : DAYS[d.getDay()];
};
export const fmtDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
};
