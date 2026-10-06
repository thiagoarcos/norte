/* Detalle de una salida: mapa, números, gráfico de ritmo y parciales por km. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { PaceLine } from '@/components/Charts';
import { RouteMap } from '@/components/RouteMap';
import { Bar, Button, Card, Empty, Section, Stat } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { Alert } from '@/lib/dialog';
import { fmtDur, fmtPace } from '@/lib/fitness';
import type { RunData } from '@/lib/runTracker';
import { unpublishRun } from '@/lib/social';
import { getRec, removeRec, useStoreVersion } from '@/lib/store';

export default function RunDetail() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  useStoreVersion();
  const rec = getRec(id);
  const [w, setW] = useState(0);

  if (!rec || rec.deleted) return <Empty text="Esta salida no existe." />;
  const r = rec.data as RunData;
  const started = new Date(r.startedAt);
  const avgKmh = r.sec ? r.km / (r.sec / 3600) : 0;
  const best = r.splits?.length ? Math.min(...r.splits) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      {r.route?.length > 1 ? (
        <View style={{ height: 320 }}>
          <RouteMap route={r.route} />
        </View>
      ) : null}
      <View style={{ padding: 16 }}>
        <Text style={{ color: c.sub, fontWeight: '700', fontSize: 13, textTransform: 'capitalize' }}>
          {started.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
          {started.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={{ color: c.ink, fontSize: 48, fontWeight: '900', letterSpacing: -2 }}>
          {r.km.toFixed(2)} <Text style={{ fontSize: 20, color: c.sub }}>km</Text>
        </Text>

        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row' }}>
            <Stat value={fmtDur(r.sec)} label="Tiempo" />
            <Stat value={fmtPace(r.sec / r.km)} label="Ritmo /km" />
            <Stat value={avgKmh.toFixed(1)} label="km/h prom" />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <Stat value={r.maxKmh ? r.maxKmh.toFixed(1) : '–'} label="km/h máx" />
            <Stat value={String(r.kcal)} label="kcal" />
            <Stat value={`${r.elevGain ?? 0} m`} label="Desnivel +" />
          </View>
        </Card>

        {r.paceSeries?.length > 1 && (
          <>
            <Section title="Ritmo" />
            <Card>
              <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
                <PaceLine series={r.paceSeries} width={w} fmtPace={fmtPace} />
              </View>
            </Card>
          </>
        )}

        {r.splits?.length > 0 && (
          <>
            <Section title="Parciales" />
            <Card>
              {r.splits.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                  <Text style={{ width: 44, color: c.sub, fontWeight: '700' }}>Km {i + 1}</Text>
                  <View style={{ flex: 1 }}><Bar pct={best / s} color={s === best ? c.green : c.primary} height={10} /></View>
                  <Text style={{ width: 50, textAlign: 'right', color: c.ink, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{fmtPace(s)}</Text>
                </View>
              ))}
              <Text style={{ color: c.sub, fontSize: 12, marginTop: 6 }}>En verde, tu kilómetro más rápido.</Text>
            </Card>
          </>
        )}

        <Button kind="danger" title="Borrar salida" style={{ marginTop: 24 }} onPress={() =>
          Alert.alert('¿Borrar esta salida?', '', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Borrar', style: 'destructive', onPress: () => { removeRec(rec.id); unpublishRun(rec.id).catch(() => {}); router.back(); } },
          ])} />
      </View>
    </ScrollView>
  );
}
