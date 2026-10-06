/* Esfera de agua que se llena con ondas a medida que tomás. */
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useColors } from '@/constants/theme';

function Wave({ width, amp, color, opacity, duration, reverse, gradient }: {
  width: number; amp: number; color: string; opacity: number; duration: number; reverse?: boolean; gradient?: [string, string];
}) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [duration, x]);
  const wl = width / 2; // longitud de onda
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (reverse ? 1 - x.value : x.value) * wl - wl }],
  }));
  // tira de 2 anchos + 1 longitud para que el loop no tenga saltos
  const W = width * 2 + wl;
  let d = `M 0 ${amp}`;
  for (let i = 0; i * wl < W; i++) d += ` q ${wl / 4} ${-amp} ${wl / 2} 0 t ${wl / 2} 0`;
  d += ` V 4000 H 0 Z`;
  return (
    <Animated.View style={[{ position: 'absolute', top: -amp, left: 0, width: W, height: 4000, opacity }, style]}>
      <Svg width={W} height={4000}>
        {gradient ? (
          <Defs>
            <LinearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="0.12" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Path d={d} fill={gradient ? 'url(#wg)' : color} />
      </Svg>
    </Animated.View>
  );
}

export function WaterSphere({ pct, size = 230, children }: { pct: number; size?: number; children?: ReactNode }) {
  const c = useColors();
  const p = Math.max(0, Math.min(1, pct || 0));
  const level = useSharedValue(p);
  useEffect(() => {
    level.value = withSpring(p, { damping: 14, stiffness: 90 });
  }, [p, level]);
  const water = useAnimatedStyle(() => ({ top: size * (1 - level.value) }));
  const amp = Math.max(4, size * 0.035);
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
        backgroundColor: c.waterSoft, borderWidth: Math.max(3, size * 0.018), borderColor: p >= 1 ? c.primary : c.water,
      }}>
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, water]}>
          <Wave width={size} amp={amp * 0.8} color={c.waterLight} opacity={0.55} duration={5200} reverse />
          <View style={{ position: 'absolute', top: 4, left: 0, right: 0 }}>
            <Wave width={size} amp={amp} color={c.water} opacity={1} duration={3300} gradient={[c.waterLight, c.water]} />
          </View>
        </Animated.View>
        {/* brillo de vidrio */}
        <View style={{
          position: 'absolute', top: size * 0.14, left: size * 0.2, width: size * 0.2, height: size * 0.1,
          borderRadius: size, backgroundColor: '#fff', opacity: 0.35, transform: [{ rotate: '-35deg' }],
        }} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
