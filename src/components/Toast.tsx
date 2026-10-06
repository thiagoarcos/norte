/* Banner de avisos (arriba de todo), como el de NORTE. */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/constants/theme';
import { closeFlash, useFlash } from '@/lib/toast';

export function Toast() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const f = useFlash();
  if (!f) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 10, left: 12, right: 12, zIndex: 100 }}>
      <Pressable onPress={closeFlash} style={{
        backgroundColor: c.ink, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12,
      }}>
        <Ionicons name="notifications" size={16} color={c.bg} />
        <Text style={{ flex: 1, color: c.bg, fontWeight: '700', fontSize: 14.5 }}>{f.text}</Text>
        <Ionicons name="close" size={16} color={c.bg} />
      </Pressable>
    </View>
  );
}
