/* Destino de los links de inicio de sesión (vamo://auth, o /auth en la web):
   - link del mail ("Ingresar"): trae ?code=… → lo canjeamos por la sesión.
   - Google: el código lo canjea src/lib/auth.tsx; acá solo volvemos al inicio. */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

import { useColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const c = useColors();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [done, setDone] = useState(!params.code);
  const [err, setErr] = useState<string | null>(params.error_description ?? null);

  useEffect(() => {
    if (!params.code || !supabase) return;
    // Web + Google: esta página se abrió en la ventanita del login; la ventana principal
    // canjea el código (WebBrowser.maybeCompleteAuthSession le pasa la URL y cierra esta).
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.opener) return;
    supabase.auth.exchangeCodeForSession(params.code)
      .then(({ error }) => { if (error) setErr('El link venció o ya se usó. Pedí uno nuevo desde la app.'); })
      .finally(() => setDone(true));
  }, [params.code]);

  if (err) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.bg }}>
        <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>{err}</Text>
      </View>
    );
  }
  if (!done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator color={c.primary} />
        <Text style={{ color: c.sub, marginTop: 10 }}>Entrando a Vamo…</Text>
      </View>
    );
  }
  return <Redirect href="/" />;
}
