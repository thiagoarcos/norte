/* Paleta de Vamo: naranja fuego + amarillo (como el logo), tarjetas blancas
   en claro y casi-negro en oscuro. Todo color sale de acá. */
import { useColorScheme } from 'react-native';

import { useSettings } from '@/lib/store';

const light = {
  bg: '#F4F5F8',
  card: '#FFFFFF',
  ink: '#0A0B10',
  sub: '#6B7280',
  line: '#E8E9EE',
  soft: '#EEF0F4',
  primary: '#FF5A1F',
  primarySoft: '#FFEDE3',
  primaryInk: '#C2410C',
  accent: '#FFB020',
  amber: '#F59E0B',
  amberSoft: '#FEF3E2',
  amberInk: '#B45309',
  green: '#16A34A',
  greenSoft: '#E7F7EC',
  red: '#EF4444',
  water: '#0EA5E9',
  waterLight: '#7DD3FC',
  waterSoft: '#E0F4FD',
  onPrimary: '#FFFFFF',
  pink: '#EC4899',
  pinkSoft: '#FCE7F3',
  pinkInk: '#BE185D',
  okInk: '#2E9E4F',
};

const dark: typeof light = {
  bg: '#07080B',
  card: '#111218',
  ink: '#F5F6F8',
  sub: '#8B8F9A',
  line: '#1E2029',
  soft: '#181A21',
  primary: '#FF6B2C',
  primarySoft: '#3A1A0C',
  primaryInk: '#FFB38A',
  accent: '#FFC23D',
  amber: '#FBBF24',
  amberSoft: '#3A2A0B',
  amberInk: '#FCD34D',
  green: '#4ADE80',
  greenSoft: '#0F2A1A',
  red: '#F87171',
  water: '#38BDF8',
  waterLight: '#7DD3FC',
  waterSoft: '#0C2A3B',
  onPrimary: '#FFFFFF',
  pink: '#EC4899',
  pinkSoft: 'rgba(236,72,153,0.16)',
  pinkInk: '#F9A8D4',
  okInk: '#4ADE80',
};

export type Palette = typeof light;
export const Palettes = { light, dark };

/* El tema sale del sistema, salvo que elijas claro u oscuro a mano (como en NORTE). */
export function useColors(): Palette & { scheme: 'light' | 'dark' } {
  const s = useColorScheme();
  const pref = useSettings().theme;
  const scheme = pref === 'light' || pref === 'dark' ? pref : s === 'dark' ? 'dark' : 'light';
  return { ...Palettes[scheme], scheme };
}

export const Radius = { sm: 10, md: 14, lg: 20, xl: 26 } as const;
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
