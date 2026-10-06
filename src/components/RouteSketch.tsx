/* Dibujo liviano del recorrido (sin mapa), para listas. */
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { useColors } from '@/constants/theme';

export function RouteSketch({ route, size = 56 }: { route: [number, number][]; size?: number }) {
  const c = useColors();
  if (!route || route.length < 2) return <View style={{ width: size, height: size, borderRadius: 14, backgroundColor: c.primarySoft }} />;
  const lat0 = (route[0][0] * Math.PI) / 180;
  const xy = route.map(([la, lo]) => [lo * Math.cos(lat0), -la]);
  const xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 8;
  const sc = Math.min((size - 2 * pad) / (maxX - minX || 1e-9), (size - 2 * pad) / (maxY - minY || 1e-9));
  const ox = (size - (maxX - minX) * sc) / 2, oy = (size - (maxY - minY) * sc) / 2;
  const pts = xy.map(([x, y]) => `${ox + (x - minX) * sc},${oy + (y - minY) * sc}`).join(' ');
  return (
    <View style={{ width: size, height: size, borderRadius: 14, backgroundColor: c.primarySoft }}>
      <Svg width={size} height={size}>
        <Polyline points={pts} fill="none" stroke={c.primary} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
