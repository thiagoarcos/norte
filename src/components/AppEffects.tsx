/* Lo que NORTE hacía "de fondo" mientras la app está abierta:
   - avisos en pantalla: recordatorios, bloques de la agenda (X min antes), ayuno, Plan Cut
   - celebración al subir de nivel en el Plan Cut
   - notificaciones: locales en el teléfono / por el servidor en la web
   - NEXO: escucha comandos y le manda el estado del día */
import { useEffect, useRef } from 'react';

import { fastIntervals } from '@/lib/fitness';
import { pushSnapshotSoon, startCommandLoop } from '@/lib/nexo';
import { useNorte } from '@/lib/norte';
import { CUT_PHASES, CUT_TIPS, dayOfYear, dstr } from '@/lib/norteData';
import { rescheduleAll } from '@/lib/notify';
import type { RunData } from '@/lib/runTracker';
import { getState, up, useAppState, useRecs } from '@/lib/store';
import { flash } from '@/lib/toast';
import { registerServiceWorker, scheduleServerPush } from '@/lib/webpush';

export function AppEffects() {
  const s = useAppState();
  const runs = useRecs<RunData>('run');
  const d = useNorte();
  const fired = useRef<Record<string, boolean>>({});

  useEffect(() => { registerServiceWorker(); startCommandLoop(); }, []);

  // Avisos en pantalla (cada 20 s)
  useEffect(() => {
    const check = () => {
      const st = getState();
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const once = (key: string, msg: string) => { if (fired.current[key]) return false; fired.current[key] = true; flash(msg, 12000); return true; };
      for (const r of st.reminders || []) {
        if (r.time === hhmm && r.days.includes(now.getDay())) once(`${r.id}-${dstr(now)}`, r.text);
      }
      const aa = st.agendaAlerts || { on: true, lead: 15 };
      if (aa.on) {
        for (const e of st.schedule || []) {
          if (e.day !== now.getDay() || !e.start) continue;
          const [hh, mm] = e.start.split(':').map(Number);
          const at = new Date(now); at.setHours(hh || 0, mm || 0, 0, 0);
          const n = new Date(at.getTime() - (aa.lead || 0) * 60000);
          if (n.getHours() === now.getHours() && n.getMinutes() === now.getMinutes())
            once(`agenda-${e.id}-${dstr(now)}`, `⏰ En ${aa.lead} min · ${e.title} (${e.start})${e.who === 'novia' ? ' — Novia' : ''}`);
        }
      }
      for (const { start, end } of fastIntervals((st.fasting || {}).windows, now, -1, 1)) {
        const endTxt = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        if (now >= start && now.getTime() - start.getTime() < 60000) once(`fast-${start.getTime()}`, `🕐 Empieza tu ayuno. Hasta las ${endTxt}: solo agua, café o té.`);
        if (now >= end && now.getTime() - end.getTime() < 60000) once(`fast-${end.getTime()}`, '🍽️ ¡Terminó tu ayuno! Ya podés comer.');
      }
    };
    check();
    const iv = setInterval(check, 20000);
    return () => clearInterval(iv);
  }, []);

  // Plan Cut: avisos del día (uno por tipo) y subida de nivel
  const cutActive = !!d.cut;
  useEffect(() => {
    if (!cutActive) return;
    const check = () => {
      const h = new Date().getHours();
      const k = (x: string) => `cutnag-${x}-${dstr()}`;
      const fire = (x: string, msg: string) => { if (fired.current[k(x)]) return false; fired.current[k(x)] = true; flash(msg, 12000); return true; };
      const cur = getState();
      const meals = (cur.meals[dstr()] || []);
      const prot = meals.reduce((a: number, m: any) => a + (Number(m.protein) || 0), 0);
      if (h >= 14 && meals.length === 0 && fire('meals', '👀 Todavía no registraste ninguna comida hoy. ¿Cómo venís con la dieta?')) return;
      if (h >= 20 && prot < cur.goals.protein * 0.7 && fire('prot', '🥩 Te falta proteína para hoy: sumá una buena fuente en la cena.')) return;
      if (h >= 17) fire('tip', '💡 ' + CUT_TIPS[dayOfYear() % CUT_TIPS.length]);
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, [cutActive]);

  useEffect(() => {
    if (!d.cut) return;
    const reached = d.cutDone ? 3 : d.cutPhaseIdx;
    if (reached > (d.cut.lastPhase || 0)) {
      flash(reached >= 3 ? '🏆 ¡LO LOGRASTE! 8% de grasa: completaste el Plan Cut.' : `🎉 ¡Subiste de nivel! Fase ${reached + 1}: ${CUT_PHASES[reached].emoji} ${CUT_PHASES[reached].name}`, 12000);
      up((st) => { st.cut.lastPhase = reached; });
    }
  }, [d.cut, d.cutPhaseIdx, d.cutDone]);

  // Notificaciones: se reprograman solo cuando cambia algo que las afecta
  const notifKey = JSON.stringify([s.reminders, s.schedule, s.agendaAlerts, s.fasting, s.notifs, s.running?.plan, s.goals?.waterMl, !!s.cut, s.push?.enabled]);
  useEffect(() => {
    const st = getState();
    rescheduleAll(st);
    scheduleServerPush(st);
  }, [notifKey]);

  // NEXO: estado del día
  useEffect(() => { pushSnapshotSoon(runs); }, [s, runs]);

  return null;
}
