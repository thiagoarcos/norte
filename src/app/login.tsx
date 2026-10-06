/* Bienvenida + inicio de sesión: Apple (iPhone), Google o email con código. */
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VamoLogo } from '@/components/VamoLogo';
import { Button, Field, Note } from '@/components/ui';
import { Radius, useColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { cloudEnabled } from '@/lib/supabase';

export default function Login() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [appleOk, setAppleOk] = useState(false);
  const [mode, setMode] = useState<'start' | 'email' | 'code' | 'local'>('start');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleOk).catch(() => {});
  }, []);

  const run = async (key: string, fn: () => Promise<void>) => {
    setErr(null);
    setBusy(key);
    try { await fn(); } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') setErr(e?.message || 'Algo salió mal. Probá de nuevo.');
    } finally { setBusy(null); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={{
          backgroundColor: c.primary, paddingTop: insets.top + 56, paddingBottom: 48, paddingHorizontal: 28,
          borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
        }}>
          <View style={{ alignSelf: 'flex-start', borderRadius: 17, marginBottom: 22, shadowColor: '#7A2500', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
            <VamoLogo size={72} />
          </View>
          <Text style={{ color: '#fff', fontSize: 52, fontWeight: '900', letterSpacing: -2 }}>Vamo</Text>
          <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 17, fontWeight: '600', marginTop: 6, lineHeight: 24 }}>
            Corré, entrená, comé y medí tu progreso.{'\n'}Todo en un solo lugar. ¡Vamo!
          </Text>
        </View>

        <View style={{ padding: 24, gap: 12, flex: 1 }}>
          {mode === 'start' && (
            <>
              {appleOk && cloudEnabled && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={c.scheme === 'dark' ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={Radius.md}
                  style={{ height: 52 }}
                  onPress={() => run('apple', auth.signInWithApple)}
                />
              )}
              <Button
                kind="dark" title="Continuar con Google" loading={busy === 'google'}
                icon={<Ionicons name="logo-google" size={18} color={c.bg} />}
                onPress={() => run('google', auth.signInWithGoogle)}
                disabled={!cloudEnabled}
              />
              <Button
                kind="soft" title="Continuar con email"
                icon={<Ionicons name="mail" size={18} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />}
                onPress={() => { setErr(null); setMode('email'); }}
                disabled={!cloudEnabled}
              />
              {!cloudEnabled && (
                <>
                  <Note tone="warn">
                    Las cuentas todavía no están conectadas (falta configurar Supabase). Mientras tanto podés probar la app: todo se guarda en este teléfono.
                  </Note>
                  <Button title="Probar sin cuenta" onPress={() => setMode('local')} />
                </>
              )}
            </>
          )}

          {mode === 'email' && (
            <>
              <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800' }}>Tu email</Text>
              <Text style={{ color: c.sub, fontSize: 14 }}>Te mandamos un mail para entrar. Sin contraseñas.</Text>
              <Field value={email} onChangeText={setEmail} placeholder="vos@gmail.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus />
              <Button title="Mandarme el mail" loading={busy === 'send'}
                onPress={() => run('send', async () => {
                  if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Revisá el email.');
                  await auth.sendEmailCode(email);
                  setMode('code');
                })} />
              <Button kind="ghost" title="Volver" onPress={() => setMode('start')} />
            </>
          )}

          {mode === 'code' && (
            <>
              <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800' }}>Revisá tu correo</Text>
              <Text style={{ color: c.sub, fontSize: 14 }}>Abrí el mail que mandamos a {email.trim()} y tocá el link para entrar. Abrilo en este mismo teléfono (o navegador). Si el mail trae un código de 6 dígitos, también podés escribirlo acá abajo.</Text>
              <Field value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} placeholder="123456"
                keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" autoFocus
                style={{ fontSize: 26, letterSpacing: 8, textAlign: 'center', fontWeight: '800' }} />
              <Button title="Entrar" loading={busy === 'verify'} disabled={code.length < 6}
                onPress={() => run('verify', () => auth.verifyEmailCode(email, code))} />
              <Button kind="ghost" title="Usar otro email" onPress={() => { setCode(''); setMode('email'); }} />
            </>
          )}

          {mode === 'local' && (
            <>
              <Text style={{ color: c.ink, fontSize: 20, fontWeight: '800' }}>¿Cómo te llamás?</Text>
              <Field value={name} onChangeText={setName} placeholder="Tu nombre" autoFocus />
              <Button title="Empezar" onPress={() => auth.continueLocal(name)} />
              <Button kind="ghost" title="Volver" onPress={() => setMode('start')} />
            </>
          )}

          {err ? <Note tone="warn">{err}</Note> : null}

          <View style={{ flex: 1 }} />
          <Text style={{ color: c.sub, fontSize: 12, textAlign: 'center', lineHeight: 17, paddingBottom: insets.bottom }}>
            Versión beta: gratis mientras dure la prueba.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
