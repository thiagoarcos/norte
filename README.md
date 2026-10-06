# Vamo (app para Android y iPhone)

App de entrenamiento: **correr con GPS y mapa** (tipo Strava / adidas Running), **entreno** (series, saturación muscular, hipertrofia), **comida** (kcal estimadas por texto), **agua**, **ayuno**, **peso y % de grasa/músculo**. Hecha con Expo (React Native).

Cuentas con **Google, Apple o email** (código de 6 dígitos). Los datos se guardan primero en el teléfono (anda sin señal) y se sincronizan con la nube (Supabase).

## Probarla ya en tu teléfono (sin cuentas)

1. Instalá **Expo Go** en el teléfono (Play Store / App Store).
2. En la compu, desde esta carpeta: `npx expo start`
3. Escaneá el QR (Android: desde Expo Go; iPhone: con la cámara).
4. En la pantalla de inicio tocá **Probar sin cuenta**.

En Expo Go el GPS registra **solo con la app abierta** (la pantalla queda prendida). Con la build propia (paso 2) sigue grabando con el teléfono bloqueado.

## 1. Activar cuentas y nube (Supabase, gratis)

1. Creá un proyecto en https://supabase.com.
2. `npx supabase link --project-ref <ref>` y `npx supabase db push` (crea las tablas de `supabase/migrations/`).
3. **Project Settings → API**: copiá la URL y la *publishable key* a un archivo `.env.local` (usá `.env.example` de modelo).
4. **Authentication → URL Configuration → Redirect URLs**: agregá `vamo://auth` (y para pruebas en Expo Go la URL `exp://…/--/auth` que aparece en la terminal).
5. **Authentication → Providers**:
   - **Email**: activado por defecto. En *Email Templates → Magic Link* poné `{{ .Token }}` en el cuerpo para que llegue el código de 6 dígitos.
   - **Google**: creá credenciales OAuth en Google Cloud Console (tipo *Web*) y pegá Client ID y Secret en Supabase.
   - **Apple**: necesita la cuenta de Apple Developer (paso 2). Activalo con el bundle id `com.arcossz.vamo`.
6. Reiniciá `npx expo start`.

### Foto del plato (IA)

La estimación por foto usa Claude desde una función de Supabase (la API key nunca va dentro de la app):

```bash
npx supabase login
npx supabase link --project-ref <tu-proyecto>
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...     # de console.anthropic.com
npx supabase functions deploy estimate-food
```

Cada foto cuesta unos centavos de dólar de API: tenelo en cuenta para el precio de Vamo Pro.

### Amigos

Las tablas `profiles`, `follows`, `activities` y `kudos` ya están en `supabase/migrations/`. Cada usuario elige su @usuario la primera vez que entra a **Correr → Amigos**; sus salidas se ven solo para quienes lo siguen.

## 2. Build propia (GPS con pantalla bloqueada, Apple, tiendas)

Esto también activa **Apple Health / Health Connect** (pasos, pulso, guardar salidas), que no existen en Expo Go.

Necesitás una cuenta gratis de Expo: `npx eas-cli@latest login`.

```bash
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development --platform android   # APK para tu Android
npx eas-cli@latest build --profile development --platform ios       # requiere Apple Developer
```

Las builds se hacen en la nube de Expo: no hace falta Android Studio ni una Mac.

- **Android en Google Play**: cuenta de desarrollador (US$25, pago único).
- **iPhone en App Store**: Apple Developer Program (US$99/año). Obligatorio también para *Iniciar con Apple* y para TestFlight (la beta).
- **Mapa en Android**: creá una API key de *Maps SDK for Android* en Google Cloud y ponela en `GOOGLE_MAPS_API_KEY` antes de la build.

## 3. Beta → pago (US$10/mes)

Por ahora todo es gratis (beta). Para cobrar, Apple y Google exigen usar **su** sistema de suscripciones (In-App Purchase). El plan es usar **RevenueCat**, que maneja las dos tiendas y escribe el estado en la tabla `subscriptions` (ya creada).

## Comandos

```bash
npx expo start        # servidor de desarrollo (QR para Expo Go)
npm run typecheck     # chequeo de tipos
npx expo lint         # lint
npx expo-doctor       # diagnóstico de dependencias
```

## Estructura

```
src/app/            pantallas (Expo Router)
  login.tsx         inicio de sesión
  (tabs)/           Hoy · Correr · Entreno · Comida · Perfil
  run/live.tsx      salida en vivo (mapa + métricas)
  run/[id].tsx      detalle de una salida
src/lib/
  store.ts          datos (teléfono + sincronización con Supabase)
  runTracker.ts     GPS en segundo plano, parciales, desnivel
  fitness.js        lógica compartida con la PWA (kcal, plan de running, músculos, % grasa, ayuno)
  auth.tsx          Google / Apple / email
supabase/migrations/ base de datos (tablas + seguridad)
```
