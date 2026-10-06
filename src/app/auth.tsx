/* Destino de los links de inicio de sesión (vamo://auth, o /auth en la web):
   - link del mail ("Ingresar"): trae ?code=… → lo canjeamos por la sesión.
   - Google: en la web vuelve acá con ?code=… (misma pestaña); en el teléfono lo canjea src/lib/auth.tsx. */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const c = useColors();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [done, setDone] = useState(!params.code);
  const [err, setErr] = useState<string | null>(params.error_description ?? null);

  useEffect(() => {
    if (!params.code || !supabase) return;
    supabase.auth.exchangeCodeForSession(params.code)
      .then(({ error }) => {
        if (!error) return;
        // Web: si la sesión ya se abrió sola con este código, no es un error
        supabase!.auth.getSession().then(({ data }) => {
          if (!data.session) setErr('No se pudo iniciar sesión (el link venció o ya se usó). Probá de nuevo desde la app.');
        });
      })
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
