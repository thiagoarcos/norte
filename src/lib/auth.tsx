/* Sesión del usuario: Google, Apple o email (código de 6 dígitos, sin contraseña).
   Sin Supabase configurado → "modo local" (un usuario invitado guardado en el teléfono). */
import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const LOCAL_USER_KEY = 'norte-local-user';

export type User = { id: string; email: string | null; name: string | null; local: boolean };

type AuthCtx = {
  ready: boolean;
  user: User | null;
  sendEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  continueLocal: (name: string) => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const fromSession = (s: Session | null): User | null =>
  s
    ? {
        id: s.user.id,
        email: s.user.email ?? null,
        name: (s.user.user_metadata?.full_name as string) || (s.user.user_metadata?.name as string) || null,
        local: false,
      }
    : null;

export function AuthProvider({ children }: { children: ReactNode }) {
  // sin Supabase el usuario local se lee al toque (sin esperar a la red)
  const [ready, setReady] = useState(!supabase);
  const [user, setUser] = useState<User | null>(() => {
    if (supabase) return null;
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(fromSession(data.session));
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(fromSession(s)));
    return () => sub.subscription.unsubscribe();
  }, []);

  const need = () => {
    if (!supabase) throw new Error('Falta configurar Supabase (ver README). Mientras tanto usá "Probar sin cuenta".');
    return supabase;
  };

  const value: AuthCtx = {
    ready,
    user,
    async sendEmailCode(email) {
      // El mail trae un link "Ingresar" que vuelve a la app (vamo://auth?code=…) y además,
      // si algún día configuramos un SMTP propio con {{ .Token }}, un código de 6 dígitos.
      const { error } = await need().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: makeRedirectUri({ path: 'auth' }) },
      });
      if (error) throw error;
    },
    async verifyEmailCode(email, code) {
      const { error } = await need().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
      if (error) throw error;
    },
    async signInWithGoogle() {
      const sb = need();
      if (Platform.OS === 'web') {
        // En la web vamos a Google en la misma pestaña y volvemos a /auth?code=… (lo canjea
        // src/app/auth.tsx). La ventanita (popup) se quedaba en about:blank: Google le corta
        // la comunicación con la página que la abrió.
        const { error } = await sb.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        return;
      }
      const redirectTo = makeRedirectUri({ path: 'auth' });
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') return; // el usuario cerró la ventana
      const code = new URL(res.url).searchParams.get('code');
      if (!code) throw new Error('Google no devolvió un código de acceso.');
      const { error: e2 } = await sb.auth.exchangeCodeForSession(code);
      if (e2) throw e2;
    },
    async signInWithApple() {
      const sb = need();
      if (Platform.OS !== 'ios') throw new Error('Iniciar con Apple está disponible en iPhone.');
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) throw new Error('Apple no devolvió el token.');
      const { error } = await sb.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
      if (error) throw error;
      // Apple manda el nombre solo la primera vez: lo guardamos en el perfil
      const full = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
      if (full) await sb.auth.updateUser({ data: { full_name: full } });
    },
    continueLocal(name) {
      const u: User = { id: 'local', email: null, name: name.trim() || null, local: true };
      try { localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u)); } catch {}
      setUser(u);
    },
    async signOut() {
      if (user?.local || !supabase) {
        try { localStorage.removeItem(LOCAL_USER_KEY); } catch {}
        setUser(null);
        return;
      }
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fuera de AuthProvider');
  return c;
}
