/* Salida en vivo: mapa a pantalla completa + panel con tiempo, distancia, ritmo, km/h. */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteMap } from '@/components/RouteMap';
import { useColors } from '@/constants/theme';
import { Alert } from '@/lib/dialog';
import { useBodyWeight, useDay } from '@/lib/derived';
import { saveRunToHealth } from '@/lib/health';
import { publishRun } from '@/lib/social';
import { fmtDur, fmtPace, runKcal } from '@/lib/fitness';
import {
  activeMs, discardRun, finishRun, liveKm, pauseRun, recoverRun, resumeRun, startRun, useLiveRun,
} from '@/lib/runTracker';

export default function LiveRun() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const live = useLiveRun();
  const kg = useBodyWeight();
  const day = useDay();
  const [, tick] = useState(0);
  const [here, setHere] = useState<[number, number] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [voice, setVoice] = useState(true);
  const lastKmSaid = useRef(Math.floor(liveKm(live))); // al reabrir la pantalla no repite km ya avisados

  // reloj en pantalla
  useEffect(() => {
    if (live?.status !== 'running') return;
    const iv = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(iv);
  }, [live?.status]);

  // posición inicial para el mapa antes de arrancar + recuperar una salida cortada
  useEffect(() => {
    recoverRun();
    (async () => {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status !== 'granted') return;
      const last = await Location.getLastKnownPositionAsync();
      if (last) setHere([last.coords.latitude, last.coords.longitude]);
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setHere([cur.coords.latitude, cur.coords.longitude]);
    })().catch(() => {});
  }, []);

  const km = liveKm(live);
  const sec = activeMs(live) / 1000;
  const avgPace = km > 0.05 ? sec / km : null;
  const kmh = live?.speed != null && live.status === 'running' ? live.speed * 3.6 : km > 0.05 ? km / (sec / 3600) : 0;
  const pts = live?.points ?? [];

  // ritmo de los últimos ~400 m
  let curPace: number | null = null;
  if (pts.length > 1) {
    const last = pts[pts.length - 1];
    let j = pts.length - 1;
    while (j > 0 && last.d - pts[j].d < 0.4) j--;
    const dd = last.d - pts[j].d;
    if (dd > 0.05) curPace = (last.a - pts[j].a) / 1000 / dd;
  }

  // aviso por voz y vibración en cada km
  useEffect(() => {
    const whole = Math.floor(km);
    if (!live || whole < 1 || whole <= lastKmSaid.current) return;
    lastKmSaid.current = whole;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (voice) {
      const p = fmtPace(sec / km).split(':');
      Speech.speak(`Kilómetro ${whole}. Ritmo promedio ${Number(p[0])} minutos ${Number(p[1])} segundos.`, { language: 'es-AR' });
    }
  }, [km, live, sec, voice]);

  const begin = () => {
    setCount(3);
    let n = 3;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const iv = setInterval(async () => {
      n -= 1;
      if (n > 0) {
        setCount(n);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        return;
      }
      clearInterval(iv);
      setCount(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      lastKmSaid.current = 0;
      try { await startRun(); } catch (e: any) { Alert.alert('No puedo usar el GPS', e?.message ?? String(e)); }
    }, 1000);
  };

  const finish = () => {
    Alert.alert('¿Terminar la salida?', `${km.toFixed(2)} km en ${fmtDur(sec)}`, [
      { text: 'Seguir', style: 'cancel' },
      {
        text: 'Terminar', onPress: async () => {
          const rec = await finishRun(kg);
          if (rec) {
            // compartir en el feed de amigos y guardar en Apple Health / Health Connect (en segundo plano)
            publishRun(rec).catch(() => {});
            if (day.settings.health) saveRunToHealth(rec.data).catch(() => {});
            router.replace(`/run/${rec.id}`);
          }
          else Alert.alert('Salida muy corta', 'Casi no se registró distancia. ¿Tenías señal de GPS? Podés seguir o descartarla.');
        },
      },
    ]);
  };

  const discard = () => {
    Alert.alert('¿Descartar la salida?', 'No se guarda nada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: async () => { await discardRun(); router.back(); } },
    ]);
  };

  const route: [number, number][] = pts.length ? pts.map((p) => [p.lat, p.lon]) : here ? [here] : [];
  const gpsWeak = live?.acc != null && live.acc > 25;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1 }}>
        {route.length ? <RouteMap route={route} live /> : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft }}>
            <Ionicons name="locate" size={28} color={c.sub} />
            <Text style={{ color: c.sub, fontWeight: '700', marginTop: 8 }}>Buscando tu ubicación…</Text>
          </View>
        )}
        {/* barra superior */}
        <View style={[st.top, { top: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={[st.round, { backgroundColor: c.card }]}>
            <Ionicons name="chevron-down" size={22} color={c.ink} />
          </Pressable>
          <View style={[st.pill, { backgroundColor: c.card }]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: !live ? c.sub : gpsWeak ? c.amber : c.green }} />
            <Text style={{ color: c.ink, fontWeight: '700', fontSize: 12.5 }}>
              {!live ? 'GPS' : live.acc != null ? `GPS ±${Math.round(live.acc)} m` : 'Buscando GPS…'}
              {live?.mode === 'foreground' ? ' · app abierta' : ''}
            </Text>
          </View>
          <Pressable onPress={() => setVoice((v) => !v)} style={[st.round, { backgroundColor: c.card }]}>
            <Ionicons name={voice ? 'volume-high' : 'volume-mute'} size={19} color={c.ink} />
          </Pressable>
        </View>
      </View>

      {/* panel de datos */}
      <View style={[st.sheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 18 }]}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: c.ink, fontSize: 64, fontWeight: '900', letterSpacing: -3, fontVariant: ['tabular-nums'] }}>{km.toFixed(2)}</Text>
          <Text style={{ color: c.sub, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: -4 }}>
            KILÓMETROS{day.runTarget ? ` · META ${day.runTarget}` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <Metric v={fmtDur(sec)} l="Tiempo" />
          <Metric v={fmtPace(avgPace)} l="Ritmo prom" />
          <Metric v={fmtPace(curPace)} l="Ritmo actual" />
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Metric v={kmh ? kmh.toFixed(1) : '0.0'} l="km/h" />
          <Metric v={String(runKcal(km, kg))} l="kcal" />
          <Metric v={`${Math.round(live?.elevGain ?? 0)} m`} l="Desnivel +" />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 22 }}>
          {!live && (
            <BigBtn color={c.primary} onPress={begin} icon="play" label="Empezar" />
          )}
          {live?.status === 'running' && (
            <BigBtn color={c.amber} onPress={pauseRun} icon="pause" label="Pausa" />
          )}
          {live?.status === 'paused' && (
            <>
              <SmallBtn color={c.red} onPress={discard} icon="trash" />
              <BigBtn color={c.primary} onPress={resumeRun} icon="play" label="Seguir" />
              <BigBtn color={c.ink} onPress={finish} icon="stop" label="Terminar" />
            </>
          )}
        </View>
        {live?.mode === 'foreground' && (
          <Text style={{ color: c.sub, fontSize: 11.5, textAlign: 'center', marginTop: 12 }}>
            Modo prueba: dejá la app abierta mientras corrés (la pantalla no se apaga).
          </Text>
        )}
      </View>

      {count != null && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#fff', fontSize: 160, fontWeight: '900' }}>{count}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: '700' }}>¡Preparate!</Text>
        </View>
      )}
    </View>
  );
}

function Metric({ v, l }: { v: string; l: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: c.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.6, fontVariant: ['tabular-nums'] }}>{v}</Text>
      <Text style={{ color: c.sub, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, marginTop: 2 }}>{l.toUpperCase()}</Text>
    </View>
  );
}

function BigBtn({ color, onPress, icon, label }: { color: string; onPress: () => void; icon: any; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); onPress(); }}
        style={({ pressed }) => [st.big, { backgroundColor: color, transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
        <Ionicons name={icon} size={34} color="#fff" />
      </Pressable>
      <Text style={{ color: color, fontWeight: '800', fontSize: 12.5 }}>{label}</Text>
    </View>
  );
}

function SmallBtn({ color, onPress, icon }: { color: string; onPress: () => void; icon: any }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.small, { backgroundColor: c.soft, transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  top: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, height: 36, borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 18, marginTop: -26, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  big: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  small: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
});
