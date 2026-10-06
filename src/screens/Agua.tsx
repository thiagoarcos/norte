/* AGUA Y AYUNO (de NORTE): esfera que se llena, vasos rápidos, meta, tomas del día,
   últimos 7 días y horarios de ayuno (los cambiás solo vos; NEXO no los toca). */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Bars } from '@/components/Charts';
import { WaterSphere } from '@/components/WaterSphere';
import { Bar, Button, Card, Chip, DayPicker, Empty, Field, Row, Section } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { fastHours, fastStatus } from '@/lib/fitness';
import { addWater, useNorte } from '@/lib/norte';
import { DAY_NAMES, DAYS, fmtDate, lastNDays, uid } from '@/lib/norteData';
import { up } from '@/lib/store';
import { flash } from '@/lib/toast';

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const durTxt = (ms: number) => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function FastCard() {
  const c = useColors();
  const { s, today } = useNorte();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(iv); }, []);
  const windows = s.fasting.windows || [];
  if (!windows.length) return null;
  const st = fastStatus(windows, new Date(now));
  const dayTxt = (d: Date) => {
    const diff = Math.round((new Date(keyOf(d) + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
    return diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : DAY_NAMES[d.getDay()].toLowerCase();
  };
  if (st.active) {
    const a = st.active;
    return (
      <View>
        <Text style={{ color: c.ink, fontWeight: '800', fontSize: 15 }}>⏳ En ayuno · llevás {durTxt(now - a.start.getTime())}</Text>
        <Text style={{ color: c.sub, fontSize: 13, fontWeight: '600', marginVertical: 6 }}>
          Termina {dayTxt(a.end)} a las <Text style={{ color: c.ink, fontWeight: '800' }}>{hhmm(a.end)}</Text> (faltan {durTxt(a.end.getTime() - now)}) · solo agua, café o té sin azúcar
        </Text>
        <Bar pct={(now - a.start.getTime()) / (a.end.getTime() - a.start.getTime())} color={c.amber} height={8} />
      </View>
    );
  }
  return (
    <View>
      <Text style={{ color: c.ink, fontWeight: '800', fontSize: 15 }}>🍽️ Ventana para comer</Text>
      {st.next && (
        <Text style={{ color: c.sub, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
          Próximo ayuno: {dayTxt(st.next.start)} a las <Text style={{ color: c.ink, fontWeight: '800' }}>{hhmm(st.next.start)}</Text> (en {durTxt(st.next.start.getTime() - now)}) · {fastHours(st.next.w)} h
        </Text>
      )}
    </View>
  );
}

export function AguaSection() {
  const c = useColors();
  const d = useNorte();
  const s = d.s;
  const [custom, setCustom] = useState('');
  const [fastEdit, setFastEdit] = useState(false);
  const pct = d.water / d.waterGoal;
  const left = Math.max(0, d.waterGoal - d.water);
  const setGoal = (ml: number) => up((st) => { st.goals.waterMl = Math.max(500, Math.min(6000, Math.round(ml / 50) * 50)); });
  const removeWater = (id: string) => up((st) => { st.waterLog[d.today] = (st.waterLog[d.today] || []).filter((e: any) => e.id !== id); });
  const last7 = lastNDays(7).map((dt: Date) => {
    const k = keyOf(dt);
    return { label: DAYS[dt.getDay()], title: fmtDate(k), value: ((s.waterLog || {})[k] || []).reduce((a: number, e: any) => a + (Number(e.ml) || 0), 0) };
  });
  const setWindows = (fn: (w: any[]) => any[]) => up((st) => { st.fasting = st.fasting || { windows: [] }; st.fasting.windows = fn(st.fasting.windows || []); });
  const windows = s.fasting.windows || [];
  const sugerido = d.bodyWeight ? Math.round((d.bodyWeight * 35) / 250) * 250 : 0;

  return (
    <>
      <Card>
        <WaterSphere pct={pct} size={220}>
          <Text style={{ color: pct > 0.5 ? '#fff' : c.ink, fontSize: 34, fontWeight: '900', letterSpacing: -1 }}>{d.water.toLocaleString('es-AR')}</Text>
          <Text style={{ color: pct > 0.5 ? 'rgba(255,255,255,0.9)' : c.sub, fontSize: 13, fontWeight: '700' }}>de {d.waterGoal.toLocaleString('es-AR')} ml · {Math.round(pct * 100)}%</Text>
        </WaterSphere>
        <Text style={{ textAlign: 'center', color: left ? c.sub : c.green, fontWeight: '700', fontSize: 13.5, marginVertical: 12 }}>
          {left ? `Te faltan ${left.toLocaleString('es-AR')} ml` : '💧 ¡Meta de agua cumplida!'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[250, 500, 750, 1000].map((ml, i) => (
            <Pressable key={ml} onPress={() => addWater(ml)} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 11, borderRadius: 14, backgroundColor: c.waterSoft, transform: [{ scale: pressed ? 0.92 : 1 }] })}>
              <Ionicons name="water" size={14 + i * 4} color={c.water} />
              <Text style={{ color: c.ink, fontWeight: '800', fontSize: 13 }}>{ml >= 1000 ? '1 L' : `${ml} ml`}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'flex-end' }}>
          <Field keyboardType="number-pad" placeholder="Otra cantidad (ml)" value={custom} onChangeText={setCustom} />
          <Button kind="soft" title="＋" onPress={() => {
            const ml = Number(custom);
            if (!(ml > 0 && ml <= 3000)) { flash('Poné una cantidad entre 1 y 3000 ml'); return; }
            addWater(Math.round(ml)); setCustom('');
          }} />
          {d.waterToday.length > 0 && <Button kind="ghost" icon={<Ionicons name="arrow-undo" size={18} color={c.sub} />} onPress={() => removeWater(d.waterToday[d.waterToday.length - 1].id)} />}
        </View>
      </Card>

      <Section title="Meta diaria" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Button kind="soft" title="−" onPress={() => setGoal(d.waterGoal - 250)} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: c.ink, fontSize: 24, fontWeight: '900' }}>{(d.waterGoal / 1000).toLocaleString('es-AR')} L</Text>
            <Text style={{ color: c.sub, fontSize: 12, fontWeight: '600' }}>tu máximo de agua por día</Text>
          </View>
          <Button kind="soft" title="＋" onPress={() => setGoal(d.waterGoal + 250)} />
        </View>
        {sugerido > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 6 }}>
            <Text style={{ color: c.sub, fontSize: 12.5, fontWeight: '600' }}>Referencia: ~35 ml por kg → <Text style={{ color: c.ink, fontWeight: '800' }}>{sugerido.toLocaleString('es-AR')} ml</Text></Text>
            <Button small kind="ghost" title="Usar" onPress={() => setGoal(sugerido)} />
          </View>
        )}
      </Card>

      {d.waterToday.length > 0 && (
        <>
          <Section title="Tomas de hoy" />
          <Card style={{ paddingVertical: 4 }}>
            {[...d.waterToday].reverse().map((e: any) => {
              const t = new Date(e.t);
              return (
                <Row key={e.id} left={<Ionicons name="water" size={16} color={c.water} />} title={`${Number(e.ml).toLocaleString('es-AR')} ml`}
                  sub={Number.isNaN(t.getTime()) ? '' : hhmm(t)} right={<Ionicons name="close" size={20} color={c.red} onPress={() => removeWater(e.id)} />} />
              );
            })}
          </Card>
        </>
      )}

      <Section title="Últimos 7 días" />
      <Card><Bars data={last7} unit="ml" color={c.water} target={d.waterGoal} refLabel={`meta ${d.waterGoal} ml`} fmt={(v) => v.toLocaleString('es-AR')} /></Card>

      <Section title="Ayuno" right={windows.length ? <Button small kind="ghost" title={fastEdit ? 'Listo' : 'Editar'} onPress={() => { if (fastEdit) flash('🔒 Horarios de ayuno guardados'); setFastEdit(!fastEdit); }} /> : undefined} />
      <Card style={{ gap: 10 }}>
        {windows.length ? <FastCard /> : !fastEdit && <Empty text="Todavía no agendaste horarios de ayuno." />}
        {!fastEdit && windows.map((w: any) => (
          <View key={w.id} style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8 }}>
            <Text style={{ color: c.sub, fontWeight: '600' }}>{w.days.length === 7 ? 'Todos los días' : [1, 2, 3, 4, 5, 6, 0].filter((x) => w.days.includes(x)).map((x) => DAY_NAMES[x].slice(0, 3)).join(' ')}</Text>
            <Text style={{ color: c.ink, fontWeight: '700' }}>{w.start} → {w.end} <Text style={{ color: c.sub }}>· {fastHours(w)} h</Text></Text>
          </View>
        ))}
        {!fastEdit && !windows.length && <Button title="Agendar horarios de ayuno" onPress={() => setFastEdit(true)} />}
        {fastEdit && (
          <>
            <Text style={{ color: c.sub, fontSize: 12.5 }}>El ayuno empieza a la primera hora y termina a la segunda (si es más temprano, al día siguiente). Formato 24 h: 20:00.</Text>
            {windows.map((w: any) => (
              <View key={w.id} style={{ backgroundColor: c.soft, borderRadius: 12, padding: 10, gap: 8 }}>
                <DayPicker days={w.days} onToggle={(x) => setWindows((ws) => ws.map((y) => y.id === w.id ? { ...y, days: y.days.includes(x) ? y.days.filter((z: number) => z !== x) : [...y.days, x] } : y))} />
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                  <Field label="Empieza" value={w.start} onChangeText={(t) => setWindows((ws) => ws.map((y) => y.id === w.id ? { ...y, start: t } : y))} />
                  <Field label="Termina" value={w.end} onChangeText={(t) => setWindows((ws) => ws.map((y) => y.id === w.id ? { ...y, end: t } : y))} />
                  <Pressable onPress={() => setWindows((ws) => ws.filter((y) => y.id !== w.id))} style={{ padding: 10 }}><Ionicons name="trash" size={20} color={c.red} /></Pressable>
                </View>
                <Text style={{ color: c.sub, fontSize: 12, fontWeight: '600' }}>{w.start && w.end ? `${fastHours(w)} h de ayuno` : ''}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {([['16:8', '20:00', '12:00'], ['14:10', '20:00', '10:00'], ['18:6', '18:00', '12:00']] as const).map(([n, a, b]) => (
                <Chip key={n} label={`＋ ${n}`} onPress={() => setWindows((ws) => [...ws, { id: uid(), days: [0, 1, 2, 3, 4, 5, 6], start: a, end: b }])} />
              ))}
              <Chip label="＋ Personalizado" onPress={() => setWindows((ws) => [...ws, { id: uid(), days: [1, 2, 3, 4, 5], start: '21:00', end: '13:00' }])} />
            </View>
          </>
        )}
      </Card>
      <Text style={{ color: c.sub, fontSize: 12, lineHeight: 17, marginTop: 8 }}>Los horarios de ayuno solo los cambiás vos desde acá; NEXO no puede modificarlos. Te avisamos cuando empieza y termina cada ayuno.</Text>
    </>
  );
}
