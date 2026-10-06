/* AGENDA (de NORTE): cronograma tuyo y de tu novia (línea de tiempo por día, próximo
   bloque, avisos antes de cada bloque), materias con temas y ritmo de estudio, y el
   Bonus diario (lectura + ejercicio) de la previa de Geografía. */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Bar, Button, Card, Check, Empty, Field, IconBtn, Screen, Section, Segmented } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { BONUS_LESSONS, BONUS_START, BONUS_SUBJECT_ID } from '@/lib/bonusGeografia';
import { useNorte } from '@/lib/norte';
import { DAY_NAMES, DAYS, hm2min, uid } from '@/lib/norteData';
import { up } from '@/lib/store';
import { flash } from '@/lib/toast';

type V = 'cronograma' | 'materias' | 'bonus';

export default function Agenda() {
  const d = useNorte();
  const params = useLocalSearchParams<{ v?: string }>();
  const isV = (v?: string): v is V => v === 'materias' || v === 'bonus' || v === 'cronograma';
  const [view, setView] = useState<V>(() => (isV(params.v) ? params.v : 'cronograma'));
  const [prevParam, setPrevParam] = useState(params.v);
  if (params.v !== prevParam) { setPrevParam(params.v); if (isV(params.v)) setView(params.v); }
  const opts: [V, string][] = [['cronograma', 'Cronograma'], ['materias', 'Materias']];
  if (d.bonusEnabled) opts.push(['bonus', 'Bonus']);
  return (
    <Screen title="Agenda" subtitle={{ cronograma: 'Tu cronograma y el de tu novia', materias: 'Materias y exámenes', bonus: 'Previa de Geografía' }[view]}>
      <View style={{ marginBottom: 14 }}><Segmented options={opts} value={view} onChange={setView} /></View>
      {view === 'cronograma' && <Cronograma />}
      {view === 'materias' && <Materias />}
      {view === 'bonus' && <Bonus />}
    </Screen>
  );
}

/* ---------- Cronograma ---------- */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function EventFields({ val, set }: { val: any; set: (v: any) => void }) {
  const c = useColors();
  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      <Segmented options={[['yo', 'Yo'], ['novia', 'Novia']]} value={val.who} onChange={(v) => set({ ...val, who: v })} />
      <Field placeholder="Actividad (ej: Gym, Vóley, INVAP)" value={val.title} onChangeText={(t) => set({ ...val, title: t })} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {ORDER.map((x) => (
          <Pressable key={x} onPress={() => set({ ...val, day: x })} style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: val.day === x ? c.primary : c.line, backgroundColor: val.day === x ? c.primary : c.card }}>
            <Text style={{ fontWeight: '800', fontSize: 13, color: val.day === x ? '#fff' : c.sub }}>{DAYS[x]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Field placeholder="Inicio 18:00" value={val.start} onChangeText={(t) => set({ ...val, start: t })} />
        <Text style={{ color: c.sub, fontWeight: '700' }}>→</Text>
        <Field placeholder="Fin 19:30" value={val.end} onChangeText={(t) => set({ ...val, end: t })} />
      </View>
      <Text style={{ color: c.sub, fontSize: 12 }}>Dejá la hora de fin vacía para un aviso puntual (ej: “sale del colegio”).</Text>
    </View>
  );
}

function Cronograma() {
  const c = useColors();
  const d = useNorte();
  const s = d.s;
  const [day, setDay] = useState(d.dow);
  const [editEvt, setEditEvt] = useState<string | null>(null);
  const [newEvt, setNewEvt] = useState({ who: 'yo', title: '', day: d.dow, start: '18:00', end: '19:30' });
  const OWNER: Record<string, { color: string; soft: string; ink: string; label: string }> = {
    yo: { color: c.primary, soft: c.primarySoft, ink: c.primaryInk, label: 'Yo' },
    novia: { color: c.pink, soft: c.pinkSoft, ink: c.pinkInk, label: 'Novia' },
  };
  const evts: any[] = s.schedule || [];
  const byDay = (x: number) => evts.filter((e) => e.day === x).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  const aa = s.agendaAlerts || { on: true, lead: 15 };
  const nowMin = d.now.getHours() * 60 + d.now.getMinutes();
  const nextId = evts.filter((e) => e.day === d.dow && e.start).map((e) => ({ id: e.id, min: hm2min(e.start) })).filter((e) => e.min >= nowMin).sort((a, b) => a.min - b.min)[0]?.id;
  const fmt = (e: any) => (e.end ? `${e.start}–${e.end}` : e.start);

  const dayEvts = byDay(day).map((e) => ({ ...e, s: hm2min(e.start), e2: e.end ? hm2min(e.end) : hm2min(e.start) + 20, punt: !e.end }));
  const isSelToday = day === d.dow;
  let timeline: React.ReactNode = null;
  if (dayEvts.length) {
    const minStart = Math.min(...dayEvts.map((x) => x.s));
    const maxEnd = Math.max(...dayEvts.map((x) => x.e2));
    const startH = Math.max(0, Math.floor(minStart / 60));
    let endH = Math.min(24, Math.ceil(maxEnd / 60));
    if (endH <= startH) endH = startH + 1;
    const PXM = 1.0, gutter = 48;
    const totalH = (endH - startH) * 60 * PXM;
    // columnas para bloques que se solapan
    const cols: Record<string, { col: number; n: number }> = {};
    let cluster: any[] = [], clusterEnd = -1;
    const flush = () => {
      const ends: number[] = [];
      cluster.forEach((ev) => {
        let placed = ends.findIndex((end) => ev.s >= end);
        if (placed < 0) { placed = ends.length; ends.push(0); }
        ends[placed] = ev.e2;
        cols[ev.id] = { col: placed, n: 0 };
      });
      cluster.forEach((ev) => { cols[ev.id].n = ends.length; });
      cluster = []; clusterEnd = -1;
    };
    [...dayEvts].sort((a, b) => a.s - b.s || a.e2 - b.e2).forEach((ev) => {
      if (cluster.length && ev.s >= clusterEnd) flush();
      cluster.push(ev); clusterEnd = Math.max(clusterEnd, ev.e2);
    });
    if (cluster.length) flush();
    const nowTop = isSelToday && nowMin >= startH * 60 && nowMin <= endH * 60 ? (nowMin - startH * 60) * PXM : null;
    timeline = (
      <Card style={{ padding: 12 }}>
        <View style={{ height: totalH, position: 'relative' }}>
          {Array.from({ length: endH - startH + 1 }, (_, i) => (
            <View key={i} style={{ position: 'absolute', top: i * 60 * PXM, left: 0, right: 0 }}>
              <Text style={{ position: 'absolute', left: 0, top: -7, width: gutter - 10, textAlign: 'right', fontSize: 11, fontWeight: '700', color: c.sub }}>{String(startH + i).padStart(2, '0')}:00</Text>
              <View style={{ position: 'absolute', left: gutter, right: 0, top: 0, borderTopWidth: 1, borderTopColor: c.line }} />
            </View>
          ))}
          <View style={{ position: 'absolute', left: gutter, right: 0, top: 0, bottom: 0 }}>
            {dayEvts.map((e) => {
              const o = OWNER[e.who] || OWNER.yo;
              const { col, n } = cols[e.id];
              const top = (e.s - startH * 60) * PXM;
              const bh = Math.max(e.punt ? 30 : 36, (e.e2 - e.s) * PXM - 4);
              const isNext = e.id === nextId && isSelToday;
              const w = 100 / n;
              return (
                <Pressable key={e.id} onPress={() => setEditEvt(editEvt === e.id ? null : e.id)} style={{
                  position: 'absolute', top, height: bh, left: `${col * w}%`, width: `${w}%`, paddingHorizontal: 2,
                }}>
                  <View style={{
                    flex: 1, flexDirection: 'row', backgroundColor: o.soft, borderRadius: 12, overflow: 'hidden',
                    borderWidth: 1.5, borderStyle: e.punt ? 'dashed' : 'solid', borderColor: isNext ? c.primary : e.punt ? o.color : 'transparent',
                  }}>
                    <View style={{ width: 4, backgroundColor: o.color }} />
                    <View style={{ flex: 1, paddingVertical: 4, paddingHorizontal: 7 }}>
                      <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '800', color: o.ink }}>{e.title || '—'}</Text>
                      <Text numberOfLines={1} style={{ fontSize: 10.5, fontWeight: '700', color: o.color }}>{fmt(e)}{isNext ? ' · PRÓXIMO' : ''}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {nowTop != null && (
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: nowTop }}>
                <View style={{ position: 'absolute', left: -3, top: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: c.red }} />
                <View style={{ borderTopWidth: 2, borderTopColor: c.red }} />
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  }
  const editing = editEvt ? evts.find((x) => x.id === editEvt) : null;

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {Object.values(OWNER).map((o) => (
            <View key={o.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: o.color }} />
              <Text style={{ color: c.sub, fontWeight: '700', fontSize: 12.5 }}>{o.label}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => up((st) => { const a = st.agendaAlerts || { on: true, lead: 15 }; st.agendaAlerts = { ...a, on: !a.on }; })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: aa.on ? c.primarySoft : c.card, borderWidth: aa.on ? 0 : 1, borderColor: c.line }}>
          <Ionicons name="notifications" size={13} color={aa.on ? c.primaryInk : c.sub} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: aa.on ? c.primaryInk : c.sub }}>{aa.on ? `Avisos ${aa.lead}′ antes` : 'Avisos off'}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
        {ORDER.map((x) => {
          const active = x === day, cnt = byDay(x).length;
          return (
            <Pressable key={x} onPress={() => { setDay(x); setEditEvt(null); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', gap: 4, backgroundColor: active ? c.primary : c.card, borderWidth: active ? 0 : 1, borderColor: c.line }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: active ? '#fff' : x === d.dow ? c.primary : c.sub }}>{DAYS[x]}</Text>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: cnt ? (active ? '#fff' : c.primary) : 'transparent' }} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Text style={{ color: c.ink, fontWeight: '800', fontSize: 17 }}>{DAY_NAMES[day]}</Text>
        {isSelToday && <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#fff', backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' }}>HOY</Text>}
        <Text style={{ marginLeft: 'auto', color: c.sub, fontWeight: '700', fontSize: 12.5 }}>{dayEvts.length} {dayEvts.length === 1 ? 'bloque' : 'bloques'}</Text>
      </View>
      {dayEvts.length ? timeline : (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Ionicons name="calendar-outline" size={26} color={c.sub} />
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 15, marginTop: 8 }}>Día libre</Text>
          <Text style={{ color: c.sub, fontSize: 13 }}>No hay nada agendado para {DAY_NAMES[day].toLowerCase()}.</Text>
        </Card>
      )}

      {editing && (
        <Card style={{ marginTop: 12, borderColor: c.primary, borderWidth: 1.5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: c.ink, fontWeight: '800' }}>Editar bloque</Text>
            <IconBtn onPress={() => setEditEvt(null)}>✕</IconBtn>
          </View>
          <EventFields val={editing} set={(nv) => up((st) => { Object.assign(st.schedule.find((x: any) => x.id === editing.id), nv); })} />
          <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
            <Button small kind="danger" title="Borrar" onPress={() => { setEditEvt(null); up((st) => { st.schedule = st.schedule.filter((x: any) => x.id !== editing.id); }); }} />
          </View>
        </Card>
      )}

      <Section title="Nuevo bloque" />
      <Card>
        <EventFields val={newEvt} set={setNewEvt} />
        <Button title="Agregar al cronograma" style={{ marginTop: 10 }} onPress={() => {
          if (!newEvt.title.trim()) return;
          up((st) => { st.schedule = [...(st.schedule || []), { id: uid(), ...newEvt, title: newEvt.title.trim() }]; });
          setNewEvt({ who: newEvt.who, title: '', day: newEvt.day, start: '18:00', end: '19:30' });
        }} />
      </Card>
    </>
  );
}

/* ---------- Materias ---------- */
function Materias() {
  const c = useColors();
  const d = useNorte();
  const [editSub, setEditSub] = useState<string | null>(null);
  const [temaDraft, setTemaDraft] = useState<Record<string, string>>({});
  const [newSub, setNewSub] = useState<any>(null);
  const ESTADOS: Record<string, { label: string; color: string; bg: string }> = {
    previa: { label: 'Previa', color: c.red, bg: 'rgba(255,59,48,0.12)' },
    cursando: { label: 'Cursando', color: c.primary, bg: c.primarySoft },
    aprobada: { label: 'Aprobada', color: c.okInk, bg: c.greenSoft },
  };
  const ORDEN: Record<string, number> = { previa: 0, cursando: 1, aprobada: 2 };
  const lista = [...d.subjects].sort((a, b) => (ORDEN[a.estado] ?? 1) - (ORDEN[b.estado] ?? 1) || (a.examen || '9999').localeCompare(b.examen || '9999'));
  const setSub = (id: string, fn: (m: any) => void) => up((st) => { const m = (st.subjects || []).find((x: any) => x.id === id); if (m) fn(m); });
  const addTema = (id: string) => {
    const t = (temaDraft[id] || '').trim();
    if (!t) return;
    setSub(id, (m) => { m.temas = m.temas || []; m.temas.push({ id: uid(), text: t, done: false }); });
    setTemaDraft((x) => ({ ...x, [id]: '' }));
  };
  // se llama como función (no como <Componente/>) para no remontar los inputs y perder el foco
  const subFields = (val: any, set: (v: any) => void) => (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field placeholder="Materia (ej: Geografía)" value={val.name} onChangeText={(t) => set({ ...val, name: t })} />
        <View style={{ width: 90 }}><Field placeholder="Año" value={val.curso} onChangeText={(t) => set({ ...val, curso: t })} /></View>
      </View>
      <Segmented options={[['previa', 'Previa'], ['cursando', 'Cursando'], ['aprobada', 'Aprobada']]} value={val.estado} onChange={(v) => set({ ...val, estado: v })} />
      <Field label="FECHA DE EXAMEN (AAAA-MM-DD, opcional)" value={val.examen || ''} onChangeText={(t) => set({ ...val, examen: t })} />
    </View>
  );

  return (
    <>
      {!lista.length && <Card><Empty text="No cargaste materias todavía" /></Card>}
      {lista.map((m) => {
        const est = ESTADOS[m.estado] || ESTADOS.cursando;
        const temas = m.temas || [];
        const hechos = temas.filter((t: any) => t.done).length;
        const pend = temas.length - hechos;
        const dd = m.examen ? d.daysUntil(m.examen) : null;
        const editing = editSub === m.id;
        const diasEstudio = dd != null ? Math.max(1, dd - 1) : null;
        const ritmo = pend > 0 && diasEstudio
          ? (pend >= diasEstudio ? `${Math.ceil(pend / diasEstudio)} tema${Math.ceil(pend / diasEstudio) === 1 ? '' : 's'} por día` : `1 tema cada ${Math.floor(diasEstudio / pend)} días`)
          : null;
        return (
          <Card key={m.id} style={{ marginBottom: 10, opacity: m.estado === 'aprobada' && !editing ? 0.7 : 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 }}>{m.name}{m.curso ? <Text style={{ color: c.sub, fontWeight: '700', fontSize: 13.5 }}> · {m.curso}</Text> : null}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden', backgroundColor: est.bg, color: est.color }}>{est.label.toUpperCase()}</Text>
                  {m.examen && m.estado !== 'aprobada' && dd != null && (
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: dd < 0 ? c.sub : dd <= 7 ? c.red : dd <= 14 ? c.amber : c.sub }}>
                      {dd < 0 ? `Fue el ${m.examen.slice(8, 10)}/${m.examen.slice(5, 7)}` : dd === 0 ? 'Examen ¡hoy!' : `Examen ${m.examen.slice(8, 10)}/${m.examen.slice(5, 7)} · faltan ${dd} día${dd === 1 ? '' : 's'}`}
                    </Text>
                  )}
                </View>
              </View>
              <IconBtn onPress={() => setEditSub(editing ? null : m.id)}>{editing ? '✕' : '✎'}</IconBtn>
            </View>
            {editing ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                {subFields(m, (v) => setSub(m.id, (x) => { x.name = v.name; x.curso = v.curso; x.estado = v.estado; x.examen = v.examen; }))}
                <View style={{ alignItems: 'flex-end' }}>
                  <Button small kind="danger" title="Borrar materia" onPress={() => { setEditSub(null); up((st) => { st.subjects = st.subjects.filter((x: any) => x.id !== m.id); }); }} />
                </View>
              </View>
            ) : m.estado !== 'aprobada' && (
              <>
                {temas.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: c.sub, fontSize: 12, fontWeight: '800' }}>TEMAS · {hechos}/{temas.length}</Text>
                      {ritmo && <Text style={{ color: c.primary, fontSize: 12, fontWeight: '800' }}>{ritmo}</Text>}
                    </View>
                    <Bar pct={hechos / temas.length} color={hechos === temas.length ? c.green : c.primary} height={6} />
                    {temas.map((t: any) => (
                      <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.line, marginTop: 4 }}>
                        <Check done={t.done} onPress={() => setSub(m.id, (x) => { const tt = x.temas.find((y: any) => y.id === t.id); tt.done = !tt.done; })} />
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: t.done ? c.sub : c.ink, textDecorationLine: t.done ? 'line-through' : 'none' }}>{t.text}</Text>
                        <IconBtn tone="danger" onPress={() => setSub(m.id, (x) => { x.temas = x.temas.filter((y: any) => y.id !== t.id); })}>✕</IconBtn>
                      </View>
                    ))}
                  </View>
                )}
                {!temas.length && <Text style={{ color: c.sub, fontSize: 12.5, marginTop: 10 }}>Cargá las unidades o temas del programa y andá tachando a medida que los estudiás.</Text>}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'flex-end' }}>
                  <Field placeholder="Nuevo tema (ej: Unidad 1 – Relieve)" value={temaDraft[m.id] || ''} onChangeText={(t) => setTemaDraft({ ...temaDraft, [m.id]: t })} onSubmitEditing={() => addTema(m.id)} />
                  <Button title="＋" onPress={() => addTema(m.id)} />
                </View>
              </>
            )}
          </Card>
        );
      })}
      <Section title="Agregar" />
      {newSub ? (
        <Card style={{ gap: 10 }}>
          {subFields(newSub, setNewSub)}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button kind="ghost" title="Cancelar" style={{ flex: 1 }} onPress={() => setNewSub(null)} />
            <Button title="Crear materia" style={{ flex: 1 }} onPress={() => {
              if (!newSub.name.trim()) { flash('Poné el nombre de la materia'); return; }
              up((st) => { st.subjects = st.subjects || []; st.subjects.push({ ...newSub, id: uid(), name: newSub.name.trim(), temas: [] }); });
              setNewSub(null); flash('📚 Materia agregada');
            }} />
          </View>
        </Card>
      ) : <Button kind="soft" title="＋ Agregar materia" onPress={() => setNewSub({ name: '', curso: '', estado: 'cursando', examen: '' })} />}
    </>
  );
}

/* ---------- Bonus: una lectura + un ejercicio por día ---------- */
function Bonus() {
  const c = useColors();
  const d = useNorte();
  const [sel, setSel] = useState<number | null>(null);
  const idx = Math.min(Math.max(sel ?? d.bonusIdx, 0), BONUS_LESSONS.length - 1);
  const L: any = BONUS_LESSONS[idx];
  const p = d.bonusProg(L.id);
  const hechos = BONUS_LESSONS.filter((x: any) => d.bonusProg(x.id).hecho).length;
  const atrasadas = BONUS_LESSONS.slice(0, d.bonusIdx).filter((x: any) => !d.bonusProg(x.id).hecho);
  const setP = (fn: (x: any, st: any) => void) => up((st) => { st.bonus = st.bonus || {}; st.bonus[L.id] = st.bonus[L.id] || {}; fn(st.bonus[L.id], st); });
  const fechaDe = (i: number) => { const dt = new Date(BONUS_START + 'T00:00:00'); dt.setDate(dt.getDate() + i); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`; };
  const minChars = 120;
  const largo = (p.respuesta || '').trim().length;
  const terminar = () => setP((x, st) => {
    x.hecho = true;
    if (L.tema != null) {
      const m = (st.subjects || []).find((y: any) => y.id === BONUS_SUBJECT_ID);
      const t = m && (m.temas || []).find((y: any) => y.id === `geo2-t${L.tema + 1}`);
      if (t) t.done = true;
    }
  });
  const tag = (text: string, bg: string, color: string) => <Text style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden', backgroundColor: bg, color }}>{text}</Text>;

  return (
    <>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.sub, fontSize: 12, fontWeight: '800' }}>PROGRESO · {hechos}/{BONUS_LESSONS.length}</Text>
          <View style={{ marginTop: 6 }}><Bar pct={hechos / BONUS_LESSONS.length} color={c.primary} height={6} /></View>
        </View>
        {atrasadas.length > 0 && <Button small kind="soft" title={`${atrasadas.length} atrasada${atrasadas.length === 1 ? '' : 's'}`} onPress={() => setSel(BONUS_LESSONS.indexOf(atrasadas[0]))} />}
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 }}>
        <IconBtn onPress={() => idx > 0 && setSel(idx - 1)}>‹</IconBtn>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: '800', color: idx === d.bonusIdx ? c.primary : c.sub }}>
          {idx === d.bonusIdx ? 'HOY' : idx < d.bonusIdx ? 'DÍA ANTERIOR' : 'ADELANTO'} · Día {idx + 1} · {fechaDe(idx)} · {L.unidad}
        </Text>
        <IconBtn onPress={() => idx < BONUS_LESSONS.length - 1 && setSel(idx + 1)}>›</IconBtn>
      </View>

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tag('📖 LECTURA', c.primarySoft, c.scheme === 'dark' ? c.primaryInk : c.primary)}
          {p.hecho && tag('✓ TERMINADA', c.greenSoft, c.okInk)}
        </View>
        <Text style={{ color: c.ink, fontSize: 21, fontWeight: '800', lineHeight: 26 }}>{L.titulo}</Text>
        {L.lectura.map((par: string, i: number) => <Text key={i} style={{ color: c.ink, fontSize: 15, lineHeight: 23 }}>{par}</Text>)}
        <View style={{ backgroundColor: c.soft, borderRadius: 12, padding: 12, gap: 3 }}>
          <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '800' }}>IDEAS CLAVE</Text>
          {L.claves.map((k: string, i: number) => <Text key={i} style={{ color: c.ink, fontSize: 13.5, fontWeight: '600', lineHeight: 20 }}>• {k}</Text>)}
        </View>
        {!p.leido && <View style={{ alignItems: 'flex-end' }}><Button title="Ya lo leí → ejercicio" onPress={() => setP((x) => { x.leido = true; })} /></View>}
      </Card>

      {p.leido && (
        <Card style={{ marginTop: 12, gap: 10 }}>
          {tag('✍️ EJERCICIO', c.amberSoft, c.amberInk)}
          <Text style={{ color: c.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' }}>{L.ejercicio.consigna}</Text>
          <Field multiline value={p.respuesta || ''} placeholder="Escribí tu respuesta acá (se guarda sola)…" onChangeText={(t) => setP((x) => { x.respuesta = t; })} style={{ minHeight: 180, textAlignVertical: 'top', lineHeight: 21 }} />
          {!p.guia ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ flex: 1, color: c.sub, fontSize: 12, fontWeight: '700' }}>{largo < minChars ? `Escribí un poco más para ver la guía (${largo}/${minChars})` : 'Listo, ya podés corregirte'}</Text>
              <Button small kind={largo < minChars ? 'soft' : 'primary'} title="Ver guía de corrección" style={{ opacity: largo < minChars ? 0.5 : 1 }}
                onPress={() => { if (largo < minChars) { flash('Primero intentá responder 💪'); return; } setP((x) => { x.guia = true; }); }} />
            </View>
          ) : (
            <>
              <View style={{ backgroundColor: c.soft, borderRadius: 12, padding: 12, gap: 4 }}>
                <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '800' }}>GUÍA DE CORRECCIÓN · ¿TU RESPUESTA TIENE ESTO?</Text>
                {L.ejercicio.guia.map((g: string, i: number) => <Text key={i} style={{ color: c.ink, fontSize: 13.5, fontWeight: '600', lineHeight: 20 }}>☐ {g}</Text>)}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {p.hecho
                  ? <Text style={{ color: c.okInk, fontWeight: '800' }}>✓ Terminado{L.tema != null ? ' · tema tildado en Materias' : ''}</Text>
                  : <Button title="Lo corregí, terminar" onPress={() => { terminar(); flash('🧠 Bonus del día completo'); }} />}
              </View>
            </>
          )}
        </Card>
      )}
    </>
  );
}

