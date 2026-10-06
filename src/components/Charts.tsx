/* Gráficos livianos: barras (tocá una para ver el valor) y línea de ritmo. */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { useColors } from '@/constants/theme';

export function Bars({ data, unit = '', color, target: refLine, refLabel, height = 140, fmt = (v: number) => String(v) }: {
  data: { label: string; value: number; title?: string }[]; unit?: string; color?: string;
  target?: number; refLabel?: string; height?: number; fmt?: (v: number) => string;
}) {
  const c = useColors();
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value), refLine || 0) * 1.12;
  const shown = sel ?? data.length - 1;
  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        {refLine ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: (refLine / max) * height, borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.sub }}>
            {refLabel ? <Text style={{ position: 'absolute', right: 0, top: -16, fontSize: 10, fontWeight: '700', color: c.sub }}>{refLabel}</Text> : null}
          </View>
        ) : null}
        {data.map((d, i) => (
          <Pressable key={i} onPress={() => setSel(i)} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
            <View style={{
              height: Math.max(d.value > 0 ? 3 : 0, (d.value / max) * height), borderTopLeftRadius: 5, borderTopRightRadius: 5,
              backgroundColor: color ?? c.primary, opacity: shown === i ? 1 : 0.5,
            }} />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: '700', color: shown === i ? c.ink : c.sub }}>{d.label}</Text>
        ))}
      </View>
      {data[shown] ? (
        <Text style={{ textAlign: 'center', marginTop: 6, fontSize: 12.5, color: c.sub, fontWeight: '600' }}>
          <Text style={{ color: c.ink, fontWeight: '800' }}>{data[shown].title ?? data[shown].label}</Text> · {fmt(data[shown].value)} {unit}
        </Text>
      ) : null}
    </View>
  );
}

/* Ritmo (min/km) a lo largo de la distancia. Más arriba = más rápido. */
export function PaceLine({ series, width, height = 150, fmtPace }: {
  series: [number, number][]; width: number; height?: number; fmtPace: (s: number) => string;
}) {
  const c = useColors();
  const [sel, setSel] = useState<number | null>(null);
  if (series.length < 2 || width <= 0) return null;
  const pad = 18;
  const xs = series.map((p) => p[0]);
  const ys = series.map((p) => p[1]);
  const x0 = xs[0], x1 = xs[xs.length - 1];
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const span = hi - lo || 30;
  const px = (x: number) => ((x - x0) / (x1 - x0 || 1)) * (width - 8) + 4;
  const py = (y: number) => pad + ((y - lo) / span) * (height - pad * 2); // ritmo bajo (rápido) arriba
  const d = series.map((p, i) => `${i ? 'L' : 'M'} ${px(p[0])} ${py(p[1])}`).join(' ');
  const area = `${d} L ${px(x1)} ${height} L ${px(x0)} ${height} Z`;
  const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
  const i = sel ?? series.length - 1;
  return (
    <View>
      <Pressable onPress={(e) => {
        const x = e.nativeEvent.locationX;
        let best = 0;
        series.forEach((p, k) => { if (Math.abs(px(p[0]) - x) < Math.abs(px(series[best][0]) - x)) best = k; });
        setSel(best);
      }}>
        <Svg width={width} height={height}>
          <Path d={area} fill={c.primary} opacity={0.12} />
          <Line x1={0} x2={width} y1={py(avg)} y2={py(avg)} stroke={c.sub} strokeDasharray="4 4" strokeWidth={1} />
          <SvgText x={width - 2} y={py(avg) - 4} fill={c.sub} fontSize={10} fontWeight="700" textAnchor="end">prom {fmtPace(avg)}</SvgText>
          <Path d={d} stroke={c.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Line x1={px(series[i][0])} x2={px(series[i][0])} y1={0} y2={height} stroke={c.line} strokeWidth={1} />
          <Circle cx={px(series[i][0])} cy={py(series[i][1])} r={5} fill={c.primary} stroke={c.card} strokeWidth={2} />
        </Svg>
      </Pressable>
      <Text style={{ textAlign: 'center', fontSize: 12.5, color: c.sub, fontWeight: '600', marginTop: 4 }}>
        Km <Text style={{ color: c.ink, fontWeight: '800' }}>{series[i][0].toFixed(1)}</Text> · ritmo{' '}
        <Text style={{ color: c.ink, fontWeight: '800' }}>{fmtPace(series[i][1])} /km</Text>
      </Text>
    </View>
  );
}

/* Líneas sobre fechas (mismo eje): peso por día, % grasa y % músculo. Tocá para ver valores. */
export function TrendLine({ series, unit = '', height = 150, width }: {
  series: { name: string; color: string; points: { x: string; y: number }[] }[]; unit?: string; height?: number; width: number;
}) {
  const c = useColors();
  const [sel, setSel] = useState<string | null>(null);
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort();
  if (xs.length < 2 || width <= 0) return <Text style={{ color: c.sub, fontSize: 13 }}>Hacen falta al menos 2 registros para ver la evolución.</Text>;
  const ys = series.flatMap((s) => s.points.map((p) => p.y));
  const lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo || 1;
  const t0 = new Date(xs[0]).getTime(), t1 = new Date(xs[xs.length - 1]).getTime();
  const px = (x: string) => 6 + ((new Date(x).getTime() - t0) / (t1 - t0 || 1)) * (width - 12);
  const py = (v: number) => 12 + (height - 34) * (1 - (v - lo + span * 0.1) / (span * 1.2));
  const shown = sel ?? xs[xs.length - 1];
  const fmtX = (x: string) => x.slice(5).split('-').reverse().join('/');
  return (
    <View>
      <Pressable onPress={(e) => {
        const x = e.nativeEvent.locationX;
        let best = xs[0];
        xs.forEach((k) => { if (Math.abs(px(k) - x) < Math.abs(px(best) - x)) best = k; });
        setSel(best);
      }}>
        <Svg width={width} height={height}>
          <Line x1={0} x2={width} y1={height - 22} y2={height - 22} stroke={c.line} />
          <Line x1={px(shown)} x2={px(shown)} y1={4} y2={height - 22} stroke={c.line} />
          {series.map((s) => (
            <Path key={s.name} d={s.points.map((p, i) => `${i ? 'L' : 'M'} ${px(p.x)} ${py(p.y)}`).join(' ')} stroke={s.color} strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {series.map((s) => s.points.map((p) => (
            <Circle key={s.name + p.x} cx={px(p.x)} cy={py(p.y)} r={p.x === shown ? 4.5 : 2.5} fill={s.color} stroke={c.card} strokeWidth={1.5} />
          )))}
          <SvgText x={2} y={height - 6} fill={c.sub} fontSize={10} fontWeight="700">{fmtX(xs[0])}</SvgText>
          <SvgText x={width - 2} y={height - 6} fill={c.sub} fontSize={10} fontWeight="700" textAnchor="end">{fmtX(xs[xs.length - 1])}</SvgText>
        </Svg>
      </Pressable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 4 }}>
        <Text style={{ color: c.ink, fontWeight: '800', fontSize: 12.5 }}>{fmtX(shown)}</Text>
        {series.map((s) => {
          const p = s.points.find((q) => q.x === shown);
          return (
            <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
              <Text style={{ color: c.sub, fontSize: 12.5, fontWeight: '600' }}>{s.name}: <Text style={{ color: c.ink, fontWeight: '800' }}>{p ? `${p.y}${unit}` : '–'}</Text></Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
