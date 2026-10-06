/* CUERPO (de NORTE): peso (días / por mes con tabla), grasa y músculo (cinta Navy o
   balanza) con evolución, y medidas corporales. */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Bars, TrendLine } from '@/components/Charts';
import { Button, Card, Field, Note, Section, Segmented } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { composition, monthly, navyBodyFat } from '@/lib/fitness';
import { useNorte } from '@/lib/norte';
import { MONTHS, fmtDate, uid, ymLabel } from '@/lib/norteData';
import { up } from '@/lib/store';
import { flash } from '@/lib/toast';

export function CuerpoSection() {
  const c = useColors();
  const d = useNorte();
  const s = d.s;
  const [w, setW] = useState(0);
  const [kg, setKg] = useState('');
  const [view, setView] = useState<'dias' | 'meses'>('dias');
  const [draft, setDraft] = useState({ neck: '', waist: '', hip: '', bf: '', muscle: '' });
  const [meas, setMeas] = useState({ waist: '', chest: '', arm: '' });

  const last = d.weightEntriesAll.slice(-30);
  const months = monthly(s.weightLog) as { ym: string; avg: number; n: number }[];
  const profile = { sex: 'm', ...(s.profile || {}) };
  const navy = navyBodyFat({ sex: profile.sex, height: profile.height, neck: draft.neck, waist: draft.waist, hip: draft.hip });
  const bfLog: Record<string, number> = { ...((d.cut && d.cut.bfLog) || {}) };
  Object.entries<any>(s.bodyComp || {}).forEach(([k, v]) => { if (v && v.bf) bfLog[k] = v.bf; });
  const weightAt = (k: string) => {
    let x = 0;
    for (const [kk, v] of d.weightEntriesAll) { if (kk <= k) x = Number(v); else break; }
    return x || (d.weightEntriesAll[0] ? Number(d.weightEntriesAll[0][1]) : 0);
  };
  const comps = Object.keys(bfLog).sort().map((k) => {
    const wk = weightAt(k);
    const cc = composition(wk, bfLog[k], (s.bodyComp || {})[k]?.muscle);
    return cc ? { d: k, bf: bfLog[k], w: wk, c: cc } : null;
  }).filter(Boolean) as any[];
  const latest = comps[comps.length - 1] || null;
  const bfMonths = monthly(bfLog) as { ym: string; avg: number }[];

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width - 32)}>
      <Section title="Peso corporal" />
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Field keyboardType="decimal-pad" placeholder={d.bodyWeight ? `Tu peso hoy (último ${d.bodyWeight} kg)` : 'Tu peso hoy (kg)'} value={kg} onChangeText={setKg} />
          <Button title="Guardar" onPress={() => {
            const v = Number(kg.replace(',', '.'));
            if (!v) return;
            up((st) => { st.weightLog[d.today] = v; });
            setKg('');
          }} />
        </View>
        <Segmented options={[['dias', 'Últimos días'], ['meses', 'Por mes']]} value={view} onChange={setView} />
        {view === 'dias' ? (
          last.length >= 2
            ? <TrendLine width={w} unit=" kg" series={[{ name: 'Peso', color: c.primary, points: last.map(([k, v]: any) => ({ x: k, y: Number(v) })) }]} />
            : <Text style={{ color: c.sub, fontSize: 13 }}>Registrá tu peso al menos 2 días para ver el gráfico. También se usa en el análisis de fuerza y en las kcal de correr.</Text>
        ) : months.length ? (
          <>
            <Bars unit="kg" fmt={(v) => v.toLocaleString('es-AR')}
              data={months.slice(-8).map((m) => ({ label: MONTHS[Number(m.ym.slice(5)) - 1].slice(0, 3), title: ymLabel(m.ym), value: m.avg }))} />
            <View>
              <View style={{ flexDirection: 'row', paddingVertical: 4 }}>
                {['MES', 'PESO', 'CAMBIO', '% GRASA'].map((h, i) => <Text key={h} style={{ flex: i === 0 ? 1.2 : 1, textAlign: i ? 'right' : 'left', color: c.sub, fontSize: 11, fontWeight: '800' }}>{h}</Text>)}
              </View>
              {months.slice(-6).reverse().map((m) => {
                const idx = months.indexOf(m);
                const prev = idx > 0 ? months[idx - 1].avg : null;
                const delta = prev != null ? Math.round((m.avg - prev) * 10) / 10 : null;
                const bfM = bfMonths.find((b) => b.ym === m.ym);
                return (
                  <View key={m.ym} style={{ flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.line }}>
                    <Text style={{ flex: 1.2, color: c.sub, fontWeight: '600', fontSize: 13 }}>{ymLabel(m.ym).split(' ')[0]}</Text>
                    <Text style={{ flex: 1, textAlign: 'right', color: c.ink, fontWeight: '800', fontSize: 13 }}>{m.avg} kg</Text>
                    <Text style={{ flex: 1, textAlign: 'right', color: c.ink, fontWeight: '600', fontSize: 13 }}>{delta == null ? '–' : `${delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : ''}${delta} kg`}</Text>
                    <Text style={{ flex: 1, textAlign: 'right', color: c.ink, fontWeight: '600', fontSize: 13 }}>{bfM ? `${bfM.avg} %` : '–'}</Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : <Text style={{ color: c.sub, fontSize: 13 }}>Todavía no hay pesadas registradas.</Text>}
      </Card>

      <Section title="Grasa y músculo" />
      <Card style={{ gap: 10 }}>
        {latest ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                [`${latest.bf} %`, 'GRASA', `${latest.c.fatKg} kg`],
                [`${latest.c.musclePct} %`, latest.c.muscleEstimated ? 'MÚSCULO*' : 'MÚSCULO', `${latest.c.muscleKg} kg`],
                [`${latest.c.leanKg} kg`, 'MASA MAGRA', `de ${latest.w} kg`],
              ].map(([v, l, sub]) => (
                <View key={l} style={{ flex: 1, backgroundColor: c.soft, borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: c.ink, fontSize: 17, fontWeight: '900' }}>{v}</Text>
                  <Text style={{ color: c.sub, fontSize: 10.5, fontWeight: '800' }}>{l}</Text>
                  <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '600' }}>{sub}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <View style={{ width: `${latest.bf}%`, backgroundColor: c.amber }} />
              <View style={{ flex: 1, backgroundColor: c.primary }} />
            </View>
            <Text style={{ color: c.sub, fontSize: 12, fontWeight: '700' }}>Amarillo: grasa · Naranja: masa magra (músculo, huesos, agua)</Text>
            {comps.length >= 2 && (
              <TrendLine width={w} unit=" %" series={[
                { name: '% grasa', color: c.amber, points: comps.map((x) => ({ x: x.d, y: x.bf })) },
                { name: '% músculo', color: c.primary, points: comps.map((x) => ({ x: x.d, y: x.c.musclePct })) },
              ]} />
            )}
          </>
        ) : <Text style={{ color: c.sub, fontSize: 13, lineHeight: 19 }}>Cargá tus medidas con cinta (cuello y cintura) o los números de una balanza de bioimpedancia para ver tu % de grasa y músculo mes a mes.</Text>}

        <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 12, gap: 8 }}>
          <Text style={{ color: c.ink, fontWeight: '700', fontSize: 13.5 }}>Medición de hoy</Text>
          <Segmented options={[['m', 'Hombre'], ['f', 'Mujer']]} value={profile.sex} onChange={(v) => up((st) => { st.profile = { ...(st.profile || {}), sex: v }; })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field label="Altura cm" keyboardType="number-pad" value={profile.height ? String(profile.height) : ''} onChangeText={(t) => up((st) => { st.profile = { ...(st.profile || {}), height: Number(t) || '' }; })} />
            <Field label="Cuello cm" keyboardType="decimal-pad" value={draft.neck} onChangeText={(t) => setDraft({ ...draft, neck: t })} />
            <Field label="Cintura cm" keyboardType="decimal-pad" value={draft.waist} onChangeText={(t) => setDraft({ ...draft, waist: t })} />
            {profile.sex === 'f' && <Field label="Cadera cm" keyboardType="decimal-pad" value={draft.hip} onChangeText={(t) => setDraft({ ...draft, hip: t })} />}
          </View>
          {navy != null && <Note>Con la cinta te da {navy} % de grasa (método Navy, ±3 %).</Note>}
          <Text style={{ color: c.sub, fontSize: 12, fontWeight: '600' }}>¿Tenés balanza con bioimpedancia? Poné sus valores (opcional, pisan la cinta):</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field label="% grasa (balanza)" keyboardType="decimal-pad" value={draft.bf} onChangeText={(t) => setDraft({ ...draft, bf: t })} />
            <Field label="% músculo (balanza)" keyboardType="decimal-pad" value={draft.muscle} onChangeText={(t) => setDraft({ ...draft, muscle: t })} />
          </View>
          <Button title="Guardar medición" onPress={() => {
            const bf = Number(draft.bf.replace(',', '.')) || navy;
            if (!bf) { flash('Poné cuello y cintura (y tu altura), o el % de grasa de la balanza'); return; }
            if (!d.bodyWeight) { flash('Registrá tu peso primero (arriba)'); return; }
            const v = Math.round(bf * 10) / 10;
            up((st) => {
              st.bodyComp = st.bodyComp || {};
              st.bodyComp[d.today] = {
                bf: v, muscle: Number(draft.muscle) || null, neck: Number(draft.neck) || null, waist: Number(draft.waist) || null, hip: Number(draft.hip) || null,
                method: Number(draft.bf) ? 'balanza' : 'cinta',
              };
              if (st.cut) { st.cut.bfLog = st.cut.bfLog || {}; st.cut.bfLog[d.today] = v; }
            });
            setDraft({ neck: '', waist: '', hip: '', bf: '', muscle: '' });
            flash(`📊 Guardado: ${v} % de grasa`);
          }} />
          <Text style={{ color: c.sub, fontSize: 11.5, lineHeight: 16 }}>Medí siempre en ayunas, a la misma hora, 1 vez cada 2–4 semanas. *El % de músculo sin balanza es una estimación (≈53 % de tu masa magra).</Text>
        </View>
      </Card>

      <Section title="Medidas corporales" />
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Field label="Cintura cm" keyboardType="decimal-pad" value={meas.waist} onChangeText={(t) => setMeas({ ...meas, waist: t })} />
          <Field label="Pecho cm" keyboardType="decimal-pad" value={meas.chest} onChangeText={(t) => setMeas({ ...meas, chest: t })} />
          <Field label="Brazo cm" keyboardType="decimal-pad" value={meas.arm} onChangeText={(t) => setMeas({ ...meas, arm: t })} />
          <Button small title="＋" onPress={() => {
            if (!meas.waist && !meas.chest && !meas.arm) return;
            up((st) => { st.measurements.push({ id: uid(), date: d.today, ...meas }); });
            setMeas({ waist: '', chest: '', arm: '' });
          }} />
        </View>
        {[...s.measurements].reverse().slice(0, 6).map((m: any) => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 6 }}>
            <Text style={{ color: c.sub, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>{fmtDate(m.date)}</Text>
            <Text style={{ flex: 1, color: c.ink, fontWeight: '600', fontSize: 13, textAlign: 'right' }}>Cint {m.waist || '–'} · Pecho {m.chest || '–'} · Brazo {m.arm || '–'}</Text>
            <Ionicons name="close" size={18} color={c.red} onPress={() => up((st) => { st.measurements = st.measurements.filter((x: any) => x.id !== m.id); })} />
          </View>
        ))}
        {s.measurements.length === 0 && <Text style={{ color: c.sub, fontSize: 13 }}>Registrá tus medidas para seguir el progreso más allá de la balanza.</Text>}
      </Card>
    </View>
  );
}
