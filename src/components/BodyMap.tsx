/* Muñeco de músculos (frente / espalda). Con `heat` pinta cada músculo con su color
   (saturación); tocá un músculo para seleccionarlo. Mismo dibujo que la PWA. */
import Svg, { Ellipse, G, Line, Path } from 'react-native-svg';

import { useColors } from '@/constants/theme';

export const FRONT_MUSCLES = ['hombros', 'pecho', 'biceps', 'antebrazos', 'abdomen', 'oblicuos', 'cuadriceps', 'aductores'];
export const BACK_MUSCLES = ['trapecio', 'hombros', 'espalda', 'triceps', 'antebrazos', 'lumbar', 'gluteos', 'isquios', 'gemelos'];

export function BodyMap({ side, selected, onSelect, heat, width = 220 }: {
  side: 'front' | 'back'; selected?: string | null; onSelect?: (m: string) => void;
  heat?: Record<string, string>; width?: number;
}) {
  const c = useColors();
  const P = (id: string) => ({
    fill: heat ? heat[id] ?? c.line : selected === id ? c.accent : c.primary,
    opacity: selected === id ? 1 : heat ? 0.88 : 0.55,
    stroke: selected === id ? c.ink : 'none',
    strokeWidth: 1.5,
    onPress: () => onSelect?.(id),
  });
  const height = width * 2.2;
  return (
    <Svg width={width} height={height} viewBox="0 0 200 440" style={{ alignSelf: 'center' }}>
      <G fill={c.scheme === 'dark' ? '#2A2D36' : '#E2E4EA'}>
        <Ellipse cx="100" cy="24" rx="14" ry="16" />
        <Path d="M90 37 Q100 43 110 37 Q113 47 110 53 Q100 58 90 53 Q87 47 90 37 Z" />
        <Path d="M58 58 Q100 46 142 58 Q140 78 136 96 Q131 116 123 152 Q124 162 123 170 Q112 178 100 178 Q88 178 77 170 Q76 162 77 152 Q69 116 64 96 Q60 78 58 58 Z" />
        <Path d="M60 60 Q45 65 42 82 Q39 104 42 124 Q42 144 38 162 Q36 180 34 196 Q40 200 46 199 Q49 182 51 165 Q54 146 53 128 Q55 106 56 88 Q57 70 60 60 Z" />
        <Path d="M140 60 Q155 65 158 82 Q161 104 158 124 Q158 144 162 162 Q164 180 166 196 Q160 200 154 199 Q151 182 149 165 Q146 146 147 128 Q145 106 144 88 Q143 70 140 60 Z" />
        <Path d="M77 172 Q69 202 69 234 Q69 264 76 290 Q73 298 74 306 Q71 336 76 364 Q78 388 78 410 Q85 412 93 410 Q94 388 93 366 Q95 338 92 308 Q94 299 96 290 Q101 262 99 234 Q98 204 100 178 Z" />
        <Path d="M123 172 Q131 202 131 234 Q131 264 124 290 Q127 298 126 306 Q129 336 124 364 Q122 388 122 410 Q115 412 107 410 Q106 388 107 366 Q105 338 108 308 Q106 299 104 290 Q99 262 101 234 Q102 204 100 178 Z" />
      </G>
      {side === 'front' ? (
        <G>
          <Ellipse cx="56" cy="65" rx="15" ry="14" {...P('hombros')} />
          <Ellipse cx="144" cy="65" rx="15" ry="14" {...P('hombros')} />
          <Path d="M76 74 Q98 68 99 92 Q97 105 84 104 Q72 100 73 86 Z" {...P('pecho')} />
          <Path d="M124 74 Q102 68 101 92 Q103 105 116 104 Q128 100 127 86 Z" {...P('pecho')} />
          <Ellipse cx="48" cy="110" rx="8" ry="17" transform="rotate(6 48 110)" {...P('biceps')} />
          <Ellipse cx="152" cy="110" rx="8" ry="17" transform="rotate(-6 152 110)" {...P('biceps')} />
          <Ellipse cx="42" cy="162" rx="7" ry="21" transform="rotate(4 42 162)" {...P('antebrazos')} />
          <Ellipse cx="158" cy="162" rx="7" ry="21" transform="rotate(-4 158 162)" {...P('antebrazos')} />
          <Path d="M87 118 Q86 109 100 109 Q114 109 113 118 Q116 136 113 152 Q112 164 100 166 Q88 164 87 152 Q84 136 87 118 Z" {...P('abdomen')} />
          <G stroke={c.card} strokeWidth="1.4" opacity={0.35}>
            <Line x1="100" y1="112" x2="100" y2="162" />
            <Line x1="87" y1="126" x2="113" y2="126" />
            <Line x1="87" y1="140" x2="113" y2="140" />
          </G>
          <Path d="M78 114 Q84 116 84 160 Q77 156 74 138 Q74 124 78 114 Z" {...P('oblicuos')} />
          <Path d="M122 114 Q116 116 116 160 Q123 156 126 138 Q126 124 122 114 Z" {...P('oblicuos')} />
          <Path d="M74 184 Q68 210 70 230 Q71 260 77 284 Q85 289 92 284 Q97 260 98 230 Q99 208 96 182 Q85 178 74 184 Z" {...P('cuadriceps')} />
          <Path d="M126 184 Q132 210 130 230 Q129 260 123 284 Q115 289 108 284 Q103 260 102 230 Q101 208 104 182 Q115 178 126 184 Z" {...P('cuadriceps')} />
          <Ellipse cx="94" cy="216" rx="5" ry="28" {...P('aductores')} />
          <Ellipse cx="106" cy="216" rx="5" ry="28" {...P('aductores')} />
        </G>
      ) : (
        <G>
          <Path d="M100 48 Q128 54 128 66 Q122 84 114 96 Q100 88 86 96 Q78 84 72 66 Q72 54 100 48 Z" {...P('trapecio')} />
          <Ellipse cx="56" cy="65" rx="15" ry="14" {...P('hombros')} />
          <Ellipse cx="144" cy="65" rx="15" ry="14" {...P('hombros')} />
          <Path d="M72 94 Q100 90 128 94 Q126 110 121 124 Q100 148 79 124 Q74 110 72 94 Z" {...P('espalda')} />
          <Ellipse cx="48" cy="110" rx="8" ry="17" transform="rotate(6 48 110)" {...P('triceps')} />
          <Ellipse cx="152" cy="110" rx="8" ry="17" transform="rotate(-6 152 110)" {...P('triceps')} />
          <Ellipse cx="42" cy="162" rx="7" ry="21" transform="rotate(4 42 162)" {...P('antebrazos')} />
          <Ellipse cx="158" cy="162" rx="7" ry="21" transform="rotate(-4 158 162)" {...P('antebrazos')} />
          <Path d="M88 148 Q100 144 112 148 Q114 160 112 168 Q100 176 88 168 Q86 160 88 148 Z" {...P('lumbar')} />
          <Ellipse cx="86" cy="188" rx="15" ry="14" {...P('gluteos')} />
          <Ellipse cx="114" cy="188" rx="15" ry="14" {...P('gluteos')} />
          <Path d="M74 184 Q68 212 70 232 Q71 262 78 286 Q85 291 92 286 Q98 262 98 232 Q99 210 96 182 Q85 178 74 184 Z" {...P('isquios')} />
          <Path d="M126 184 Q132 212 130 232 Q129 262 122 286 Q115 291 108 286 Q102 262 102 232 Q101 210 104 182 Q115 178 126 184 Z" {...P('isquios')} />
          <Ellipse cx="83" cy="348" rx="10" ry="26" {...P('gemelos')} />
          <Ellipse cx="117" cy="348" rx="10" ry="26" {...P('gemelos')} />
        </G>
      )}
    </Svg>
  );
}
