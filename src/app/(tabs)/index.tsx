/* HOY (de NORTE + Vamo): anillo del día, tip, hábitos con rachas, agua y ayuno, gym del
   día, bonus, exámenes, dieta, correr, pasos y pulso, nota del día y tu semana. */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Ring } from '@/components/Ring';
import { WaterSphere } from '@/components/WaterSphere';
import { Bar, BigStat, Button, Card, Check, Empty, Field, MacroBox, MiniStat, Note, Row, Screen, Section } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { readHealthToday, type HealthToday } from '@/lib/health';
import { addWater, streakOf, toggleEx, toggleHabit, useNorte } from '@/lib/norte';
import { alreadyImported, findNorteInBrowser } from '@/lib/norteImport';
import { DAY_NAMES, MONTHS } from '@/lib/norteData';
import { useLiveRun } from '@/lib/runTracker';
import { importNorte, setSettings, up } from '@/lib/store';
import { flash } from '@/lib/toast';
import { FastCard } from '@/screens/Agua';

export default function Hoy() {
  const c = useColors();
  const d = useNorte();
  const s = d.s;
  const live = useLiveRun();
  const [health, setHealth] = useState<HealthToday | null>(null);
  const [norteLocal] = useState(() => (alreadyImported() ? null : findNorteInBrowser()));
  const [hideImport, setHideImport] = useState(false);
  const healthOn = !!s.health;
  useEffect(() => {
    if (!healthOn) return;
    let alive = true;
    const load = () => readHealthToday().then((h) => { if (alive) setHealth(h); });
    load();
    const iv = setInterval(load, 120000);
    return () => { alive = false; clearInterval(iv); };
  }, [healthOn]);

  const hr = d.now.getHours();
  const greet = hr < 6 ? 'Buenas noches' : hr < 13 ? 'Buen día' : hr < 20 ? 'Buenas tardes' : 'Buenas noches';
  const name = s.profile?.name;
  const dark = c.scheme === 'dark';

  return (
    <Screen title={name ? `${greet}, ${name.split(' ')[0]}` : greet} subtitle={`${DAY_NAMES[d.dow]}, ${d.now.getDate()} de ${MONTHS[d.now.getMonth()]}`}
      right={<Pressable onPress={() => setSettings({ theme: dark ? 'light' : 'dark' })} style={{ backgroundColor: c.primarySoft, borderRadius: 12, padding: 9 }}>
        <Ionicons name={dark ? 'sunny' : 'moon'} size={17} color={dark ? c.primaryInk : c.primary} />
      </Pressable>}>

      {norteLocal && !hideImport && (
        <Card style={{ marginBottom: 12, backgroundColor: c.primarySoft, borderColor: c.primary, borderWidth: 1.5, gap: 10 }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 }}>📦 Encontramos tus datos de NORTE</Text>
          <Text style={{ color: c.sub, fontSize: 13.5, lineHeight: 19 }}>Están guardados en este navegador. Importalos a tu cuenta de Vamo: hábitos, agenda, plata, gym, comidas, peso, materias, salidas… todo.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Importar todo" style={{ flex: 1 }} onPress={() => {
              const r = importNorte(norteLocal);
              setHideImport(true);
              flash(`✅ Listo: tus datos de NORTE ya están en Vamo${r.runs ? ` (+${r.runs} salidas)` : ''}`, 7000);
            }} />
            <Button kind="ghost" title="Ahora no" onPress={() => setHideImport(true)} />
          </View>
        </Card>
      )}

      {live && (
        <Card onPress={() => router.push('/run/live')} style={{ backgroundColor: c.primary, borderColor: c.primary, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={live.status === 'running' ? 'radio-button-on' : 'pause'} size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15.5, flex: 1 }}>
              {live.status === 'running' ? 'Salida en curso' : 'Salida en pausa'} · {(live.points.at(-1)?.d ?? 0).toFixed(2)} km
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </View>
        </Card>
      )}

      {/* Anillo del día */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 20 }}>
        <Ring pct={d.dayPct} size={124} stroke={13} color={c.primary}>
          <Text style={{ color: c.ink, fontSize: 28, fontWeight: '800' }}>{Math.round(d.dayPct * 100)}<Text style={{ fontSize: 15, color: c.sub }}>%</Text></Text>
          <Text style={{ color: c.sub, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6 }}>DEL DÍA</Text>
        </Ring>
        <View style={{ flex: 1, gap: 10 }}>
          <MiniStat label="Hábitos" value={`${d.habitsDone}/${d.habitsToday.length}`} color={c.primary} />
          <MiniStat label="Gym" value={d.exTotal ? `${d.exDone}/${d.exTotal}` : 'Descanso'} color={c.accent} />
          <MiniStat label="Agua" value={`${(d.water / 1000).toFixed(1)}/${(d.waterGoal / 1000).toFixed(1)} L`} color={c.water} />
        </View>
      </Card>

      {healthOn && health && (
        <Card style={{ flexDirection: 'row', marginTop: 12 }}>
          <BigStat value={health.steps?.toLocaleString('es-AR') ?? '–'} label="pasos hoy" color={c.green} />
          <BigStat value={health.heartRate ?? '–'} label="pulso (lpm)" color={c.red} />
          <BigStat value={health.restingHr ?? '–'} label="en reposo" color={c.primary} />
        </Card>
      )}

      {d.cut && (
        <Card onPress={() => router.navigate({ pathname: '/salud', params: { s: 'dieta' } })} style={{ marginTop: 12, backgroundColor: c.primary, borderColor: c.primary, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 26 }}>{d.cutDone ? '🏆' : d.cutPhase.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5 }}>Plan Cut · {d.cutDone ? 'Completado' : `Nivel ${d.cutPhaseIdx + 1}: ${d.cutPhase.name}`}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '600' }}>Misiones {d.cutMissionsDone}/{d.cutMissions.length} · {d.cutBf}% de grasa → meta {d.cutPhase.target}%</Text>
          </View>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>→</Text>
        </Card>
      )}

      <Section title="Tip del día" />
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: c.primarySoft, flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="bulb" size={17} color="#fff" />
        </View>
        <Text style={{ flex: 1, color: c.scheme === 'dark' ? c.primaryInk : c.primaryInk, fontSize: 14, lineHeight: 21, fontWeight: '500' }}>{d.tip}</Text>
      </View>

      <Section title="Hábitos de hoy" right={<Button small kind="ghost" title="Todos →" onPress={() => router.push('/habitos')} />} />
      <Card style={{ paddingVertical: 4 }}>
        {d.habitsToday.length === 0 && <Empty text="No hay hábitos programados para hoy." />}
        {d.habitsToday.map((h: any) => {
          const st = streakOf(h, d.today);
          return (
            <Row key={h.id} left={<Text style={{ fontSize: 20 }}>{h.icon}</Text>} title={h.name} sub={`🔥 ${st} día${st === 1 ? '' : 's'} de racha`}
              right={<Check done={!!h.history[d.today]} onPress={() => toggleHabit(h.id)} />} />
          );
        })}
      </Card>

      <Section title={(s.fasting.windows || []).length ? 'Agua y ayuno' : 'Agua'} right={<Button small kind="ghost" title="Salud →" onPress={() => router.navigate({ pathname: '/salud', params: { s: 'agua' } })} />} />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <WaterSphere pct={d.water / d.waterGoal} size={104}>
            <Text style={{ color: d.water / d.waterGoal > 0.5 ? '#fff' : c.ink, fontSize: 17, fontWeight: '900' }}>{Math.round((d.water / d.waterGoal) * 100)}%</Text>
          </WaterSphere>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontSize: 17, fontWeight: '800' }}>{d.water.toLocaleString('es-AR')} <Text style={{ fontSize: 13, color: c.sub, fontWeight: '600' }}>/ {d.waterGoal.toLocaleString('es-AR')} ml</Text></Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              {[250, 500].map((ml) => <Button key={ml} small kind="soft" title={`+${ml}`} onPress={() => addWater(ml)} />)}
            </View>
          </View>
        </View>
        {(s.fasting.windows || []).length > 0 && <View style={{ borderTopWidth: 1, borderTopColor: c.line, marginTop: 12, paddingTop: 10 }}><FastCard /></View>}
      </Card>

      {d.currentProgDay && d.currentProgDay.exercises.length > 0 && (
        <>
          <Section title={`Gym · ${d.currentProgDay.name || `Día ${s.currentDay + 1}`}`} right={<Button small kind="ghost" title="Ver rutina →" onPress={() => router.navigate({ pathname: '/salud', params: { s: 'gym' } })} />} />
          <Card style={{ paddingVertical: 4 }}>
            {d.currentProgDay.exercises.map((e: any) => (
              <Row key={e.id} title={e.name || 'Ejercicio'} sub={`${e.sets.length} serie${e.sets.length === 1 ? '' : 's'}${e.intensity ? ` · ${e.intensity}` : ''}`}
                right={<Check color={c.amber} done={!!d.wLog[e.id]} onPress={() => toggleEx(e)} />} />
            ))}
          </Card>
        </>
      )}

      {d.bonusPendHoy && (
        <>
          <Section title="Bonus de hoy" />
          <Card onPress={() => router.navigate({ pathname: '/agenda', params: { v: 'bonus' } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="bulb" size={22} color={c.amber} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.ink, fontWeight: '800', fontSize: 15 }}>📕 Geografía · {(d.bonusHoy as any).titulo}</Text>
              <Text style={{ color: c.sub, fontSize: 12.5, fontWeight: '600' }}>Lectura + ejercicio · {d.bonusProg(d.bonusHoy.id).leido ? 'falta el ejercicio' : 'unos 20 minutos'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.sub} />
          </Card>
        </>
      )}

      {d.upcomingExams.length > 0 && (
        <>
          <Section title="Exámenes" right={<Button small kind="ghost" title="Ver materias →" onPress={() => router.navigate({ pathname: '/agenda', params: { v: 'materias' } })} />} />
          <Card style={{ paddingVertical: 4 }}>
            {d.upcomingExams.slice(0, 3).map((m: any) => {
              const dd = d.daysUntil(m.examen);
              const temas = m.temas || [];
              return (
                <Row key={m.id} title={`${m.estado === 'previa' ? '📕' : '📘'} ${m.name}${m.curso ? ` · ${m.curso}` : ''}`}
                  sub={`${m.estado === 'previa' ? 'Previa · ' : ''}${temas.length ? `${temas.filter((t: any) => t.done).length}/${temas.length} temas` : 'Cargá los temas'}`}
                  right={<Text style={{ fontWeight: '900', fontSize: 13.5, color: dd <= 7 ? c.red : dd <= 14 ? c.amber : c.ink }}>{dd === 0 ? '¡Hoy!' : dd === 1 ? 'Mañana' : `${dd} días`}</Text>} />
              );
            })}
          </Card>
        </>
      )}

      <Section title="Dieta de hoy" right={<Button small kind="ghost" title="Registrar →" onPress={() => router.navigate({ pathname: '/salud', params: { s: 'dieta' } })} />} />
      <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <MacroBox label="Calorías" value={d.kcal} goal={s.goals.kcal} unit="kcal" color={c.amber} />
        <MacroBox label="Proteína" value={d.prot} goal={s.goals.protein} unit="g" color={c.primary} />
        <MacroBox label="Carbos" value={d.carbs} goal={s.goals.carbs} unit="g" color={c.water} />
        <MacroBox label="Grasas" value={d.fat} goal={s.goals.fat} unit="g" color={c.red} />
      </Card>

      <Section title="Correr" right={<Button small kind="ghost" title="Correr →" onPress={() => router.navigate({ pathname: '/salud', params: { s: 'correr' } })} />} />
      <Card style={{ gap: 12 }}>
        {d.runPlan ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ color: c.ink, fontSize: 24, fontWeight: '900' }}>{d.runKmToday} <Text style={{ color: c.sub, fontSize: 15, fontWeight: '700' }}>/ {d.runTarget} km</Text></Text>
              <Text style={{ color: d.runKmToday >= d.runTarget ? c.green : c.sub, fontWeight: '800', fontSize: 13 }}>
                {d.runKmToday >= d.runTarget ? '✓ Meta cumplida' : `Faltan ${Math.round((d.runTarget - d.runKmToday) * 100) / 100} km`}
              </Text>
            </View>
            <Bar pct={d.runKmToday / (d.runTarget || 1)} color={c.green} height={9} />
          </>
        ) : <Text style={{ color: c.sub }}>Armá tu plan de running en Salud → Correr.</Text>}
        <Button title={live ? 'Volver a la salida' : 'Empezar a correr'} icon={<Ionicons name="play" size={16} color="#fff" />} onPress={() => router.push('/run/live')} />
      </Card>

      <Section title="Nota del día" />
      <Card>
        <Field multiline placeholder="¿Cómo te sentiste hoy? Energía, dolores, ánimo…" value={s.notes[d.today] || ''}
          onChangeText={(t) => up((st) => { st.notes[d.today] = t; })} style={{ minHeight: 70, textAlignVertical: 'top' }} />
      </Card>

      <Section title="Tu semana" />
      <Card style={{ flexDirection: 'row', gap: 8 }}>
        <BigStat value={d.weekTrained} label="días entrenados (7d)" color={c.amber} />
        <BigStat value={`${d.weekHabitPct}%`} label="hábitos cumplidos (7d)" color={c.primary} />
        <BigStat value={`${d.achDone}/${d.ACHIEVEMENTS.length}`} label="logros" color={c.water} />
      </Card>

      {!s.importedFromNorte && !norteLocal && (
        <View style={{ marginTop: 16 }}>
          <Note>¿Venías usando NORTE? Pasá todo a Vamo en Más → Datos → Importar desde NORTE.</Note>
        </View>
      )}
    </Screen>
  );
}
