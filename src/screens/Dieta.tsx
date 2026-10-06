/* DIETA (de NORTE + Vamo): Plan Cut, macros del día, comidas frecuentes, registrar comida
   (por texto con el estimador, o con foto del plato e IA), calculadora y metas. */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { Button, Card, Check, Chip, Empty, Field, MacroBox, Note, Row, Section, Segmented } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { Alert } from '@/lib/dialog';
import { estimateFood, fastStatus } from '@/lib/fitness';
import { estimateFromPhoto, pickPlatePhoto, type PhotoEstimate } from '@/lib/foodPhoto';
import { toggleCutManual, useNorte } from '@/lib/norte';
import { CUT_PHASES, CUT_VIDEO_URL, fmtDate, uid } from '@/lib/norteData';
import { up } from '@/lib/store';
import { flash } from '@/lib/toast';

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function DietaSection() {
  const c = useColors();
  const d = useNorte();
  const s = d.s;
  const [meal, setMeal] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
  const [saveToLib, setSaveToLib] = useState(false);
  const [est, setEst] = useState<ReturnType<typeof estimateFood> | null>(null);
  const [photo, setPhoto] = useState<PhotoEstimate | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [calc, setCalc] = useState({ sex: 'm', age: '18', height: '175', weight: '70', activity: 1.55, goal: 0 });
  const fast = fastStatus(s.fasting.windows, new Date());
  const today = d.today;

  const resetForm = () => { setMeal({ name: '', kcal: '', protein: '', carbs: '', fat: '' }); setSaveToLib(false); setEst(null); setPhoto(null); };

  const estimate = () => {
    if (!meal.name.trim()) { flash('Escribí qué comiste para estimar'); return; }
    const e = estimateFood(meal.name);
    setEst(e);
    if (e.items.length) setMeal({ ...meal, kcal: String(e.total.kcal), protein: String(e.total.protein), carbs: String(e.total.carbs), fat: String(e.total.fat) });
  };

  const fromPhoto = async (source: 'camera' | 'library') => {
    try {
      const uri = await pickPlatePhoto(source);
      if (!uri) return;
      setPhotoBusy(true);
      setEst(null);
      const r = await estimateFromPhoto(uri, meal.name);
      setPhoto(r);
      if (r.items.length) setMeal({
        name: meal.name.trim() || r.items.map((i) => i.name).join(', '),
        kcal: String(r.total.kcal), protein: String(r.total.protein), carbs: String(r.total.carbs), fat: String(r.total.fat),
      });
    } catch (e: any) {
      Alert.alert('Foto del plato', e?.message ?? 'No se pudo analizar.');
    } finally { setPhotoBusy(false); }
  };

  const add = () => {
    if (!meal.name.trim() && !Number(meal.kcal)) { flash('Escribí qué comiste o poné las kcal'); return; }
    const m = { name: meal.name.trim() || 'Comida', kcal: Number(meal.kcal) || 0, protein: Number(meal.protein) || 0, carbs: Number(meal.carbs) || 0, fat: Number(meal.fat) || 0 };
    up((st) => {
      st.meals[today] = st.meals[today] || [];
      st.meals[today].push({ id: uid(), ...m });
      if (saveToLib && !st.mealLibrary.some((x: any) => x.name === m.name)) st.mealLibrary.push({ id: uid(), ...m });
    });
    resetForm();
  };

  // Calculadora (Mifflin-St Jeor)
  const W = Number(calc.weight) || 0, H = Number(calc.height) || 0, A = Number(calc.age) || 0;
  const bmr = calc.sex === 'm' ? 10 * W + 6.25 * H - 5 * A + 5 : 10 * W + 6.25 * H - 5 * A - 161;
  const tdee = Math.round(bmr * calc.activity);
  const targetKcal = Math.round(tdee + calc.goal);
  const targetProt = Math.round(W * 1.8);
  const targetFat = Math.round((targetKcal * 0.25) / 9);
  const targetCarbs = Math.round((targetKcal - targetProt * 4 - targetFat * 9) / 4);

  const g = s.goals;
  return (
    <>
      <CutPlan />

      <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <MacroBox label="Calorías" value={d.kcal} goal={g.kcal} unit="kcal" color={c.amber} />
        <MacroBox label="Proteína" value={d.prot} goal={g.protein} unit="g" color={c.primary} />
        <MacroBox label="Carbos" value={d.carbs} goal={g.carbs} unit="g" color={c.water} />
        <MacroBox label="Grasas" value={d.fat} goal={g.fat} unit="g" color={c.red} />
        {d.runKcalToday > 0 && (
          <Text style={{ width: '100%', color: c.sub, fontSize: 13, fontWeight: '600', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10 }}>
            🏃 Quemaste <Text style={{ color: c.ink, fontWeight: '800' }}>{d.runKcalToday} kcal</Text> corriendo · te quedan <Text style={{ color: c.ink, fontWeight: '800' }}>{Math.max(0, g.kcal + d.runKcalToday - d.kcal)} kcal</Text>
          </Text>
        )}
      </Card>

      {s.mealLibrary.length > 0 && (
        <>
          <Section title="Comidas frecuentes (tocá para agregar)" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {s.mealLibrary.map((m: any) => (
              <Pressable key={m.id} onPress={() => up((st) => { st.meals[today] = st.meals[today] || []; st.meals[today].push({ ...m, id: uid() }); })}
                onLongPress={() => Alert.alert('¿Sacar de frecuentes?', m.name, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sacar', style: 'destructive', onPress: () => up((st) => { st.mealLibrary = st.mealLibrary.filter((x: any) => x.id !== m.id); }) }])}
                style={({ pressed }) => ({ backgroundColor: c.card, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: c.line, opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ color: c.ink, fontWeight: '700', fontSize: 13.5 }}>⭐ {m.name} <Text style={{ color: c.sub, fontWeight: '600' }}>{m.kcal} kcal</Text></Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Section title="Comidas de hoy" />
      <Card style={{ paddingVertical: 6 }}>
        {d.mealsToday.length === 0 && <Empty text="Todavía no registraste comidas hoy." />}
        {d.mealsToday.map((m: any) => (
          <Row key={m.id} title={m.name} sub={`${m.kcal || 0} kcal · P ${m.protein || 0} · C ${m.carbs || 0} · G ${m.fat || 0}`}
            right={
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                {!s.mealLibrary.some((x: any) => x.name === m.name) && (
                  <Text onPress={() => up((st) => { st.mealLibrary.push({ id: uid(), name: m.name, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat }); })} style={{ fontSize: 18 }}>⭐</Text>
                )}
                <Ionicons name="close" size={20} color={c.red} onPress={() => up((st) => { st.meals[today] = (st.meals[today] || []).filter((x: any) => x.id !== m.id); })} />
              </View>
            } />
        ))}
      </Card>

      <Section title="Registrar comida" />
      <Card style={{ gap: 10 }}>
        {fast.active && <Note tone="warn">⏳ Estás en ayuno hasta las {hhmm(fast.active.end)}. Si comiste igual, registralo: el conteo tiene que ser honesto.</Note>}
        <Field value={meal.name} multiline placeholder="Qué comiste (ej: 2 empanadas y una coca)" onChangeText={(t) => { setMeal({ ...meal, name: t }); setEst(null); }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Foto del plato" loading={photoBusy} style={{ flex: 1 }} icon={<Ionicons name="camera" size={17} color="#fff" />} onPress={() => fromPhoto('camera')} />
          <Button kind="soft" icon={<Ionicons name="images" size={18} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />} onPress={() => fromPhoto('library')} />
        </View>
        {photo && (
          <View style={{ backgroundColor: c.primarySoft, borderRadius: 14, padding: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Image source={{ uri: photo.uri }} style={{ width: 56, height: 56, borderRadius: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.ink, fontWeight: '800' }}>{photo.total.kcal} kcal estimadas</Text>
                <Text style={{ color: c.sub, fontSize: 12 }}>Confianza {photo.confidence}. {photo.note}</Text>
              </View>
            </View>
            {photo.items.map((it, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.ink, fontWeight: '600', flex: 1 }}>{it.name} <Text style={{ color: c.sub }}>· {it.portion}</Text></Text>
                <Text style={{ color: c.ink, fontWeight: '800' }}>{Math.round(it.kcal)} kcal</Text>
              </View>
            ))}
          </View>
        )}
        <Button kind="soft" title="Estimar kcal por texto" icon={<Ionicons name="sparkles" size={16} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />} onPress={estimate} />
        {est && (
          <View style={{ backgroundColor: est.items.length ? c.primarySoft : c.amberSoft, borderRadius: 12, padding: 10, gap: 3 }}>
            {est.items.map((it: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.ink, fontWeight: '600', flex: 1, textTransform: 'capitalize' }}>{it.name} <Text style={{ color: c.sub }}>· {it.label}</Text></Text>
                <Text style={{ color: c.ink, fontWeight: '800' }}>{it.kcal} kcal</Text>
              </View>
            ))}
            {est.items.length > 0 && <Text style={{ color: c.ink, fontWeight: '800', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 4, marginTop: 2 }}>Estimado total: {est.total.kcal} kcal</Text>}
            {est.unknown.length > 0 && (
              <Text style={{ color: est.items.length ? c.primaryInk : c.amberInk, fontSize: 12.5, marginTop: 2 }}>
                No reconocí: <Text style={{ fontWeight: '800' }}>{est.unknown.join(', ')}</Text>. {est.items.length ? 'Sumalo a mano si hace falta.' : 'Poné las kcal directamente abajo.'}
              </Text>
            )}
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Field label="kcal" keyboardType="number-pad" value={meal.kcal} onChangeText={(t) => setMeal({ ...meal, kcal: t })} />
          <Field label="Prot g" keyboardType="number-pad" value={meal.protein} onChangeText={(t) => setMeal({ ...meal, protein: t })} />
          <Field label="Carb g" keyboardType="number-pad" value={meal.carbs} onChangeText={(t) => setMeal({ ...meal, carbs: t })} />
          <Field label="Grasa g" keyboardType="number-pad" value={meal.fat} onChangeText={(t) => setMeal({ ...meal, fat: t })} />
        </View>
        <Pressable onPress={() => setSaveToLib(!saveToLib)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={saveToLib ? 'checkbox' : 'square-outline'} size={20} color={saveToLib ? c.primary : c.sub} />
          <Text style={{ color: c.sub, fontWeight: '600', fontSize: 13.5 }}>Guardar como comida frecuente ⭐</Text>
        </Pressable>
        <Button title="Agregar comida" onPress={add} />
      </Card>

      <Section title="Calculadora de metas" right={<Button small kind="ghost" title={showCalc ? 'Ocultar' : 'Abrir'} onPress={() => setShowCalc(!showCalc)} />} />
      {showCalc && (
        <Card style={{ gap: 10 }}>
          <Segmented options={[['m', 'Hombre'], ['f', 'Mujer']]} value={calc.sex} onChange={(v) => setCalc({ ...calc, sex: v })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field label="Edad" keyboardType="number-pad" value={calc.age} onChangeText={(t) => setCalc({ ...calc, age: t })} />
            <Field label="Altura (cm)" keyboardType="number-pad" value={calc.height} onChangeText={(t) => setCalc({ ...calc, height: t })} />
            <Field label="Peso (kg)" keyboardType="decimal-pad" value={calc.weight} onChangeText={(t) => setCalc({ ...calc, weight: t })} />
          </View>
          <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '700' }}>Actividad</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {([[1.2, 'Sedentario'], [1.375, 'Ligero (1-3 días)'], [1.55, 'Moderado (3-5)'], [1.725, 'Alto (6-7)']] as const).map(([v, l]) => (
              <Chip key={v} label={l} on={calc.activity === v} onPress={() => setCalc({ ...calc, activity: v })} />
            ))}
          </View>
          <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '700' }}>Objetivo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {([[-300, 'Bajar grasa'], [0, 'Mantener'], [300, 'Ganar músculo']] as const).map(([v, l]) => (
              <Chip key={v} label={l} on={calc.goal === v} onPress={() => setCalc({ ...calc, goal: v })} />
            ))}
          </View>
          <Note>Sugerencia: {targetKcal} kcal · Proteína {targetProt} g · Carbos {targetCarbs} g · Grasas {targetFat} g</Note>
          <Button title="Aplicar a mis metas" onPress={() => { up((st) => { st.goals = { ...st.goals, kcal: targetKcal, protein: targetProt, carbs: targetCarbs, fat: targetFat }; }); flash('Metas actualizadas'); }} />
          <Text style={{ color: c.sub, fontSize: 12, lineHeight: 17 }}>Estimación orientativa (Mifflin-St Jeor). Ajustala según cómo responda tu cuerpo, y ante dudas consultá a un profesional de la nutrición.</Text>
        </Card>
      )}

      <Section title="Metas diarias" />
      <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {([['kcal', 'kcal'], ['protein', 'proteína g'], ['carbs', 'carbos g'], ['fat', 'grasas g']] as const).map(([k, l]) => (
          <View key={k} style={{ width: '47%' }}>
            <Field label={l} keyboardType="number-pad" value={String(g[k] ?? '')} onChangeText={(t) => up((st) => { st.goals[k] = Number(t) || 0; })} />
          </View>
        ))}
      </Card>
    </>
  );
}

/* ---------- Plan Cut 🎮 (de NORTE) ---------- */
function CutPlan() {
  const c = useColors();
  const d = useNorte();
  const [startBf, setStartBf] = useState('');
  const [newBf, setNewBf] = useState('');
  const today = d.today;

  if (!d.cut) {
    return (
      <>
        <Section title="Plan Cut 🎮" />
        <Card style={{ gap: 10, marginBottom: 12 }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 15.5 }}>De donde estés hoy → 8% de grasa</Text>
          <Text style={{ color: c.sub, fontSize: 13.5, lineHeight: 19 }}>Un plan por niveles basado en la guía de Oswal Candela: 3 fases con misiones diarias, y calculadoras que se desbloquean a medida que bajás tu % de grasa.</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <Field keyboardType="decimal-pad" placeholder="Tu % de grasa estimado (ej: 30)" value={startBf} onChangeText={setStartBf} />
            <Button title="Empezar" onPress={() => {
              const v = Number(startBf);
              if (!v || v < 5 || v > 60) { flash('Ingresá tu % de grasa estimado (entre 5 y 60)'); return; }
              up((st) => {
                st.cut = { startDate: today, startBf: v, bfLog: { [today]: v }, manual: {}, lastPhase: v > 15 ? 0 : v > 12 ? 1 : 2 };
                if (!st.reminders.some((r: any) => r.cut)) st.reminders.push(
                  { id: uid(), cut: true, text: '📝 ¿Ya registraste tu almuerzo? Mantené el conteo al día', time: '14:00', days: [0, 1, 2, 3, 4, 5, 6] },
                  { id: uid(), cut: true, text: '💪 ¿Cómo va el entreno? Marcá tus ejercicios en la rutina', time: '19:00', days: [1, 2, 3, 4, 5] },
                  { id: uid(), cut: true, text: '🔢 Cerrá el día: registrá todas tus calorías de hoy', time: '21:45', days: [0, 1, 2, 3, 4, 5, 6] },
                );
              });
              setStartBf('');
              flash('🎮 ¡Plan Cut activado! Arrancás en la Fase ' + (v > 15 ? 1 : v > 12 ? 2 : 3), 6000);
            }} />
          </View>
          <Text style={{ color: c.sub, fontSize: 12 }}>Estimalo con fotos de referencia o una báscula con bioimpedancia; no hace falta que sea exacto.</Text>
          <Text onPress={() => Linking.openURL(CUT_VIDEO_URL)} style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>▶ Ver la guía completa en video →</Text>
        </Card>
      </>
    );
  }

  const ph = d.cutPhase;
  return (
    <>
      <Section title="Plan Cut 🎮" right={<Text onPress={() => Linking.openURL(CUT_VIDEO_URL)} style={{ color: c.primary, fontWeight: '700', fontSize: 12.5 }}>Guía en video →</Text>} />
      <View style={{ backgroundColor: c.primary, borderRadius: 22, padding: 18, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>NIVEL {d.cutPhaseIdx + 1} DE 3</Text>
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800' }}>⚡ {d.cutXp} XP</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginVertical: 4 }}>{d.cutDone ? '🏆 Plan completado' : `${ph.emoji} ${ph.name}`}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: '600', marginBottom: 10 }}>
          {d.cutDone ? 'Llegaste al 8%. Ahora el juego es mantenerlo.' : `${ph.range} · vas ${d.cutBf}% → meta ${ph.target}%`}
        </Text>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
          <View style={{ width: `${(d.cutDone ? 1 : d.cutPhasePct) * 100}%`, height: '100%', backgroundColor: '#fff', borderRadius: 5 }} />
        </View>
      </View>

      <Section title={`Misiones de hoy (${d.cutMissionsDone}/${d.cutMissions.length})`} />
      <Card style={{ paddingVertical: 4 }}>
        {d.cutMissions.map((m) => (
          <Row key={m.id} title={m.text} sub={m.auto ? 'Se completa sola al registrar en la app' : 'Marcala vos al final del día'}
            right={<Check done={m.done} onPress={() => { if (m.auto) flash('Esta misión se completa sola cuando registrás 😉', 3500); else toggleCutManual(m.id); }} />} />
        ))}
      </Card>

      <Section title="Reglas de la fase" />
      <Card style={{ gap: 6 }}>
        {ph.rules.map((r: string, i: number) => (
          <Text key={i} style={{ color: c.ink, fontSize: 13.5, lineHeight: 19 }}><Text style={{ color: c.primary, fontWeight: '800' }}>› </Text>{r}</Text>
        ))}
      </Card>

      <Section title="Tu % de grasa" />
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Field keyboardType="decimal-pad" placeholder="% de grasa estimado hoy" value={newBf} onChangeText={setNewBf} />
          <Button title="Guardar" onPress={() => {
            const v = Number(newBf);
            if (!v || v < 3 || v > 60) return;
            up((st) => { st.cut.bfLog = st.cut.bfLog || {}; st.cut.bfLog[today] = v; });
            setNewBf('');
          }} />
        </View>
        {d.cutBfEntries.slice(-5).reverse().map(([dd, v]: any) => (
          <View key={dd} style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 5 }}>
            <Text style={{ color: c.sub, fontWeight: '600', textTransform: 'capitalize' }}>{fmtDate(dd)}</Text>
            <Text style={{ color: c.ink, fontWeight: '700' }}>{v}%</Text>
          </View>
        ))}
        <Text style={{ color: c.sub, fontSize: 12 }}>Actualizalo cada 1–2 semanas: es lo que te hace subir de nivel.</Text>
      </Card>

      <Section title="Desbloqueos" />
      {CUT_PHASES.map((p: any, i: number) => {
        const open = d.cutPhaseIdx >= i || d.cutDone;
        return (
          <Card key={i} style={{ marginBottom: 8, opacity: open ? 1 : 0.45, gap: 8 }}>
            <Text style={{ color: c.ink, fontWeight: '800', fontSize: 14 }}>{open ? '🔓' : '🔒'} {p.unlock}</Text>
            {!open && <Text style={{ color: c.sub, fontSize: 12.5 }}>Se desbloquea en la Fase {i + 1} ({p.range}).</Text>}
            {open && i === 0 && (d.bodyWeight ? (
              <>
                <Note>Con tus {d.bodyWeight} kg: {Math.round(d.bodyWeight * 22)}–{Math.round(d.bodyWeight * 24)} kcal · Proteína {Math.round(d.bodyWeight * 1.5)}–{Math.round(d.bodyWeight * 2)} g</Note>
                <Button small title="Aplicar a mis metas" onPress={() => up((st) => { st.goals = { ...st.goals, kcal: Math.round(d.bodyWeight * 23), protein: Math.round(d.bodyWeight * 1.8) }; })} />
              </>
            ) : <Text style={{ color: c.sub, fontSize: 13 }}>Registrá tu peso corporal (Salud → Cuerpo) para calcular tus calorías.</Text>)}
            {open && i === 1 && <Text style={{ color: c.sub, fontSize: 12.5 }}>Usá la “Calculadora de metas” de más abajo. Desde esta fase el conteo es obligatorio.</Text>}
            {open && i === 2 && (
              <>
                <Text style={{ color: c.ink, fontSize: 13, lineHeight: 19 }}>Protocolo sugerido de ayuno 16/8: ventana de comida de 8 h (ej: 13:00–21:00). Marcá la misión “Ayuno intermitente” los días que lo uses.</Text>
                <Note tone="warn">Recordá lo que dice la guía: con 12–15% ya tenés un cuerpo estético y sostenible. El 8% es un extra opcional, no una obligación.</Note>
              </>
            )}
          </Card>
        );
      })}
      <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
        <Button small kind="ghost" title="Abandonar plan" onPress={() => Alert.alert('¿Abandonar el Plan Cut?', 'Se borran sus recordatorios y tu registro de % de grasa.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abandonar', style: 'destructive', onPress: () => up((st) => { st.cut = null; st.reminders = st.reminders.filter((r: any) => !r.cut); }) },
        ])} />
      </View>
    </>
  );
}
