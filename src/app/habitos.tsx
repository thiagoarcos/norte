/* HÁBITOS (de NORTE): agregar, marcar, racha, semana, últimos 28 días, ícono y días. */
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Ring } from '@/components/Ring';
import { Button, Card, Check, DayPicker, Field, IconBtn } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { streakOf, toggleHabit, useNorte } from '@/lib/norte';
import { DAYS, EMOJIS, dstr, lastNDays, uid } from '@/lib/norteData';
import { up } from '@/lib/store';

export default function Habitos() {
  const c = useColors();
  const d = useNorte();
  const s = d.s;
  const [name, setName] = useState('');
  const [edit, setEdit] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const add = () => {
    const n = name.trim();
    if (!n) return;
    up((st) => { st.habits.push({ id: uid(), name: n, icon: '✅', days: [0, 1, 2, 3, 4, 5, 6], history: {} }); });
    setName('');
  };
  const hUp = (id: string, fn: (h: any) => void) => up((st) => { const h = st.habits.find((x: any) => x.id === id); if (h) fn(h); });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <Card style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <Field placeholder="Nuevo hábito (ej: leer 15 min)" value={name} onChangeText={setName} onSubmitEditing={add} />
        <Button title="＋" onPress={add} />
      </Card>
      {s.habits.map((h: any) => {
        const editing = edit === h.id;
        const showMonth = month === h.id;
        const last7 = lastNDays(7);
        const planned7 = last7.filter((x: Date) => h.days.includes(x.getDay())).length;
        const done7 = last7.filter((x: Date) => h.history[dstr(x)]).length;
        const weekPct = planned7 ? done7 / planned7 : done7 ? 1 : 0;
        const st = streakOf(h, d.today);
        return (
          <Card key={h.id} style={{ marginTop: 10, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ring pct={weekPct} size={52} stroke={6} color={c.primary}><Text style={{ fontSize: 21 }}>{h.icon}</Text></Ring>
              <View style={{ flex: 1 }}>
                {editing ? <Field value={h.name} onChangeText={(t) => hUp(h.id, (x) => { x.name = t; })} /> : (
                  <>
                    <Text numberOfLines={1} style={{ color: c.ink, fontWeight: '800', fontSize: 15.5 }}>{h.name}</Text>
                    <Text style={{ color: c.sub, fontSize: 12.5, fontWeight: '700', marginTop: 3 }}>
                      <Text style={{ color: st > 0 ? c.amber : c.sub, fontWeight: '800' }}>🔥 {st}</Text>   {done7}/{planned7 || 7} esta semana
                    </Text>
                  </>
                )}
              </View>
              {!editing && <Check done={!!h.history[d.today]} onPress={() => toggleHabit(h.id)} />}
              <View style={{ gap: 4 }}>
                <IconBtn onPress={() => setMonth(showMonth ? null : h.id)}>{showMonth ? '✕' : '📅'}</IconBtn>
                <IconBtn onPress={() => setEdit(editing ? null : h.id)}>{editing ? '✓' : '✎'}</IconBtn>
              </View>
            </View>
            {editing && (
              <>
                <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '700' }}>ÍCONO</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {EMOJIS.map((em: string) => (
                    <Pressable key={em} onPress={() => hUp(h.id, (x) => { x.icon = em; })} style={{ padding: 6, borderRadius: 10, backgroundColor: h.icon === em ? c.primarySoft : c.soft }}><Text style={{ fontSize: 18 }}>{em}</Text></Pressable>
                  ))}
                </View>
                <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '700' }}>DÍAS</Text>
                <DayPicker days={h.days} onToggle={(i) => hUp(h.id, (x) => { x.days = x.days.includes(i) ? x.days.filter((y: number) => y !== i) : [...x.days, i]; })} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Button small kind="danger" title="Borrar hábito" onPress={() => { setEdit(null); up((st2) => { st2.habits = st2.habits.filter((x: any) => x.id !== h.id); }); }} />
                </View>
              </>
            )}
            {!editing && !showMonth && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {last7.map((x: Date) => {
                  const k = dstr(x), planned = h.days.includes(x.getDay()), done = !!h.history[k], isToday = k === d.today;
                  return (
                    <View key={k} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 10.5, color: isToday ? c.primary : c.sub, fontWeight: '800', marginBottom: 5 }}>{DAYS[x.getDay()]}</Text>
                      <Pressable onPress={() => toggleHabit(h.id, k)} style={{
                        height: 30, alignSelf: 'stretch', borderRadius: 9, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: done ? c.primary : planned ? c.soft : 'transparent', opacity: planned || done ? 1 : 0.55,
                        borderWidth: isToday && !done ? 1.5 : 1, borderStyle: planned || done ? 'solid' : 'dashed', borderColor: isToday && !done ? c.primary : c.line,
                      }}>{done ? <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text> : null}</Pressable>
                    </View>
                  );
                })}
              </View>
            )}
            {showMonth && (
              <View>
                <Text style={{ color: c.sub, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>ÚLTIMOS 28 DÍAS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {lastNDays(28).map((x: Date) => {
                    const k = dstr(x), planned = h.days.includes(x.getDay()), done = !!h.history[k];
                    return (
                      <Pressable key={k} onPress={() => toggleHabit(h.id, k)} style={{ width: '13.2%', aspectRatio: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? c.primary : planned ? c.line : c.soft, opacity: planned || done ? 1 : 0.45 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: done ? '#fff' : c.sub }}>{x.getDate()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}
