/* GYM (de NORTE): cronómetro de descanso, Rutina del día con series (peso/reps/RIR) y PR,
   Programa (semanas/días, importar el Excel del coach o plantillas), Músculos (mapa,
   técnica y análisis de fuerza, saturación, hipertrofia) e Historial. */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { BACK_MUSCLES, BodyMap, FRONT_MUSCLES } from '@/components/BodyMap';
import { Ring } from '@/components/Ring';
import { Bar, Button, Card, Check, Chip, Empty, Field, IconBtn, Note, Section, Segmented } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { Alert } from '@/lib/dialog';
import { pickFile } from '@/lib/files';
import { MUSCLE_KEYS, VOLUME, plannedSets, saturation, weeklySets } from '@/lib/fitness';
import { addExerciseToCurrentDay, toggleEx, useNorte } from '@/lib/norte';
import { EXDB, analyzeLift, fmtClock, fmtDate, parseRoutineWorkbook, tonnage, uid, ytLink } from '@/lib/norteData';
import { addTimer, pauseTimer, resumeTimer, startTimer, stopTimer, useRestTimer } from '@/lib/restTimer';
import { TEMPLATES, emptyProgram, programFromTemplate } from '@/lib/routines';
import type { RunData } from '@/lib/runTracker';
import { up, useRecs } from '@/lib/store';
import { flash } from '@/lib/toast';

type View_ = 'rutina' | 'programa' | 'musculos' | 'historial';

export function GymSection() {
  const [view, setView] = useState<View_>('rutina');
  return (
    <>
      <RestTimer />
      <View style={{ marginBottom: 14 }}>
        <Segmented options={[['rutina', 'Rutina'], ['programa', 'Programa'], ['musculos', 'Músculos'], ['historial', 'Historial']]} value={view} onChange={setView} />
      </View>
      {(view === 'rutina' || view === 'programa') && <Programa mode={view} />}
      {view === 'musculos' && <Musculos />}
      {view === 'historial' && <Historial />}
    </>
  );
}

/* ---------- cronómetro de descanso ---------- */
function RestTimer() {
  const c = useColors();
  const t = useRestTimer();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!t.end) return;
    const iv = setInterval(() => {
      setNow(Date.now());
      if (t.end && Date.now() >= t.end) { stopTimer(); flash('¡Descanso terminado! Siguiente serie'); }
    }, 500);
    return () => clearInterval(iv);
  }, [t.end]);
  const left = t.end ? Math.max(0, Math.ceil((t.end - now) / 1000)) : 0;
  const shown = t.paused ?? left;
  const round = (onPress: () => void, node: React.ReactNode, bg?: string) => (
    <Pressable onPress={onPress} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 14, backgroundColor: bg ?? c.soft, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.9 : 1 }] })}>{node}</Pressable>
  );
  if (t.end || t.paused) {
    return (
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, borderColor: c.amberSoft, borderWidth: 1.5 }}>
        <Ring pct={shown / t.total} size={60} stroke={6} color={c.amber}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: c.ink, fontVariant: ['tabular-nums'] }}>{fmtClock(shown)}</Text>
        </Ring>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15.5, fontWeight: '800', color: c.ink }}>Descanso</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.paused ? c.amberInk : c.sub }}>{t.paused ? 'En pausa' : 'Recuperá para la próxima serie'}</Text>
        </View>
        {round(() => addTimer(30), <Text style={{ fontSize: 12, fontWeight: '900', color: c.sub }}>+30</Text>)}
        {round(t.paused ? resumeTimer : pauseTimer, <Ionicons name={t.paused ? 'play' : 'pause'} size={17} color={c.amberInk} />, c.amberSoft)}
        {round(stopTimer, <Ionicons name="close" size={18} color={c.sub} />)}
      </Card>
    );
  }
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingVertical: 10 }}>
      <Ionicons name="time-outline" size={17} color={c.sub} />
      <Text style={{ color: c.sub, fontWeight: '800', fontSize: 12.5, flex: 1 }}>Descanso</Text>
      {[60, 90, 120].map((s) => (
        <Pressable key={s} onPress={() => startTimer(s)} style={({ pressed }) => ({ backgroundColor: c.primarySoft, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, transform: [{ scale: pressed ? 0.92 : 1 }] })}>
          <Text style={{ fontWeight: '800', fontSize: 13.5, color: c.scheme === 'dark' ? c.primaryInk : c.primary, fontVariant: ['tabular-nums'] }}>{fmtClock(s)}</Text>
        </Pressable>
      ))}
    </Card>
  );
}

/* ---------- input chico para series ---------- */
function Mini({ value, onChange, placeholder, bold, numeric = true }: { value: string; onChange: (v: string) => void; placeholder?: string; bold?: boolean; numeric?: boolean }) {
  const c = useColors();
  return (
    <TextInput value={value ?? ''} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.sub}
      keyboardType={numeric ? 'decimal-pad' : 'default'}
      style={{ flex: 1, minWidth: 0, backgroundColor: c.soft, borderColor: c.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, color: c.ink, fontWeight: bold ? '700' : '500', textAlign: numeric ? 'center' : 'left' }} />
  );
}

/* ---------- Rutina / Programa ---------- */
function Programa({ mode }: { mode: 'rutina' | 'programa' }) {
  const c = useColors();
  const d = useNorte();
  const s = d.s;
  const isRutina = mode === 'rutina';
  const [exDetail, setExDetail] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const progW = s.program.weeks[s.currentWeek];
  const day = progW ? progW.days[s.currentDay] : null;
  const dayTonnage = day ? day.exercises.reduce((a: number, e: any) => a + tonnage(e), 0) : 0;
  const prevDay = day && s.currentWeek > 0 ? s.program.weeks[s.currentWeek - 1].days[s.currentDay] : null;
  const canCopyPrev = !!prevDay && prevDay.exercises.length > 0 && day.exercises.length === 0;
  const prOf = (name: string) => { const h = s.exerciseHistory[name] || []; return h.length ? Math.max(...h.map((x: any) => Number(x.weight) || 0)) : null; };

  const updDay = (fn: (dd: any) => void) => up((st) => { fn(st.program.weeks[st.currentWeek].days[st.currentDay]); });
  const editExercise = (id: string, field: string, value: string) => updDay((dd) => { dd.exercises.find((x: any) => x.id === id)[field] = value; });
  const editSet = (id: string, i: number, field: string, value: string) => updDay((dd) => { dd.exercises.find((x: any) => x.id === id).sets[i][field] = value; });

  const importXlsx = async () => {
    try {
      const f = await pickFile(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '*/*']);
      if (!f) return;
      setImporting(true);
      const parsed: any = await parseRoutineWorkbook(await f.bytes());
      const totalEx = parsed.weeks.reduce((a: number, w: any) => a + w.days.reduce((b: number, dd: any) => b + dd.exercises.length, 0), 0);
      if (!totalEx) { flash("No encontré ejercicios en ese archivo. ¿Tiene el formato de tu coach (hojas 'SEMANA' con bloques 'Día N')?", 6000); return; }
      Alert.alert('Importar rutina', `Encontré ${parsed.weeks.length} semana(s) y ${totalEx} ejercicio(s). Esto reemplaza tu Programa actual.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Importar', onPress: () => { up((st) => { st.program = parsed; st.currentWeek = 0; st.currentDay = 0; }); flash('Rutina importada'); } },
      ]);
    } catch {
      flash('No pude leer ese archivo. ¿Es un .xlsx válido?');
    } finally { setImporting(false); }
  };

  const setProgram = (p: any) => {
    const go = () => up((st) => { st.program = p; st.currentWeek = 0; st.currentDay = 0; });
    if (s.program.weeks.length) Alert.alert('¿Reemplazar tu programa?', 'Se pisa la rutina actual.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Reemplazar', onPress: go }]);
    else go();
  };

  const tab = (label: string, active: boolean, has: boolean, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={{
      flex: 1, minWidth: 36, paddingVertical: 9, borderRadius: 12, alignItems: 'center', gap: 3,
      backgroundColor: active ? c.primary : c.card, borderWidth: active ? 0 : 1, borderColor: c.line,
    }}>
      <Text style={{ fontWeight: '800', fontSize: 13, color: active ? '#fff' : has ? c.ink : c.sub }}>{label}</Text>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: active ? 'rgba(255,255,255,0.9)' : has ? c.primary : 'transparent' }} />
    </Pressable>
  );

  return (
    <>
      {!isRutina && (
        <Card style={{ marginBottom: 10, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="cloud-upload-outline" size={18} color={c.sub} />
            <Text style={{ flex: 1, color: c.sub, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>Importá el Excel que te pasa tu coach y se carga toda la rutina (semanas, días y ejercicios).</Text>
          </View>
          <Button small title={importing ? 'Leyendo…' : 'Importar .xlsx'} onPress={importXlsx} />
          <Text style={{ color: c.sub, fontSize: 12, fontWeight: '700', marginTop: 4 }}>O arrancá de una plantilla:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {TEMPLATES.map((t) => <Chip key={t.id} label={t.name} onPress={() => setProgram(programFromTemplate(t.id))} />)}
            <Chip label="En blanco (3 días)" onPress={() => setProgram(emptyProgram(3))} />
          </View>
          {progW && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button small kind="soft" title="＋ Semana" style={{ flex: 1 }} onPress={() => up((st) => {
                const last = st.program.weeks[st.program.weeks.length - 1];
                st.program.weeks.push({ days: last.days.map((dd: any) => ({ name: dd.name, notes: '', exercises: dd.exercises.map((e: any) => ({ id: uid(), name: e.name, intensity: e.intensity, rest: e.rest, sets: e.sets.map(() => ({ weight: '', reps: '', rir: '' })) })) })) });
              })} />
              <Button small kind="soft" title="＋ Día" style={{ flex: 1 }} onPress={() => up((st) => { st.program.weeks.forEach((w: any) => w.days.push({ name: '', notes: '', exercises: [] })); })} />
            </View>
          )}
        </Card>
      )}

      {!progW && <Card><Empty text={isRutina ? 'Todavía no cargaste tu rutina. Andá a "Programa" para importar tu Excel o elegir una plantilla.' : 'Todavía no hay semanas cargadas.'} /></Card>}

      {progW && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10, minWidth: '100%' }}>
            {s.program.weeks.map((w: any, i: number) => tab(`S${i + 1}`, s.currentWeek === i, w.days.some((dd: any) => dd.exercises.length > 0), () => up((st) => { st.currentWeek = i; st.currentDay = 0; })))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {progW.days.map((dd: any, i: number) => tab(String(i + 1), s.currentDay === i, dd.exercises.length > 0, () => up((st) => { st.currentDay = i; })))}
          </View>

          {!day && <Card><Empty text="Esta semana no tiene días cargados." /></Card>}

          {day && (
            <>
              <Card style={{ gap: 10 }}>
                <Field value={day.name} placeholder={`Nombre del Día ${s.currentDay + 1} (ej: Piernas)`} onChangeText={(t) => updDay((dd) => { dd.name = t; })} style={{ fontWeight: '700', fontSize: 17 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: c.sub, fontWeight: '700', fontSize: 13 }}>Tonelaje total del día</Text>
                  <Text style={{ color: c.ink, fontWeight: '800', fontSize: 18 }}>{dayTonnage.toLocaleString('es-AR')} kg</Text>
                </View>
                <Field label="OBSERVACIONES Y NOTAS" value={day.notes} multiline placeholder="Sensaciones, ajustes, lo que quieras recordar de esta sesión…"
                  onChangeText={(t) => updDay((dd) => { dd.notes = t; })} style={{ minHeight: 60, textAlignVertical: 'top' }} />
              </Card>

              {canCopyPrev && (
                <Card style={{ marginTop: 10, backgroundColor: c.primarySoft, borderColor: c.primarySoft, gap: 10 }}>
                  <Text style={{ color: c.scheme === 'dark' ? c.primaryInk : c.primary, fontWeight: '600', fontSize: 13.5, lineHeight: 19 }}>
                    💡 La Semana {s.currentWeek} ya tiene ejercicios para este día. ¿Copiamos la misma estructura (sin los pesos) para seguir la progresión?
                  </Text>
                  <Button small title={`Copiar ejercicios de Semana ${s.currentWeek}`} onPress={() => up((st) => {
                    const prev = st.program.weeks[st.currentWeek - 1].days[st.currentDay];
                    st.program.weeks[st.currentWeek].days[st.currentDay].exercises = prev.exercises.map((e: any) => ({
                      id: uid(), name: e.name, intensity: e.intensity, rest: e.rest, sets: e.sets.map(() => ({ weight: '', reps: '', rir: '' })),
                    }));
                  })} />
                </Card>
              )}

              <Section title="Ejercicios" />
              {day.exercises.length === 0 && <Card><Empty text="Todavía no cargaste ejercicios para este día." /></Card>}
              {day.exercises.map((e: any) => {
                const showDetail = isRutina && exDetail === e.id;
                const pr = prOf(e.name);
                const hist = (s.exerciseHistory[e.name] || []).slice(-10);
                const dbEx = Object.values<any>(EXDB).flatMap((m) => m.exercises).find((x: any) => x.name === e.name);
                return (
                  <Card key={e.id} style={{ marginBottom: 8, gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {isRutina && <Check color={c.amber} done={!!d.wLog[e.id]} onPress={() => toggleEx(e)} />}
                      <View style={{ flex: 1 }}>
                        <Mini value={e.name} numeric={false} bold placeholder="Nombre del ejercicio (ej: Sentadilla 3x5)" onChange={(t) => editExercise(e.id, 'name', t)} />
                        {isRutina && pr ? <Text style={{ fontSize: 11.5, color: c.amber, fontWeight: '800', marginTop: 4 }}>🏅 PR {pr} kg</Text> : null}
                      </View>
                      {isRutina && (hist.length > 0 || dbEx) && <IconBtn onPress={() => setExDetail(showDetail ? null : e.id)}>{showDetail ? '▲' : 'ℹ️'}</IconBtn>}
                      <IconBtn tone="danger" onPress={() => updDay((dd) => { dd.exercises = dd.exercises.filter((x: any) => x.id !== e.id); })}>✕</IconBtn>
                    </View>

                    {showDetail && (
                      <View style={{ backgroundColor: c.soft, borderRadius: 12, padding: 10, gap: 4 }}>
                        {dbEx && (
                          <>
                            <Text style={{ color: c.ink, fontSize: 13, lineHeight: 19 }}><Text style={{ fontWeight: '800' }}>Técnica: </Text>{dbEx.tip}</Text>
                            <Text onPress={() => Linking.openURL(ytLink(e.name))} style={{ color: c.water, fontWeight: '700', fontSize: 13 }}>▶ Ver cómo se hace →</Text>
                          </>
                        )}
                        {hist.length > 0 && (
                          <>
                            <Text style={{ fontSize: 11.5, fontWeight: '800', color: c.sub, marginTop: 6 }}>HISTORIAL DE PESO</Text>
                            {hist.map((x: any, i: number) => (
                              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: c.sub, fontSize: 13, textTransform: 'capitalize' }}>{fmtDate(x.date)}</Text>
                                <Text style={{ color: Number(x.weight) === pr ? c.amber : c.ink, fontWeight: '700', fontSize: 13 }}>{x.weight} kg{Number(x.weight) === pr ? ' 🏅' : ''}</Text>
                              </View>
                            ))}
                          </>
                        )}
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11.5, color: c.sub, fontWeight: '700', marginBottom: 4 }}>Intensidad (RIR/RPE)</Text>
                        <Mini numeric={false} value={e.intensity} placeholder="rir 1 - @8-9" onChange={(t) => editExercise(e.id, 'intensity', t)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11.5, color: c.sub, fontWeight: '700', marginBottom: 4 }}>Descanso</Text>
                        <Mini numeric={false} value={e.rest} placeholder="3'-4'" onChange={(t) => editExercise(e.id, 'rest', t)} />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6, paddingLeft: 26 }}>
                      {['Peso (kg)', 'Reps', 'RIR'].map((l) => <Text key={l} style={{ flex: 1, fontSize: 11.5, color: c.sub, fontWeight: '700', textAlign: 'center' }}>{l}</Text>)}
                    </View>
                    {e.sets.map((st: any, i: number) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Text style={{ width: 20, textAlign: 'center', fontSize: 12, fontWeight: '800', color: c.sub }}>{i + 1}</Text>
                        <Mini value={st.weight} onChange={(t) => editSet(e.id, i, 'weight', t)} />
                        <Mini value={st.reps} onChange={(t) => editSet(e.id, i, 'reps', t)} />
                        <Mini value={st.rir} onChange={(t) => editSet(e.id, i, 'rir', t)} />
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Button small kind="soft" title="+ Serie" style={{ opacity: e.sets.length >= 6 ? 0.4 : 1 }}
                        onPress={() => updDay((dd) => { const ex = dd.exercises.find((x: any) => x.id === e.id); if (ex.sets.length < 6) ex.sets.push({ weight: '', reps: '', rir: '' }); })} />
                      <Button small kind="ghost" title="− Serie" style={{ opacity: e.sets.length <= 1 ? 0.4 : 1 }}
                        onPress={() => updDay((dd) => { const ex = dd.exercises.find((x: any) => x.id === e.id); if (ex.sets.length > 1) ex.sets.pop(); })} />
                      <View style={{ flex: 1 }} />
                      <Text style={{ fontSize: 12.5, color: c.sub, fontWeight: '700' }}>Tonelaje: <Text style={{ color: c.ink, fontWeight: '800' }}>{tonnage(e).toLocaleString('es-AR')} kg</Text></Text>
                    </View>
                  </Card>
                );
              })}
              <Button title="＋ Agregar ejercicio" onPress={() => updDay((dd) => {
                dd.exercises.push({ id: uid(), name: '', intensity: '', rest: '', sets: [{ weight: '', reps: '', rir: '' }, { weight: '', reps: '', rir: '' }, { weight: '', reps: '', rir: '' }] });
              })} />
            </>
          )}
        </>
      )}
    </>
  );
}

/* ---------- Músculos: ejercicios (técnica + fuerza), saturación, hipertrofia ---------- */
const satLabel = (v: number) => (v >= 0.7 ? 'Saturado' : v >= 0.3 ? 'Recuperando' : 'Listo');

function Musculos() {
  const c = useColors();
  const d = useNorte();
  const s = d.s;
  const runs = useRecs<RunData>('run');
  const [view, setView] = useState<'ejercicios' | 'saturacion' | 'volumen'>('ejercicios');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [openLift, setOpenLift] = useState<string | null>(null);
  const [calc, setCalc] = useState({ w: '', r: '' });
  const satColor = (v: number) => (v >= 0.7 ? c.red : v >= 0.3 ? c.amber : c.green);
  const muscles = side === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;

  const sideToggle = <Segmented options={[['front', 'Frente'], ['back', 'Espalda']]} value={side} onChange={(v) => { setSide(v); setMuscle(null); setOpenLift(null); }} />;

  let body: React.ReactNode = null;
  if (view === 'ejercicios') {
    const md = muscle ? (EXDB as any)[muscle] : null;
    body = (
      <>
        <Card style={{ gap: 12 }}>
          {sideToggle}
          <BodyMap side={side} selected={muscle} onSelect={(m) => { setMuscle(m === muscle ? null : m); setOpenLift(null); }} width={200} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {muscles.map((m) => <Chip key={m} label={(EXDB as any)[m].label} on={muscle === m} onPress={() => { setMuscle(m === muscle ? null : m); setOpenLift(null); }} />)}
          </View>
          <Text style={{ color: c.sub, textAlign: 'center', fontSize: 12.5 }}>Tocá un músculo en el cuerpo o en las etiquetas.</Text>
        </Card>
        {!d.bodyWeight && <View style={{ marginTop: 10 }}><Note tone="warn">💡 Registrá tu peso corporal (Salud → Cuerpo) para que el análisis de fuerza sea relativo a tu peso.</Note></View>}
        {md && (
          <>
            <Section title={`Ejercicios de ${md.label.toLowerCase()}`} />
            {md.exercises.map((e: any) => {
              const open = openLift === e.name;
              const an = open ? analyzeLift(e, calc.w, calc.r, d.bodyWeight) : null;
              const toneColor = an ? ({ up: c.primary, ok: c.water, hold: c.amber, down: c.red } as any)[an.tone] : c.sub;
              const inRoutine = !!d.currentProgDay && d.currentProgDay.exercises.some((x: any) => x.name === e.name);
              return (
                <Card key={e.name} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.ink, fontWeight: '700', fontSize: 15 }}>{e.name}{inRoutine ? <Text style={{ fontSize: 11, color: c.primary, fontWeight: '800' }}> · en tu día actual ✓</Text> : null}</Text>
                      <Text style={{ color: c.sub, fontSize: 12.5, fontWeight: '600' }}>{e.eq}{e.ratio ? ' · con análisis de fuerza' : ''}</Text>
                    </View>
                    <Button small kind="soft" title={open ? '▲' : 'Ver'} onPress={() => { setOpenLift(open ? null : e.name); setCalc({ w: '', r: '' }); }} />
                  </View>
                  {open && (
                    <View style={{ marginTop: 12, gap: 10 }}>
                      <View style={{ backgroundColor: c.soft, borderRadius: 12, padding: 12 }}>
                        <Text style={{ color: c.ink, fontSize: 13.5, lineHeight: 20 }}><Text style={{ fontWeight: '800' }}>Técnica: </Text>{e.tip}</Text>
                      </View>
                      <Text onPress={() => Linking.openURL(ytLink(e.name))} style={{ color: c.water, fontWeight: '700', fontSize: 13.5 }}>▶ Ver cómo se hace (videos de referencia) →</Text>
                      <Text style={{ color: c.ink, fontWeight: '700', fontSize: 13.5 }}>¿Cómo venís con este ejercicio?</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Field label="Peso que usás (kg)" keyboardType="decimal-pad" value={calc.w} placeholder="0 si es sin peso" onChangeText={(t) => setCalc({ ...calc, w: t })} />
                        <Field label="Reps que lográs" keyboardType="number-pad" value={calc.r} placeholder="ej: 10" onChangeText={(t) => setCalc({ ...calc, r: t })} />
                      </View>
                      {an && (
                        <View style={{ borderLeftWidth: 4, borderLeftColor: toneColor, backgroundColor: c.soft, borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontWeight: '800', fontSize: 14, color: toneColor, marginBottom: 4 }}>
                            {an.tone === 'up' ? '📈 Momento de subir' : an.tone === 'ok' ? '✓ Vas por buen camino' : an.tone === 'hold' ? '🏋️ Consolidá este peso' : '⚠️ Ajustá la carga'}
                          </Text>
                          <Text style={{ color: c.ink, fontSize: 13.5, lineHeight: 20 }}>{an.advice}</Text>
                          {an.e1rm ? (
                            <Text style={{ color: c.sub, fontSize: 12.5, marginTop: 6, fontWeight: '600' }}>
                              Tu 1RM estimado: ~{an.e1rm} kg{an.level ? ` · Nivel: ${an.level}` : ''}{an.nextTarget ? ` · Próxima meta: ${an.nextTarget} kg de 1RM` : ''}{d.bodyWeight ? ` (peso corporal: ${d.bodyWeight} kg)` : ''}
                            </Text>
                          ) : null}
                        </View>
                      )}
                      <Button title="＋ Agregar al día actual" onPress={() => addExerciseToCurrentDay(e.name, calc.w)} />
                    </View>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </>
    );
  } else if (view === 'saturacion') {
    const sat = saturation(s.sessionLog, runs.map((r) => ({ date: r.date, km: r.data.km })), new Date()) as Record<string, number>;
    const hoursToReady = (v: number) => (v <= 0.3 ? 0 : Math.ceil(36 * Math.log(v / 0.3)));
    const sel = muscle && sat[muscle] != null ? muscle : null;
    body = (
      <>
        <Card style={{ gap: 12 }}>
          {sideToggle}
          <BodyMap side={side} selected={sel} onSelect={(m) => setMuscle(m === muscle ? null : m)} heat={Object.fromEntries(MUSCLE_KEYS.map((m) => [m, satColor(sat[m] || 0)]))} width={200} />
          <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center' }}>
            {([['Listo', c.green], ['Recuperando', c.amber], ['Saturado', c.red]] as const).map(([l, col]) => (
              <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: col }} /><Text style={{ color: c.sub, fontSize: 12, fontWeight: '700' }}>{l}</Text>
              </View>
            ))}
          </View>
          {sel && (
            <View style={{ backgroundColor: c.soft, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: c.ink, fontWeight: '600', fontSize: 13.5, lineHeight: 20 }}>
                <Text style={{ fontWeight: '800' }}>{(EXDB as any)[sel].label}</Text>: {Math.round(sat[sel] * 100)}% de saturación · {satLabel(sat[sel])}.{' '}
                {hoursToReady(sat[sel]) > 0 ? `Listo para entrenarlo fuerte en ~${hoursToReady(sat[sel])} h.` : 'Podés entrenarlo fuerte hoy.'}
              </Text>
            </View>
          )}
        </Card>
        <Section title="Saturación por músculo" />
        <Card>
          {[...muscles].sort((a, b) => sat[b] - sat[a]).map((m) => (
            <Pressable key={m} onPress={() => setMuscle(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
              <Text style={{ width: 92, color: c.ink, fontWeight: '700', fontSize: 13 }}>{(EXDB as any)[m].label}</Text>
              <View style={{ flex: 1 }}><Bar pct={Math.max(0.02, sat[m])} color={satColor(sat[m])} height={8} /></View>
              <Text style={{ width: 96, textAlign: 'right', color: c.sub, fontSize: 12, fontWeight: '700' }}>{Math.round(sat[m] * 100)}% · {satLabel(sat[m])}</Text>
            </Pressable>
          ))}
        </Card>
        <Text style={{ color: c.sub, fontSize: 12, lineHeight: 17, marginTop: 8 }}>Se calcula con los ejercicios que marcás como hechos (y tus salidas a correr, para piernas). Cada serie suma fatiga que se recupera en ~48–72 h.</Text>
      </>
    );
  } else {
    const weeks = [3, 2, 1, 0].map((o) => weeklySets(s.sessionLog, d.today, o) as Record<string, number>);
    const cur = weeks[3];
    const gymDays = new Set((s.schedule || []).filter((e: any) => e.who === 'yo' && /gym/i.test(e.title)).map((e: any) => e.day)).size || 4;
    const progDays = (d.currentProgWeek?.days || []).length || 1;
    const planned = plannedSets(d.currentProgWeek) as Record<string, number>;
    const plannedWk = (m: string) => Math.round((planned[m] || 0) * Math.min(1, gymDays / progDays));
    const r1 = (v: number) => Math.round(v * 10) / 10;
    const rows = MUSCLE_KEYS.map((m: string) => ({ m, v: r1(cur[m] || 0), p: plannedWk(m), hist: weeks.map((w) => r1(w[m] || 0)) })).sort((a: any, b: any) => b.v - a.v || b.p - a.p);
    const maxV = Math.max(VOLUME.mrv + 2, ...rows.map((r: any) => Math.max(r.v, r.p)));
    const optimos = rows.filter((r: any) => r.v >= VOLUME.mavLo && r.v <= VOLUME.mavHi).length;
    const st = (v: number) => (v < VOLUME.mev ? ['Poco estímulo', c.sub] : v < VOLUME.mavLo ? ['Creciendo', c.amberInk] : v <= VOLUME.mavHi ? ['Óptimo', c.green] : v <= VOLUME.mrv ? ['Alto', c.amberInk] : ['Excesivo', c.red]);
    body = (
      <>
        <Card>
          <Text style={{ fontSize: 12, fontWeight: '800', color: c.sub, letterSpacing: 0.4 }}>ESTÍMULO DE HIPERTROFIA · ÚLTIMOS 7 DÍAS</Text>
          <Text style={{ fontSize: 21, fontWeight: '800', color: c.ink, marginVertical: 4 }}>{optimos} de {MUSCLE_KEYS.length} músculos en zona óptima</Text>
          <Text style={{ fontSize: 12.5, color: c.sub, fontWeight: '600', lineHeight: 18 }}>Series efectivas por semana (los secundarios cuentan a medias). Zona óptima: {VOLUME.mavLo}–{VOLUME.mavHi} series. Menos de {VOLUME.mev} casi no estimula; más de {VOLUME.mrv} cuesta recuperarse.</Text>
        </Card>
        <Section title="Series por músculo" />
        <Card>
          {rows.map((r: any) => {
            const [t, col] = st(r.v);
            return (
              <View key={r.m} style={{ paddingVertical: 7, borderTopWidth: 1, borderTopColor: c.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 5 }}>
                  <Text style={{ flex: 1, color: c.ink, fontWeight: '700', fontSize: 13 }}>{(EXDB as any)[r.m].label.split(' (')[0]} <Text style={{ color: col, fontSize: 11.5, fontWeight: '800' }}>{t}</Text></Text>
                  <Text style={{ color: c.sub, fontSize: 12, fontWeight: '600' }}><Text style={{ color: c.ink, fontWeight: '800' }}>{r.v}</Text>{r.p ? ` / ${r.p}` : ''} series</Text>
                </View>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: c.line, overflow: 'hidden' }}>
                  <View style={{ position: 'absolute', left: `${(VOLUME.mavLo / maxV) * 100}%`, width: `${((VOLUME.mavHi - VOLUME.mavLo) / maxV) * 100}%`, top: 0, bottom: 0, backgroundColor: c.greenSoft }} />
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(r.v / maxV) * 100}%`, borderRadius: 5, backgroundColor: c.primary }} />
                  {r.p > 0 && <View style={{ position: 'absolute', left: `${(r.p / maxV) * 100}%`, top: 0, bottom: 0, width: 2, backgroundColor: c.ink }} />}
                </View>
                <Text style={{ color: c.sub, fontSize: 10.5, fontWeight: '600', marginTop: 4 }}>4 sem: {r.hist.join(' · ')}</Text>
              </View>
            );
          })}
        </Card>
        <Text style={{ color: c.sub, fontSize: 12, lineHeight: 17, marginTop: 8 }}>Para que cuente bien, cargá las reps de cada serie antes de marcar el ejercicio como hecho. La línea negra es lo que pide tu rutina, escalada a tus {gymDays} días de gym de la Agenda.</Text>
      </>
    );
  }

  return (
    <>
      <View style={{ marginBottom: 12 }}>
        <Segmented options={[['ejercicios', 'Ejercicios'], ['saturacion', 'Saturación'], ['volumen', 'Hipertrofia']]} value={view} onChange={(v) => { setView(v); setMuscle(null); setOpenLift(null); }} />
      </View>
      {body}
    </>
  );
}

/* ---------- Historial ---------- */
function Historial() {
  const c = useColors();
  const { s } = useNorte();
  const dates = Object.keys(s.sessionLog).filter((k) => (s.sessionLog[k] || []).length > 0).sort((a, b) => b.localeCompare(a));
  if (!dates.length) return <Card><Empty text="Todavía no registraste entrenamientos. Marcá ejercicios como hechos y van a aparecer acá." /></Card>;
  return (
    <>
      {dates.map((k) => (
        <Card key={k} style={{ marginBottom: 8 }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 14, marginBottom: 6, textTransform: 'capitalize' }}>
            {fmtDate(k)} <Text style={{ color: c.sub, fontWeight: '600' }}>· {s.sessionLog[k].length} ejercicio{s.sessionLog[k].length === 1 ? '' : 's'}</Text>
          </Text>
          {s.sessionLog[k].map((e: any, i: number) => (
            <Text key={i} style={{ color: c.sub, fontSize: 13.5, paddingVertical: 2 }}>
              • {e.name} — {e.setsCount} serie{e.setsCount === 1 ? '' : 's'}{e.tonnage ? ` · ${e.tonnage.toLocaleString('es-AR')} kg` : ''}
            </Text>
          ))}
        </Card>
      ))}
    </>
  );
}

