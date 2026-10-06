/* NEXO (de NORTE): chat con tu asistente vía el relay (worker de Cloudflare), comandos que
   NEXO manda a la app y sync del estado del día. Usa el mismo servidor y token que NORTE
   (vienen con tu backup en state.push). */
import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { applyCmd, derive } from '@/lib/norte';
import { uid } from '@/lib/norteData';
import { getState } from '@/lib/store';

export type Msg = { id: string; role: 'me' | 'nexo'; text: string };

let msgs: Msg[] = [];
let busy = false;
let tts = true;
const ls = new Set<() => void>();
const emit = () => { snapshot = { msgs, busy, tts }; ls.forEach((l) => l()); };
let snapshot = { msgs, busy, tts };
try { tts = localStorage.getItem('vamo-tts') !== '0'; snapshot = { msgs, busy, tts }; } catch {}

const cfg = () => {
  const p = getState().push || {};
  return { url: String(p.url || '').replace(/\/+$/, ''), token: String(p.token || '') };
};
export const nexoConfigured = () => { const c = cfg(); return !!(c.url && c.token); };

export async function pushCall(path: string, payload?: unknown): Promise<Response | null> {
  const c = cfg();
  if (!c.url || !c.token) return null;
  try {
    return await fetch(c.url + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.token },
      body: JSON.stringify(payload || {}),
    });
  } catch { return null; }
}

function say(text: string) {
  if (!tts || !text) return;
  try { Speech.stop(); Speech.speak(text, { language: 'es-AR' }); } catch {}
}

export function setTts(on: boolean) {
  tts = on;
  try { localStorage.setItem('vamo-tts', on ? '1' : '0'); } catch {}
  if (!on) Speech.stop().catch(() => {});
  emit();
}

export function speakMsg(text: string) { say(text); }

/* Respuestas que llegaron con la app cerrada o después de dejar de esperar. */
export async function checkPendingReplies() {
  const r = await pushCall('/chat/peek');
  if (!r || !r.ok) return;
  const j = await r.json().catch(() => null);
  for (const rep of (j && j.replies) || []) { msgs = [...msgs, { id: uid(), role: 'nexo', text: rep.text }]; say(rep.text); }
  emit();
}

export async function sendChat(text: string) {
  const t = text.trim();
  if (!t || busy) return;
  if (!nexoConfigured()) {
    msgs = [...msgs, { id: uid(), role: 'me', text: t }, { id: uid(), role: 'nexo', text: 'Configurá el servidor de NEXO en Más → NEXO (URL y token del relay).' }];
    emit();
    return;
  }
  const id = uid();
  msgs = [...msgs, { id, role: 'me', text: t }];
  busy = true; emit();
  try {
    const r = await pushCall('/chat/send', { id, text: t });
    if (!r || !r.ok) {
      msgs = [...msgs, { id: uid(), role: 'nexo', text: 'No pude contactar el relay. ¿El servidor está bien configurado en Más?' }];
    } else {
      const deadline = Date.now() + 70000;
      let answered = false;
      while (Date.now() < deadline && !answered) {
        const pr = await pushCall('/chat/poll');
        if (!pr || !pr.ok) break;
        const pj = await pr.json().catch(() => null);
        for (const rep of (pj && pj.replies) || []) {
          if (rep.id === id) { msgs = [...msgs, { id: uid(), role: 'nexo', text: rep.text }]; say(rep.text); answered = true; }
        }
      }
      if (!answered) msgs = [...msgs, { id: uid(), role: 'nexo', text: 'NEXO está desconectado ahora mismo. Tu mensaje quedó guardado — en cuanto prendas nexo_bridge.py te va a contestar y te aviso.' }];
    }
  } catch {
    msgs = [...msgs, { id: uid(), role: 'nexo', text: 'Error de conexión.' }];
  }
  busy = false; emit();
}

const sub = (l: () => void) => { ls.add(l); return () => ls.delete(l); };
const snap = () => snapshot;
export const useNexoChat = () => useSyncExternalStore(sub, snap, snap);

/* ---------- comandos de NEXO (long-poll) ---------- */
let polling = false;
export function startCommandLoop() {
  if (polling) return;
  polling = true;
  (async () => {
    while (polling) {
      if (!nexoConfigured()) { await new Promise((r) => setTimeout(r, 15000)); continue; }
      const r = await pushCall('/cmd/poll');
      if (!r || !r.ok) { await new Promise((res) => setTimeout(res, 3000)); continue; }
      const j = await r.json().catch(() => null);
      for (const c of (j && j.commands) || []) applyCmd(c);
    }
  })();
}
export function stopCommandLoop() { polling = false; }

/* ---------- sync del estado del día hacia NEXO/Obsidian (igual que NORTE) ---------- */
let snapTimer: ReturnType<typeof setTimeout> | null = null;
export function pushSnapshotSoon(runs: { date: string; data: any }[]) {
  if (!nexoConfigured()) return;
  if (snapTimer) clearTimeout(snapTimer);
  snapTimer = setTimeout(() => {
    const s = getState();
    const d = derive(s, runs);
    const snapshotData = {
      fecha: d.today,
      gym: {
        hoy: d.currentProgDay ? { nombre: d.currentProgDay.name || 'Entreno', ejercicios: d.currentProgDay.exercises.map((e: any) => e.name).filter(Boolean), hechos: d.exDone, total: d.exTotal } : null,
        entrenoHoy: (s.sessionLog[d.today] || []).length > 0,
        split: (d.currentProgWeek?.days || []).map((x: any) => x.name).filter(Boolean),
      },
      agua: { hoyMl: d.water, metaMl: d.waterGoal },
      nutricion: { kcal: d.kcal, kcalMeta: s.goals.kcal, proteina: d.prot, proteinaMeta: s.goals.protein, carbs: d.carbs, grasa: d.fat, comidas: d.mealsToday.length },
      habitos: d.habitsToday.map((h: any) => ({ nombre: h.name, hecho: !!h.history[d.today] })),
      materias: d.subjects.map((m: any) => ({
        nombre: `${m.name}${m.curso ? ` (${m.curso})` : ''}`, estado: m.estado, examen: m.examen || null,
        diasParaExamen: m.examen ? d.daysUntil(m.examen) : null,
        temas: `${(m.temas || []).filter((t: any) => t.done).length}/${(m.temas || []).length}`,
      })),
      peso: d.bodyWeight || null,
      correr: d.runPlan ? { metaKm: d.runTarget, hoyKm: d.runKmToday } : null,
      cut: d.cut ? { activo: true, bf: d.cutBf, fase: d.cutPhase?.name, objetivo: d.cutPhase?.target, misiones: `${d.cutMissionsDone}/${d.cutMissions.length}` } : { activo: false },
      finanzas: {
        usdRate: d.usdRate,
        patrimonioARS: Math.round(d.totalARS),
        patrimonioUSD: Math.round(d.totalUSD),
        variacion30dARS: d.finTrend != null ? Math.round(d.finTrend) : null,
        porTipo: d.finByTipo.map((g: any) => ({ tipo: g.tipo, ars: Math.round(g.totalARS) })),
        cuentas: d.accounts.map((a: any) => ({ nombre: a.name, tipo: a.tipo, moneda: a.moneda, saldo: Number(a.saldo) || 0, ars: Math.round(d.toARS(a)) })),
        pasivosARS: Math.round(d.totalDebt),
        patrimonioNetoARS: Math.round(d.netARS),
        mes: (() => { const m = d.monthSummary(d.curMonth); return { ingresos: m.ingresos, egresos: m.egresos, fijos: m.fijos, variables: m.variables, ahorro: m.ahorro }; })(),
        meta: { nombre: d.plan.nombre, fecha: d.plan.fecha, objetivoARS: d.planMeta, faltaARS: Math.round(d.planFalta), ahorroPorMesNecesario: Math.round(d.planPorMes) },
      },
    };
    pushCall('/agenda/push', { schedule: s.schedule || [], snapshot: snapshotData });
  }, 1500);
}

AppState.addEventListener('change', (st) => { if (st === 'active') checkPendingReplies(); });
