/* Récords personales y medallas, calculados a partir de lo que registrás. */
import { useMemo } from 'react';

import type { Body, Meal, Water } from '@/lib/derived';
import { runTargetKm } from '@/lib/fitness';
import type { RunData } from '@/lib/runTracker';
import { today, useAppState, useRecs, useSettings, type Rec } from '@/lib/store';

export type Record_ = { label: string; km: number; sec: number | null; runId: string | null; date: string | null };
export type Medal = { id: string; icon: string; name: string; desc: string; done: boolean; progress?: number };

/* Mejor tiempo para cubrir `km` kilómetros dentro de una salida, usando los parciales por km. */
function bestWindow(splits: number[], km: number): number | null {
  const whole = Math.floor(km);
  if (!splits || splits.length < whole) return null;
  let best = Infinity;
  for (let i = 0; i + whole <= splits.length; i++) {
    const s = splits.slice(i, i + whole).reduce((a, b) => a + b, 0);
    best = Math.min(best, s);
  }
  // media maratón: los 0,1 km restantes al ritmo promedio de la ventana
  return Number.isFinite(best) ? Math.round(best * (km / whole)) : null;
}

function dayStreak(dates: Set<string>): number {
  let n = 0;
  const d = new Date();
  if (!dates.has(today(d))) d.setDate(d.getDate() - 1); // la racha sigue viva si corriste ayer
  while (dates.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function useRecords() {
  const runs = useRecs<RunData>('run');
  return useMemo(() => {
    const out: Record_[] = [
      { label: '1 km', km: 1, sec: null, runId: null, date: null },
      { label: '5 km', km: 5, sec: null, runId: null, date: null },
      { label: '10 km', km: 10, sec: null, runId: null, date: null },
      { label: 'Media maratón', km: 21.0975, sec: null, runId: null, date: null },
    ];
    for (const r of runs) {
      for (const rec of out) {
        const t = bestWindow(r.data.splits, rec.km);
        if (t && (rec.sec == null || t < rec.sec)) { rec.sec = t; rec.runId = r.id; rec.date = r.date; }
      }
    }
    const longest = runs.reduce<Rec<RunData> | null>((m, r) => (!m || r.data.km > m.data.km ? r : m), null);
    return { list: out, longest };
  }, [runs]);
}

export function useMedals(): Medal[] {
  const runs = useRecs<RunData>('run');
  const st = useAppState();
  const water = useRecs<Water>('water');
  const meals = useRecs<Meal>('meal');
  const bodies = useRecs<Body>('body');
  const settings = useSettings();
  const records = useRecords();

  return useMemo(() => {
    const totalKm = runs.reduce((a, r) => a + r.data.km, 0);
    const maxKm = runs.reduce((a, r) => Math.max(a, r.data.km), 0);
    const runDays = new Set(runs.map((r) => r.date));
    const streak = dayStreak(runDays);
    const fiveK = records.list[1].sec;

    // días con la meta del plan cumplida
    const kmByDay: Record<string, number> = {};
    runs.forEach((r) => { kmByDay[r.date] = (kmByDay[r.date] || 0) + r.data.km; });
    const planDays = settings.runPlan
      ? Object.entries(kmByDay).filter(([d, km]) => d >= settings.runPlan!.startDate && km >= runTargetKm(settings.runPlan!, d)).length
      : 0;

    const mlByDay: Record<string, number> = {};
    water.forEach((w) => { mlByDay[w.date] = (mlByDay[w.date] || 0) + w.data.ml; });
    const waterDays = Object.values(mlByDay).filter((ml) => ml >= settings.goals.waterMl).length;
    const sessionLog = st.sessionLog || {};
    const gymDays = Object.keys(sessionLog).filter((k) => (sessionLog[k] || []).length > 0).length;
    const totalSets = Object.values<any>(sessionLog).flat().reduce((a: number, e: any) => a + (e.workSets || e.setsCount || 0), 0);

    const m = (id: string, icon: string, name: string, desc: string, value: number, goal: number): Medal =>
      ({ id, icon, name, desc, done: value >= goal, progress: Math.min(1, value / goal) });

    return [
      m('run1', '👟', 'Primera salida', 'Registrá tu primera salida', runs.length, 1),
      m('km5', '🥉', '5K', 'Corré 5 km en una salida', maxKm, 5),
      m('km10', '🥈', '10K', 'Corré 10 km en una salida', maxKm, 10),
      m('km21', '🥇', 'Media maratón', 'Corré 21,1 km en una salida', maxKm, 21.0975),
      m('sub30', '⚡', '5K sub 30', 'Bajá de 30 min en 5 km', fiveK != null && fiveK < 1800 ? 1 : 0, 1),
      m('tot50', '🛣️', '50 km', 'Sumá 50 km en total', totalKm, 50),
      m('tot100', '💯', '100 km', 'Sumá 100 km en total', totalKm, 100),
      m('tot500', '🌎', '500 km', 'Sumá 500 km en total', totalKm, 500),
      m('streak7', '🔥', 'Racha de 7', 'Corré 7 días seguidos', streak, 7),
      m('plan14', '🎯', 'Disciplina', 'Cumplí la meta del plan 14 días', planDays, 14),
      m('gym10', '🏋️', 'Habitué', 'Entrená 10 días', gymDays, 10),
      m('sets500', '💪', 'Máquina', 'Registrá 500 series', totalSets, 500),
      m('water7', '💧', 'Hidratado', 'Cumplí la meta de agua 7 días', waterDays, 7),
      m('meals50', '🥗', 'Ojo de nutri', 'Registrá 50 comidas', meals.length, 50),
      m('body1', '📏', 'Me medí', 'Registrá tu % de grasa', bodies.length, 1),
    ];
  }, [runs, st, water, meals, bodies, settings, records]);
}
