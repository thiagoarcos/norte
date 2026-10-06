/* CORRER (sección de Salud): plan progresivo, empezar salida con GPS, km por semana, récords e historial. */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Bars } from '@/components/Charts';
import { RouteSketch } from '@/components/RouteSketch';
import { Bar, Button, Card, Empty, Field, Row, Section, Stat } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { fmtDay, useBodyWeight, useDay } from '@/lib/derived';
import { RUN_DEFAULTS, fmtDur, fmtPace, runKcal, runLevelInfo } from '@/lib/fitness';
import { useRecords } from '@/lib/achievements';
import { useLiveRun, type RunData } from '@/lib/runTracker';
import { addRec, setSettings, today, useRecs } from '@/lib/store';

export function CorrerSection() {
  const c = useColors();
  const runs = useRecs<RunData>('run');
  const day = useDay();
  const live = useLiveRun();
  const kg = useBodyWeight();
  const plan = day.settings.runPlan;
  const [edit, setEdit] = useState<Record<string, string> | null>(null);
  const [manual, setManual] = useState({ km: '', min: '' });

  const info = plan ? runLevelInfo(plan, today()) : null;
  const records = useRecords();

  const weeks = useMemo(() => {
    const monday = new Date(today() + 'T00:00:00');
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 8 }, (_, i) => {
      const a = new Date(monday); a.setDate(a.getDate() - (7 - i) * 7);
      const b = new Date(a); b.setDate(b.getDate() + 6);
      const ka = today(a), kb = today(b);
      const km = runs.filter((r) => r.date >= ka && r.date <= kb).reduce((s, r) => s + r.data.km, 0);
      return { label: `${a.getDate()}/${a.getMonth() + 1}`, title: `Semana del ${a.getDate()}/${a.getMonth() + 1}`, value: Math.round(km * 10) / 10 };
    });
  }, [runs]);

  const totals = useMemo(() => {
    const gps = runs.filter((r) => r.data.sec > 0 && r.data.km >= 1);
    return {
      km: Math.round(runs.reduce((s, r) => s + r.data.km, 0) * 10) / 10,
      longest: runs.reduce((m, r) => Math.max(m, r.data.km), 0),
      bestPace: gps.length ? Math.min(...gps.map((r) => r.data.sec / r.data.km)) : null,
    };
  }, [runs]);

  const savePlan = () => {
    const d = edit!;
    setSettings({
      runPlan: {
        startDate: d.startDate || today(),
        startKm: Number(d.startKm) || RUN_DEFAULTS.startKm,
        stepKm: Number(d.stepKm) || 0,
        everyDays: Math.max(1, Number(d.everyDays) || RUN_DEFAULTS.everyDays),
        maxKm: Number(d.maxKm) || 0,
      },
    });
    setEdit(null);
  };

  const openEdit = () => setEdit({
    startDate: plan?.startDate ?? today(),
    startKm: String(plan?.startKm ?? RUN_DEFAULTS.startKm),
    stepKm: String(plan?.stepKm ?? RUN_DEFAULTS.stepKm),
    everyDays: String(plan?.everyDays ?? RUN_DEFAULTS.everyDays),
    maxKm: String(plan?.maxKm ?? 0),
  });

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
        <Button small kind="soft" title="Amigos" icon={<Ionicons name="people" size={16} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />} onPress={() => router.push('/social')} />
      </View>
      {/* Hero del día */}
      <View style={{ backgroundColor: c.primary, borderRadius: 26, padding: 20, shadowColor: c.primary, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}>
        {plan && info ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }}>HOY · NIVEL {info.level}</Text>
              <Ionicons name="create-outline" size={20} color="#fff" onPress={openEdit} />
            </View>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1.2, marginTop: 4 }}>
              {day.runKm} <Text style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)' }}>/ {day.runTarget} km</Text>
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: 12 }}>
              {day.runKm >= day.runTarget ? '✓ Meta del día cumplida' : `Te faltan ${Math.round((day.runTarget - day.runKm) * 100) / 100} km`}
              {info.nextKm > day.runTarget ? ` · en ${info.daysLeft} días pasás a ${info.nextKm} km` : ''}
            </Text>
            <Bar pct={day.runKm / (day.runTarget || 1)} color="#fff" track="rgba(255,255,255,0.25)" height={9} />
          </>
        ) : (
          <>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>Plan progresivo</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 4 }}>
              Arrancás con {RUN_DEFAULTS.startKm} km por día y cada {RUN_DEFAULTS.everyDays} días sumás {RUN_DEFAULTS.stepKm} km.
            </Text>
            {!edit && <Button kind="soft" title="Armar mi plan" style={{ marginTop: 14 }} onPress={openEdit} />}
          </>
        )}
        <Button title={live ? 'Volver a la salida' : 'Empezar a correr'} kind="white"
          style={{ marginTop: 16 }}
          icon={<Ionicons name="play" size={18} color={c.primary} />} onPress={() => router.push('/run/live')} />
      </View>

      {edit && (
        <Card style={{ marginTop: 12, gap: 10 }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 }}>Tu plan</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field label="Km/día al inicio" keyboardType="decimal-pad" value={edit.startKm} onChangeText={(t) => setEdit({ ...edit, startKm: t })} />
            <Field label="Sumar km" keyboardType="decimal-pad" value={edit.stepKm} onChangeText={(t) => setEdit({ ...edit, stepKm: t })} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field label="Cada (días)" keyboardType="number-pad" value={edit.everyDays} onChangeText={(t) => setEdit({ ...edit, everyDays: t })} />
            <Field label="Tope km (0 = sin tope)" keyboardType="decimal-pad" value={edit.maxKm} onChangeText={(t) => setEdit({ ...edit, maxKm: t })} />
          </View>
          <Field label="Empieza (AAAA-MM-DD)" value={edit.startDate} onChangeText={(t) => setEdit({ ...edit, startDate: t })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Guardar" onPress={savePlan} style={{ flex: 1 }} />
            <Button kind="ghost" title="Cancelar" onPress={() => setEdit(null)} />
          </View>
        </Card>
      )}

      {runs.length > 0 && (
        <>
          <Section title="Km por semana" />
          <Card>
            <Bars data={weeks} unit="km" target={day.runTarget ? day.runTarget * 7 : undefined} refLabel={day.runTarget ? `meta ${day.runTarget * 7} km` : undefined} />
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Stat value={`${totals.km}`} label="km totales" />
              <Stat value={`${totals.longest.toFixed(1)}`} label="más larga" />
              <Stat value={fmtPace(totals.bestPace)} label="mejor ritmo" />
            </View>
          </Card>
        </>
      )}

      {runs.length > 0 && (
        <>
          <Section title="Récords personales" />
          <Card>
            {records.list.map((r) => (
              <Row key={r.label} onPress={r.runId ? () => router.push(`/run/${r.runId}`) : undefined}
                left={<Ionicons name="trophy" size={20} color={r.sec ? c.amber : c.line} />}
                title={r.label}
                sub={r.date ? fmtDay(r.date) : 'Todavía no'}
                right={<Text style={{ color: r.sec ? c.ink : c.sub, fontWeight: '800', fontSize: 16, fontVariant: ['tabular-nums'] }}>{r.sec ? fmtDur(r.sec) : '–'}</Text>} />
            ))}
            {records.longest && (
              <Row onPress={() => router.push(`/run/${records.longest!.id}`)}
                left={<Ionicons name="trending-up" size={20} color={c.primary} />}
                title="Salida más larga" sub={fmtDay(records.longest.date)}
                right={<Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 }}>{records.longest.data.km.toFixed(2)} km</Text>} />
            )}
            <Text style={{ color: c.sub, fontSize: 11.5, marginTop: 4 }}>Calculados con tus parciales por km (mejor tramo dentro de cualquier salida).</Text>
          </Card>
        </>
      )}

      <Section title="Historial" />
      <Card style={{ paddingVertical: 6 }}>
        {runs.length === 0 && <Empty text="Todavía no hay salidas. ¡Tocá Empezar a correr!" />}
        {runs.slice(0, 40).map((r) => (
          <Row key={r.id} onPress={() => router.push(`/run/${r.id}`)}
            left={<RouteSketch route={r.data.route} size={52} />}
            title={`${r.data.km.toFixed(2)} km`}
            sub={`${fmtDay(r.date)} · ${r.data.sec ? `${fmtDur(r.data.sec)} · ${fmtPace(r.data.sec / r.data.km)} /km` : 'cargada a mano'} · ${r.data.kcal} kcal`}
            right={<Ionicons name="chevron-forward" size={18} color={c.sub} />} />
        ))}
      </Card>

      <Section title="Cargar a mano" />
      <Card style={{ gap: 10 }}>
        <Text style={{ color: c.sub, fontSize: 13 }}>Para cinta o salidas que registraste con otra app.</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Field label="Km" keyboardType="decimal-pad" value={manual.km} onChangeText={(t) => setManual({ ...manual, km: t })} />
          <Field label="Minutos" keyboardType="number-pad" value={manual.min} onChangeText={(t) => setManual({ ...manual, min: t })} />
          <Button title="Guardar" onPress={() => {
            const km = Number(manual.km.replace(',', '.'));
            if (!(km > 0)) return;
            const sec = Math.round((Number(manual.min) || 0) * 60);
            addRec<RunData>('run', {
              startedAt: Date.now(), km, sec, kcal: runKcal(km, kg), elevGain: 0, splits: [], route: [],
              paceSeries: [], maxKmh: 0, source: 'manual',
            });
            setManual({ km: '', min: '' });
          }} />
        </View>
      </Card>
    </>
  );
}
