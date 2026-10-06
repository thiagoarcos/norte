/* Componentes base de Vamo: pantallas, tarjetas, botones, inputs, barras. */
import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Space, useColors } from '@/constants/theme';

export function Screen({ title, subtitle, right, children, scroll = true }: {
  title?: string; subtitle?: string; right?: ReactNode; children: ReactNode; scroll?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const header = title ? (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: Space.lg, marginTop: Space.sm }}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={[s.kicker, { color: c.primary }]}>{subtitle.toUpperCase()}</Text> : null}
        <Text style={[s.h1, { color: c.ink }]}>{title}</Text>
      </View>
      {right}
    </View>
  ) : null;
  if (!scroll) {
    return <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + Space.sm, paddingHorizontal: Space.lg, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="never">
      {header}
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useColors();
  const base = [s.card, { backgroundColor: c.card, borderColor: c.line }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

export function Section({ title, right }: { title: string; right?: ReactNode }) {
  const c = useColors();
  return (
    <View style={s.section}>
      <Text style={[s.sectionText, { color: c.sub }]}>{title.toUpperCase()}</Text>
      {right}
    </View>
  );
}

type BtnKind = 'primary' | 'soft' | 'ghost' | 'danger' | 'dark' | 'white';
export function Button({ title, onPress, kind = 'primary', small, icon, loading, disabled, style }: {
  title?: string; onPress?: () => void; kind?: BtnKind; small?: boolean; icon?: ReactNode;
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = { primary: c.primary, soft: c.primarySoft, ghost: 'transparent', danger: 'transparent', dark: c.ink, white: '#FFFFFF' }[kind];
  const fg = { primary: c.onPrimary, soft: c.scheme === 'dark' ? c.primaryInk : c.primary, ghost: c.sub, danger: c.red, dark: c.bg, white: c.primary }[kind];
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress?.(); }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, paddingVertical: small ? 9 : 14, paddingHorizontal: small ? 14 : 18, opacity: disabled ? 0.5 : 1 },
        kind === 'primary' && { shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
        pressed && { transform: [{ scale: 0.96 }] },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon}
          {title ? <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13.5 : 15.5 }}>{title}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const c = useColors();
  const { label, style, ...rest } = props;
  return (
    <View style={{ flex: 1 }}>
      {label ? <Text style={[s.label, { color: c.sub }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={c.sub}
        {...rest}
        style={[s.input, { backgroundColor: c.soft, color: c.ink, borderColor: c.line }, style as StyleProp<TextStyle>]}
      />
    </View>
  );
}

export function Bar({ pct, color, height = 8, track }: { pct: number; color: string; height?: number; track?: string }) {
  const c = useColors();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track ?? c.line, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: [T, string][]; value: T; onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View style={[s.seg, { backgroundColor: c.soft }]}>
      {options.map(([v, l]) => {
        const on = v === value;
        return (
          <Pressable key={v} onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(v); }}
            style={[s.segItem, on && { backgroundColor: c.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 }]}>
            <Text style={{ fontWeight: '700', fontSize: 13.5, color: on ? c.ink : c.sub }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stat({ value, label, big, align = 'center' }: { value: string; label: string; big?: boolean; align?: 'center' | 'flex-start' }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: align }}>
      <Text style={{ color: c.ink, fontSize: big ? 34 : 22, fontWeight: '800', letterSpacing: -0.8, fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text style={{ color: c.sub, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginTop: 2 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function Row({ title, sub, left, right, onPress }: { title: string; sub?: string; left?: ReactNode; right?: ReactNode; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: c.ink, fontWeight: '600', fontSize: 15 }} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={{ color: c.sub, fontSize: 12.5, marginTop: 1 }} numberOfLines={2}>{sub}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

export function Empty({ text }: { text: string }) {
  const c = useColors();
  return <Text style={{ color: c.sub, textAlign: 'center', padding: Space.lg, fontSize: 13.5 }}>{text}</Text>;
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: tone === 'warn' ? c.amberSoft : c.primarySoft, borderRadius: Radius.md, padding: Space.md }}>
      <Text style={{ color: tone === 'warn' ? c.amberInk : c.primaryInk, fontSize: 13, fontWeight: '600', lineHeight: 19 }}>{children}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  h1: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  card: { borderRadius: Radius.lg, padding: Space.lg, borderWidth: StyleSheet.hairlineWidth },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Space.xl, marginBottom: Space.sm, paddingHorizontal: 4 },
  sectionText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.8 },
  btn: { borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontSize: 11.5, fontWeight: '700', marginBottom: 4 },
  input: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15.5, borderWidth: 1 },
  seg: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});

/* ---------- piezas que venían de NORTE ---------- */
const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/* Check redondo (hábitos, ejercicios, temas). */
export function Check({ done, onPress, color }: { done: boolean; onPress: () => void; color?: string }) {
  const c = useColors();
  const col = color ?? c.primary;
  return (
    <Pressable hitSlop={8} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
      style={({ pressed }) => ({
        width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
        backgroundColor: done ? col : 'transparent', borderWidth: done ? 0 : 2, borderColor: c.line,
        transform: [{ scale: pressed ? 0.88 : 1 }],
      })}>
      {done ? <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>✓</Text> : null}
    </Pressable>
  );
}

/* Selector de días de la semana (varios). */
export function DayPicker({ days, onToggle }: { days: number[]; onToggle: (d: number) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {DAY_LETTERS.map((l, i) => {
        const on = days.includes(i);
        return (
          <Pressable key={i} onPress={() => onToggle(i)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center', backgroundColor: on ? c.primarySoft : c.soft }}>
            <Text style={{ fontWeight: '800', fontSize: 12.5, color: on ? (c.scheme === 'dark' ? c.primaryInk : c.primary) : c.sub }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* Chip seleccionable. */
export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, opacity: pressed ? 0.7 : 1,
      backgroundColor: on ? c.primarySoft : c.soft,
    })}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: on ? (c.scheme === 'dark' ? c.primaryInk : c.primary) : c.sub }}>{label}</Text>
    </Pressable>
  );
}

/* Caja de macro: valor / meta con barra. */
export function MacroBox({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, minWidth: '45%' }}>
      <Text style={{ fontSize: 12.5, color: c.sub, fontWeight: '700', marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: c.ink }}>
        {value}<Text style={{ fontSize: 12, color: c.sub, fontWeight: '600' }}> / {goal} {unit}</Text>
      </Text>
      <View style={{ marginTop: 6 }}><Bar pct={goal ? value / goal : 0} color={color} height={8} /></View>
    </View>
  );
}

export function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 13, color: c.sub, fontWeight: '600', flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '800', color: c.ink }}>{value}</Text>
    </View>
  );
}

export function BigStat({ value, label, color }: { value: string | number; label: string; color: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '900', color, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 11.5, color: c.sub, fontWeight: '600', textAlign: 'center', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

/* Ícono chico cuadrado (editar, borrar…). */
export function IconBtn({ children, onPress, tone }: { children: ReactNode; onPress: () => void; tone?: 'danger' }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => ({
      width: 32, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.soft, opacity: pressed ? 0.6 : 1,
    })}>
      {typeof children === 'string' ? <Text style={{ color: tone === 'danger' ? c.red : c.sub, fontWeight: '800' }}>{children}</Text> : children}
    </Pressable>
  );
}
