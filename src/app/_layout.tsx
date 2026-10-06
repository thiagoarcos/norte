import '@/lib/runTracker'; // registra la tarea de GPS en segundo plano (tiene que cargarse al inicio)

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppEffects } from '@/components/AppEffects';
import { NexoOrb } from '@/components/Nexo';
import { Toast } from '@/components/Toast';
import { useColors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { initStore, resetStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { ready, user } = useAuth();
  const c = useColors();

  useEffect(() => {
    if (user) initStore(user.id, !user.local);
    else resetStore();
  }, [user]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={c.scheme === 'dark' ? 'light' : 'dark'} />
      {user ? <AppEffects /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="run/live" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen
            name="run/[id]"
            options={{ headerShown: true, title: 'Salida', headerBackTitle: 'Volver', headerTintColor: c.primary, headerStyle: { backgroundColor: c.bg }, headerTitleStyle: { color: c.ink }, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="social"
            options={{ headerShown: true, title: 'Amigos', headerBackTitle: 'Volver', headerTintColor: c.primary, headerStyle: { backgroundColor: c.bg }, headerTitleStyle: { color: c.ink }, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="habitos"
            options={{ headerShown: true, title: 'Hábitos', headerBackTitle: 'Volver', headerTintColor: c.primary, headerStyle: { backgroundColor: c.bg }, headerTitleStyle: { color: c.ink }, headerShadowVisible: false }}
          />
        </Stack.Protected>
        <Stack.Screen name="auth" />
      </Stack>
      {user ? <NexoOrb /> : null}
      <Toast />
    </>
  );
}

export default function RootLayout() {
  const c = useColors();
  const base = c.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...base, colors: { ...base.colors, background: c.bg, primary: c.primary, card: c.card, text: c.ink } }}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}
