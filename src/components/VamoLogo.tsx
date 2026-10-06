/* Logo de Vamo: la V (que también es un tilde de "hecho") sobre el degradé fuego. */
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export function VamoLogo({ size = 64, mark = false }: { size?: number; mark?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {!mark && (
        <>
          <Defs>
            <LinearGradient id="vamo-g" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FF5A1F" />
              <Stop offset="1" stopColor="#FFC23D" />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" rx="23" fill="url(#vamo-g)" />
        </>
      )}
      <Path d="M24 32 L45 74 L78 22" fill="none" stroke={mark ? '#FFFFFF' : '#1A0B00'} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
