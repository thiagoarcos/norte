/* SALUD: Correr, Gym, Dieta, Agua y ayuno, y Cuerpo, todo en un mismo lugar. */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { Screen } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { AguaSection } from '@/screens/Agua';
import { CorrerSection } from '@/screens/Correr';
import { CuerpoSection } from '@/screens/Cuerpo';
import { DietaSection } from '@/screens/Dieta';
import { GymSection } from '@/screens/Gym';

const SECTIONS = [
  ['gym', '🏋️ Gym'],
  ['correr', '🏃 Correr'],
  ['dieta', '🥗 Dieta'],
  ['agua', '💧 Agua y ayuno'],
  ['cuerpo', '⚖️ Cuerpo'],
] as const;
type Sec = (typeof SECTIONS)[number][0];
const memo: { sec: Sec } = { sec: 'gym' }; // recuerda la última sección al volver a la pestaña
const isSec = (p?: string): p is Sec => !!p && SECTIONS.some(([k]) => k === p);

export default function Salud() {
  const c = useColors();
  const params = useLocalSearchParams<{ s?: string }>();
  const [sec, setSec] = useState<Sec>(() => (isSec(params.s) ? params.s : memo.sec));
  const [prevParam, setPrevParam] = useState(params.s);
  if (params.s !== prevParam) { setPrevParam(params.s); if (isSec(params.s)) setSec(params.s); }
  useEffect(() => { memo.sec = sec; }, [sec]);
  const pick = (k: Sec) => setSec(k);
  const label = SECTIONS.find(([k]) => k === sec)?.[1].split(' ').slice(1).join(' ');

  return (
    <Screen title="Salud" subtitle={label}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
        {SECTIONS.map(([k, l]) => {
          const on = sec === k;
          return (
            <Pressable key={k} onPress={() => pick(k)} style={({ pressed }) => ({
              paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, opacity: pressed ? 0.8 : 1,
              backgroundColor: on ? c.primary : c.card, borderWidth: on ? 0 : 1, borderColor: c.line,
            })}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: on ? '#fff' : c.ink }}>{l}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {sec === 'gym' && <GymSection />}
      {sec === 'correr' && <CorrerSection />}
      {sec === 'dieta' && <DietaSection />}
      {sec === 'agua' && <AguaSection />}
      {sec === 'cuerpo' && <CuerpoSection />}
    </Screen>
  );
}
