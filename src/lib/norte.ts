/* Cálculos y acciones de NORTE, sobre el estado de Vamo.
   Es la misma lógica que tenía la PWA (métricas del día, Plan Cut, plata, materias, rachas,
   logros, comandos de NEXO), separada de las pantallas para usarla en todas. */
import { useMemo } from 'react';

import { BONUS_LESSONS, BONUS_SUBJECT_ID, bonusDayIndex } from '@/lib/bonusGeografia';
import { runTargetKm } from '@/lib/fitness';
import { CUT_PHASES, CUT_TIPS, TIPS, dayOfYear, dstr, lastNDays, tonnage, uid } from '@/lib/norteData';
import type { RunData } from '@/lib/runTracker';
import { up, useAppState, useRecs, type State } from '@/lib/store';
import { flash } from '@/lib/toast';

export const FIN_TIPOS: Record<string, { label: string; icon: string; color: string }> = {
  crypto: { label: 'Crypto', icon: 'logo-bitcoin', color: '#F59E0B' },
  wallet: { label: 'Wallets on-chain', icon: 'wallet', color: '#9945FF' },
  broker: { label: 'Brokers', icon: 'business', color: '#0EA5E9' },
  pesos: { label: 'Pesos', icon: 'cash', color: '#FF5A1F' },
  inversion: { label: 'Inversiones', icon: 'trending-up', color: '#FFB020' },
};
export const FIN_GRUPOS = ['crypto', 'wallet', 'broker', 'pesos', 'inversion'];

export function streakOf(h: any, todayKey = dstr()): number {
  let s = 0;
  const d = new Date();
  for (;;) {
    const key = dstr(d);
    if (h.days.includes(d.getDay())) {
      if (h.history[key]) s++;
      else if (key !== todayKey) break;
    }
    d.setDate(d.getDate() - 1);
    if (s > 365) break;
  }
  return s;
}

export function derive(s: State, runs: { date: string; data: RunData }[]) {
  const today = dstr();
  const now = new Date();
  const dow = now.getDay();

  const allTips = [...(s.customTips || []), ...(s.cut ? CUT_TIPS : []), ...TIPS];
  const tip = allTips[dayOfYear() % allTips.length];

  /* ---------- métricas del día ---------- */
  const habitsToday = s.habits.filter((h: any) => h.days.includes(dow));
  const habitsDone = habitsToday.filter((h: any) => h.history[today]).length;
  const wLog = s.workoutLog[today] || {};
  const currentProgWeek = s.program.weeks[s.currentWeek];
  const currentProgDay = currentProgWeek ? currentProgWeek.days[s.currentDay] : null;
  const exDone = currentProgDay ? currentProgDay.exercises.filter((e: any) => wLog[e.id]).length : 0;
  const exTotal = currentProgDay ? currentProgDay.exercises.length : 0;
  const mealsToday: any[] = s.meals[today] || [];
  const sumM = (k: string) => mealsToday.reduce((a, m) => a + (Number(m[k]) || 0), 0);
  const kcal = sumM('kcal'), prot = sumM('protein'), carbs = sumM('carbs'), fat = sumM('fat');
  const waterToday: any[] = (s.waterLog || {})[today] || [];
  const water = waterToday.reduce((a, e) => a + (Number(e.ml) || 0), 0);
  const waterGoal = Number(s.goals.waterMl) || 2000;
  const weightEntriesAll = Object.entries<any>(s.weightLog).sort((a, b) => a[0].localeCompare(b[0]));
  const bodyWeight = weightEntriesAll.length ? Number(weightEntriesAll[weightEntriesAll.length - 1][1]) : 0;

  /* ---------- correr ---------- */
  const runPlan = s.running?.plan || null;
  const runTarget = runPlan ? runTargetKm(runPlan, today) : 0;
  const runsToday = runs.filter((r) => r.date === today);
  const runKmToday = Math.round(runsToday.reduce((a, r) => a + (r.data.km || 0), 0) * 100) / 100;
  const runKcalToday = runsToday.reduce((a, r) => a + (r.data.kcal || 0), 0);

  /* ---------- Plan Cut ---------- */
  const cut = s.cut;
  const cutBfEntries = cut ? Object.entries<any>(cut.bfLog || {}).sort((a, b) => a[0].localeCompare(b[0])) : [];
  const cutBf = cutBfEntries.length ? Number(cutBfEntries[cutBfEntries.length - 1][1]) : cut ? Number(cut.startBf) : 0;
  const cutPhaseIdx = cutBf > 15 ? 0 : cutBf > 12 ? 1 : 2;
  const cutDone = !!cut && cutBf <= 8;
  const cutPhase = CUT_PHASES[cutPhaseIdx];
  const cutPhaseStartBf = cutPhaseIdx === 0 ? Math.max(Number(cut?.startBf) || 30, 15.5) : cutPhaseIdx === 1 ? 15 : 12;
  const cutPhasePct = cut ? Math.min(1, Math.max(0, (cutPhaseStartBf - cutBf) / (cutPhaseStartBf - cutPhase.target))) : 0;
  const cutManualToday = (cut && cut.manual && cut.manual[today]) || {};
  const cutMissions = cut ? [
    { id: 'meal', auto: true, text: 'Registrá tus comidas de hoy', done: mealsToday.length > 0 },
    { id: 'prot', auto: true, text: `Llegá a ${s.goals.protein} g de proteína`, done: prot >= s.goals.protein },
    { id: 'water', auto: true, text: 'Completá tu meta de agua', done: water >= waterGoal },
    ...(exTotal > 0 ? [{ id: 'train', auto: true, text: 'Completá el entreno de hoy', done: exDone >= exTotal }] : []),
    ...(cutPhaseIdx >= 1 ? [
      { id: 'weigh', auto: true, text: 'Pesate hoy (siempre a la misma hora)', done: !!s.weightLog[today] },
      { id: 'allmeals', auto: true, text: 'Registrá todas las comidas (mínimo 3)', done: mealsToday.length >= 3 },
    ] : []),
    ...(cutPhaseIdx >= 2 ? [
      { id: 'clean', auto: false, text: 'Cero ultraprocesados hoy', done: !!cutManualToday.clean },
      { id: 'fast', auto: false, text: 'Ayuno intermitente (si lo usaste hoy)', done: !!cutManualToday.fast },
    ] : []),
  ] : [];
  const cutMissionsDone = cutMissions.filter((m) => m.done).length;
  const cutXp = (() => {
    if (!cut) return 0;
    let xp = 0;
    Object.entries<any>(s.meals).forEach(([d, arr]) => { if (d >= cut.startDate && (arr || []).length) xp += 10; });
    Object.entries<any>(s.sessionLog).forEach(([d, arr]) => { if (d >= cut.startDate && (arr || []).length) xp += 15; });
    Object.keys(s.weightLog).forEach((d) => { if (d >= cut.startDate) xp += 5; });
    xp += cutBfEntries.length * 20;
    return xp;
  })();

  /* ---------- resumen ---------- */
  const parts: number[] = [];
  if (habitsToday.length) parts.push(habitsDone / habitsToday.length);
  if (exTotal) parts.push(exDone / exTotal);
  parts.push(Math.min(1, water / waterGoal));
  const dayPct = parts.reduce((a, b) => a + b, 0) / parts.length;

  const week = lastNDays(7);
  const weekTrained = week.filter((d: Date) => (s.sessionLog[dstr(d)] || []).length > 0).length;
  const weekHabitPct = (() => {
    let done = 0, total = 0;
    week.forEach((d: Date) => s.habits.forEach((h: any) => {
      if (h.days.includes(d.getDay())) { total++; if (h.history[dstr(d)]) done++; }
    }));
    return total ? Math.round((done / total) * 100) : 0;
  })();
  const totalWorkouts = Object.keys(s.sessionLog).filter((k) => (s.sessionLog[k] || []).length > 0).length;
  const bestStreak = Math.max(0, ...s.habits.map((h: any) => streakOf(h, today)));

  const ACHIEVEMENTS = [
    { icon: 'leaf', name: 'Primer paso', desc: 'Completá tu primer entrenamiento', done: totalWorkouts >= 1 },
    { icon: 'flame', name: 'En racha', desc: '7 días de racha en un hábito', done: bestStreak >= 7 },
    { icon: 'flash', name: 'Imparable', desc: '30 días de racha en un hábito', done: bestStreak >= 30 },
    { icon: 'barbell', name: 'Habitué', desc: '10 entrenamientos registrados', done: totalWorkouts >= 10 },
    { icon: 'trophy', name: 'Máquina', desc: '50 entrenamientos registrados', done: totalWorkouts >= 50 },
    { icon: 'water', name: 'Hidratado', desc: 'Meta de agua cumplida hoy', done: water >= waterGoal },
    { icon: 'trending-up', name: 'Bajo control', desc: 'Registrá tu peso 7 días', done: Object.keys(s.weightLog).length >= 7 },
    { icon: 'nutrition', name: 'Nutrición al día', desc: 'Registrá 20 comidas', done: Object.values<any>(s.meals).flat().length >= 20 },
    { icon: 'locate', name: 'Modo Cut', desc: 'Empezá el Plan Cut', done: !!cut },
    { icon: 'ribbon', name: 'Fase 2 🎯', desc: 'Bajá a 15% de grasa', done: !!cut && cutBf <= 15 },
    { icon: 'flame', name: 'Fase 3 🔥', desc: 'Bajá a 12% de grasa', done: !!cut && cutBf <= 12 },
    { icon: 'trophy', name: 'Shredded 🏆', desc: 'Llegá al 8% de grasa', done: cutDone },
  ];
  const achDone = ACHIEVEMENTS.filter((a) => a.done).length;

  /* ---------- plata ---------- */
  const fin = s.finance;
  const usdRate = Number(fin.usdRate) || 1400;
  const accounts: any[] = fin.accounts || [];
  const toARS = (a: any) => (a.moneda === 'USD' ? (Number(a.saldo) || 0) * usdRate : Number(a.saldo) || 0);
  const totalARS = accounts.reduce((sum, a) => sum + toARS(a), 0);
  const totalUSD = usdRate ? totalARS / usdRate : 0;
  // cuentas con un tipo desconocido van a Pesos / Crypto según su moneda (que nunca queden ocultas)
  const grupoDe = (a: any) => (FIN_TIPOS[a.tipo] ? a.tipo : a.moneda === 'USD' ? 'crypto' : 'pesos');
  const finByTipo = FIN_GRUPOS.map((t) => ({
    tipo: t, ...FIN_TIPOS[t],
    accounts: accounts.filter((a) => grupoDe(a) === t),
    totalARS: accounts.filter((a) => grupoDe(a) === t).reduce((sum, a) => sum + toARS(a), 0),
  })).filter((g) => g.accounts.length);
  const finTrend = (() => {
    const cutoff = dstr(new Date(Date.now() - 30 * 86400000));
    let base = 0, hasBase = false;
    accounts.forEach((a) => {
      const keys = Object.keys(a.history || {}).filter((k) => k >= cutoff).sort();
      if (keys.length) {
        const v = a.history[keys[0]];
        base += a.moneda === 'USD' ? (Number(v) || 0) * usdRate : Number(v) || 0;
        hasBase = true;
      } else base += toARS(a);
    });
    return hasBase ? totalARS - base : null;
  })();
  const debts: any[] = fin.debts || [];
  const totalDebt = debts.reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const netARS = totalARS - totalDebt;
  const budget: any[] = fin.budget || [];
  const movs: any[] = fin.movs || [];
  const monthSummary = (ym: string) => {
    const ms = movs.filter((m) => (m.fecha || '').startsWith(ym));
    const sum = (arr: any[]) => arr.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    const egr = ms.filter((m) => m.tipo === 'egreso');
    const ingresos = sum(ms.filter((m) => m.tipo === 'ingreso'));
    const egresos = sum(egr);
    return {
      ms, ingresos, egresos, ahorro: ingresos - egresos,
      fijos: sum(egr.filter((m) => m.clase === 'fijo')),
      variables: sum(egr.filter((m) => m.clase !== 'fijo')),
      porCat: egr.reduce((acc: Record<string, number>, m) => { acc[m.cat] = (acc[m.cat] || 0) + (Number(m.monto) || 0); return acc; }, {}),
    };
  };
  const curMonth = today.slice(0, 7);
  const plan = fin.plan;
  const planMeta = (plan.items || []).reduce((sum: number, i: any) => sum + (Number(i.monto) || 0), 0);
  const planDias = Math.ceil((new Date(plan.fecha + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
  const planMeses = planDias > 0 ? Math.max(1, Math.round(planDias / 30.44)) : 0;
  const planFalta = Math.max(0, planMeta - netARS);
  const planPorMes = planMeses ? planFalta / planMeses : planFalta;

  /* ---------- materias y bonus ---------- */
  const subjects: any[] = s.subjects || [];
  const daysUntil = (fecha: string) => Math.ceil((new Date(fecha + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
  const upcomingExams = subjects
    .filter((m) => m.estado !== 'aprobada' && m.examen && daysUntil(m.examen) >= 0)
    .sort((a, b) => a.examen.localeCompare(b.examen));
  const bonusEnabled = subjects.some((m) => m.id === BONUS_SUBJECT_ID);
  const bonusIdx = Math.min(Math.max(bonusDayIndex(today), 0), BONUS_LESSONS.length - 1);
  const bonusHoy = BONUS_LESSONS[bonusIdx];
  const bonusProg = (id: string) => (s.bonus || {})[id] || {};
  const bonusPendHoy = bonusEnabled && bonusDayIndex(today) < BONUS_LESSONS.length && !bonusProg(bonusHoy.id).hecho;

  return {
    s, today, dow, now, tip,
    habitsToday, habitsDone, wLog, currentProgWeek, currentProgDay, exDone, exTotal,
    mealsToday, kcal, prot, carbs, fat, waterToday, water, waterGoal, weightEntriesAll, bodyWeight,
    runPlan, runTarget, runKmToday, runKcalToday,
    cut, cutBfEntries, cutBf, cutPhaseIdx, cutDone, cutPhase, cutPhasePct, cutMissions, cutMissionsDone, cutXp,
    dayPct, weekTrained, weekHabitPct, totalWorkouts, bestStreak, ACHIEVEMENTS, achDone,
    usdRate, accounts, toARS, totalARS, totalUSD, finByTipo, finTrend, debts, totalDebt, netARS, budget, movs,
    monthSummary, curMonth, plan, planMeta, planDias, planMeses, planFalta, planPorMes,
    subjects, daysUntil, upcomingExams, bonusEnabled, bonusIdx, bonusHoy, bonusProg, bonusPendHoy,
  };
}

export type Derived = ReturnType<typeof derive>;

export function useNorte(): Derived {
  const s = useAppState();
  const runs = useRecs<RunData>('run');
  return useMemo(() => derive(s, runs), [s, runs]);
}

/* ============ acciones ============ */
export function toggleHabit(id: string, date = dstr()) {
  up((s) => {
    const h = s.habits.find((x: any) => x.id === id);
    if (!h) return;
    if (h.history[date]) delete h.history[date]; else h.history[date] = true;
  });
}

export function toggleEx(ex: any) {
  const today = dstr();
  up((s) => {
    s.workoutLog[today] = s.workoutLog[today] || {};
    s.sessionLog[today] = s.sessionLog[today] || [];
    if (s.workoutLog[today][ex.id]) {
      delete s.workoutLog[today][ex.id];
      s.sessionLog[today] = s.sessionLog[today].filter((x: any) => x.id !== ex.id);
      if (s.exerciseHistory[ex.name])
        s.exerciseHistory[ex.name] = s.exerciseHistory[ex.name].filter((x: any) => x.date !== today);
    } else {
      const maxWeight = Math.max(0, ...ex.sets.map((st: any) => Number(st.weight) || 0));
      s.workoutLog[today][ex.id] = true;
      // workSets = series realmente cargadas (con reps); alimenta el análisis de carga muscular
      const workSets = ex.sets.filter((st: any) => Number(st.reps) > 0).length;
      s.sessionLog[today].push({ id: ex.id, name: ex.name, setsCount: ex.sets.length, workSets, tonnage: tonnage(ex) });
      s.exerciseHistory[ex.name] = s.exerciseHistory[ex.name] || [];
      if (!s.exerciseHistory[ex.name].some((x: any) => x.date === today))
        s.exerciseHistory[ex.name].push({ date: today, weight: maxWeight });
    }
  });
}

export function addWater(ml: number) {
  const today = dstr();
  up((s) => {
    s.waterLog = s.waterLog || {};
    s.waterLog[today] = [...(s.waterLog[today] || []), { id: uid(), ml, t: new Date().toISOString() }];
  });
}

export function addExerciseToCurrentDay(exName: string, weight: string | number) {
  let ok = false;
  up((s) => {
    const day = s.program.weeks[s.currentWeek]?.days[s.currentDay];
    if (!day) return;
    ok = true;
    if (!day.exercises.some((x: any) => x.name === exName)) {
      day.exercises.push({
        id: uid(), name: exName, intensity: '', rest: '',
        sets: [{ weight: String(weight || ''), reps: '', rir: '' }, { weight: '', reps: '', rir: '' }, { weight: '', reps: '', rir: '' }],
      });
    }
  });
  flash(ok ? `"${exName}" agregado a tu día actual` : 'Primero elegí un día en Rutina (o cargá tu programa).');
}

export function toggleCutManual(id: string) {
  const today = dstr();
  up((s) => {
    s.cut.manual = s.cut.manual || {};
    s.cut.manual[today] = s.cut.manual[today] || {};
    if (s.cut.manual[today][id]) delete s.cut.manual[today][id]; else s.cut.manual[today][id] = true;
  });
}

/* Comandos que NEXO manda a la app (mismos que NORTE). */
export function applyCmd(c: any) {
  if (!c || !c.type) return;
  const today = dstr();
  if (c.type === 'agenda_add') {
    up((s) => { s.schedule = [...(s.schedule || []), { id: uid(), who: c.who === 'novia' ? 'novia' : 'yo', title: c.title || 'Bloque', day: Number(c.day) || 0, start: c.start || '18:00', end: c.end || '' }]; });
    flash(`🤖 NEXO agregó a tu agenda: ${c.title || 'bloque'}${c.start ? ' · ' + c.start : ''}`);
  } else if (c.type === 'agenda_remove') {
    up((s) => { s.schedule = (s.schedule || []).filter((e: any) => !(e.day === Number(c.day) && (!c.title || (e.title || '').toLowerCase().includes(String(c.title).toLowerCase())))); });
    flash(`🤖 NEXO sacó de tu agenda: ${c.title || 'un bloque'}`);
  } else if (c.type === 'reminder_add') {
    up((s) => { s.reminders = [...(s.reminders || []), { id: uid(), text: c.text || 'Recordatorio', time: c.time || '18:00', days: Array.isArray(c.days) && c.days.length ? c.days : [0, 1, 2, 3, 4, 5, 6] }]; });
    flash(`🤖 NEXO agregó un recordatorio: ${c.text || ''}`);
  } else if (c.type === 'water_add') {
    const ml = Math.max(50, Math.min(3000, Number(c.ml) || Math.max(1, Math.min(20, Number(c.n) || 1)) * 250));
    addWater(ml);
    flash(`🤖 NEXO sumó ${ml} ml de agua 💧`);
  } else if (c.type === 'weight_set') {
    const kg = Number(String(c.kg).replace(',', '.'));
    if (kg > 0) { up((s) => { s.weightLog[today] = kg; }); flash(`🤖 NEXO registró tu peso: ${kg} kg`); }
  } else if (c.type === 'habit_done') {
    const q = String(c.query || '').toLowerCase().trim();
    up((s) => { const h = (s.habits || []).find((x: any) => q && x.name.toLowerCase().includes(q)); if (h) h.history[today] = true; });
    flash(`🤖 NEXO marcó tu hábito${q ? ': ' + c.query : ''} ✅`);
  } else if (c.type === 'train_done') {
    up((s) => {
      const wk = s.program?.weeks?.[s.currentWeek];
      const day = wk && wk.days[s.currentDay];
      s.workoutLog[today] = s.workoutLog[today] || {};
      s.sessionLog[today] = s.sessionLog[today] || [];
      if (day) day.exercises.forEach((ex: any) => {
        if (!s.workoutLog[today][ex.id]) {
          s.workoutLog[today][ex.id] = true;
          s.sessionLog[today].push({ id: ex.id, name: ex.name, setsCount: (ex.sets || []).length, tonnage: 0 });
        }
      });
      if (!s.sessionLog[today].length) s.sessionLog[today].push({ id: uid(), name: 'Entreno', setsCount: 0, tonnage: 0 });
    });
    flash('🤖 NEXO marcó tu entreno de hoy 💪');
  } else if (c.type === 'meal_add') {
    up((s) => {
      s.meals[today] = s.meals[today] || [];
      s.meals[today].push({ id: uid(), name: c.name || 'Comida', kcal: Number(c.kcal) || 0, protein: Number(c.protein) || 0, carbs: Number(c.carbs) || 0, fat: Number(c.fat) || 0 });
    });
    flash(`🤖 NEXO registró una comida${c.name ? ': ' + c.name : ''} 🍽️`);
  }
}
