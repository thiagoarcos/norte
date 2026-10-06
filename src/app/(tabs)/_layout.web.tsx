/* Barra de pestañas para la versión web (Chrome): abajo, como en el teléfono.
   En iOS / Android se usa _layout.tsx (pestañas nativas). */
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useColors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type IconProps = { color: ColorValue; focused: boolean; size: number };

function TabIcon({ on, off, color, focused, size }: IconProps & { on: IconName; off: IconName }) {
  return <Ionicons name={focused ? on : off} size={size} color={color as string} />;
}
const icon = (on: IconName, off: IconName) => {
  const Icon = (p: IconProps) => <TabIcon on={on} off={off} {...p} />;
  Icon.displayName = `TabIcon(${on})`;
  return Icon;
};

export default function TabsLayoutWeb() {
  const c = useColors();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: c.primary,
      tabBarInactiveTintColor: c.sub,
      tabBarStyle: { backgroundColor: c.card, borderTopColor: c.line, height: 64, paddingTop: 6 },
      tabBarLabelStyle: { fontWeight: '700', fontSize: 11.5, marginBottom: 6 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Hoy', tabBarIcon: icon('sunny', 'sunny-outline') }} />
      <Tabs.Screen name="salud" options={{ title: 'Salud', tabBarIcon: icon('heart', 'heart-outline') }} />
      <Tabs.Screen name="plata" options={{ title: 'Plata', tabBarIcon: icon('wallet', 'wallet-outline') }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: icon('calendar', 'calendar-outline') }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: icon('ellipsis-horizontal-circle', 'ellipsis-horizontal-circle-outline') }} />
    </Tabs>
  );
}
