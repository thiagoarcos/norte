# NORTE

App de hábitos, gimnasio, dieta y agenda, con integración por voz con NEXO (asistente personal). PWA lista para instalar en iPhone.

## 🔒 Protección con PIN

La app arranca con una pantalla de bloqueo de 4 dígitos:

- **Primera vez que la abrís**: viene con un PIN por defecto (4444) ya cargado. Cambialo en Más → Seguridad.
- **Cada sesión nueva**: te pide el PIN para entrar (o Face ID/huella si lo activaste). Una vez desbloqueada, queda así hasta que cierres la pestaña o mates la PWA.
- **Si olvidás el PIN**: después de 3 intentos fallidos aparece un botón para restablecer la app (borra todos los datos y arranca de cero).

El PIN se guarda **hasheado con SHA-256** en el `localStorage` de tu iPhone (no en texto plano).

## Nota sobre privacidad

- El repo (`github.com/thiagoarcos/norte`) es **público**: cualquiera puede ver el código, incluida la URL y el token del relay de push bakeados en `src/App.jsx`. Rotalos (ver más abajo) si alguna vez se filtran o parecen comprometidos.
- La app publicada también es de acceso público por link: cualquiera con la URL puede abrirla. Tus datos personales NO viajan ahí — se guardan en el `localStorage` de tu iPhone. Otra persona que entrara vería la app vacía, como recién instalada, y no podría pasar del PIN sin conocerlo.

## Requisitos

- **Node.js 18+**: https://nodejs.org (elegí LTS).
- **Git** y una **cuenta de GitHub** (el repo ya existe: `thiagoarcos/norte`).
- **Cuenta de Cloudflare** (gratis) con `wrangler` autenticado (`npx wrangler login`, una sola vez).

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí `http://localhost:5173/` y verificá que anda. Ctrl+C para cerrar.

## Deploy de NORTE (la app)

Se deploya como **Cloudflare Worker de assets estáticos** (no GitHub Pages) — ver `wrangler.jsonc` en la raíz. Cloudflare Workers Builds está conectado al repo de GitHub: cada `git push` a `main` dispara automáticamente:

1. `npx vite build` → genera `./dist`
2. `npx wrangler deploy` → sube `./dist`

```bash
git add .
git commit -m "descripción del cambio"
git push
```

En 1–2 minutos queda publicada en **`https://norte.arcossz.workers.dev`**. En tu iPhone se actualiza sola la próxima vez que abrís la app (el Service Worker purga cachés viejos en cada deploy).

Si alguna vez hace falta deployar a mano sin esperar el push (por ejemplo para probar algo puntual): `npx vite build && npx wrangler deploy` desde la raíz del repo.

## Deploy del relay de notificaciones/chat (`worker/`)

Es un **worker aparte** (`nexofit-push`) que maneja los recordatorios push y el puente de chat con NEXO. No se deploya solo con el `git push` de arriba — hay que hacerlo a mano desde `worker/`:

```bash
cd worker
npx wrangler login       # una sola vez
npx wrangler deploy
npx wrangler secret put VAPID_PRIVATE_KEY   # solo si cambiaron las claves
npx wrangler secret put AUTH_TOKEN          # solo si rotaste el token
```

Detalle completo en `worker/README.md`.

### Rotar el token del relay

El token vive en dos lugares que tienen que coincidir:

1. `src/App.jsx` → constante `RELAY_TOKEN` (se re-deploya con el `git push` normal).
2. El secreto `AUTH_TOKEN` del worker (`npx wrangler secret put AUTH_TOKEN` desde `worker/`).

Si ya tenés la app instalada en el iPhone con push/chat configurados a mano (Más → Notificaciones), **ese token queda guardado en el `localStorage` del teléfono y no se actualiza solo** — hay que volver a pegarlo ahí después de rotar.

## Instalar en tu iPhone

1. Abrí `https://norte.arcossz.workers.dev` en **Safari** (obligatorio, no Chrome).
2. Botón **Compartir** (cuadradito con flecha para arriba).
3. Bajá y tocá **Agregar a inicio**.
4. Nombre "NORTE" → **Agregar**.

Aparece el ícono verde en tu home. Se abre en pantalla completa, sin barra de Safari.

## Hablarle a NORTE (voz + NEXO)

En la pestaña del chat con NEXO (orbe flotante):

- **🎤 Mic**: dicta el mensaje (Web Speech API donde el navegador la soporte; si no, enfoca el input para usar el 🎤 del teclado de iOS).
- **🔊/🔇**: prende o apaga que NORTE lea en voz alta las respuestas de NEXO. Tocando cualquier respuesta la vuelve a leer.
- Si NEXO (`nexo_bridge.py` en tu PC) está apagado, el mensaje **no se pierde**: queda guardado en el relay y se entrega apenas se reconecta. Si la respuesta llega mientras no estás mirando el chat, aparece sola (y se lee) la próxima vez que lo abrís, y además llega como notificación push nativa.

## Problemas comunes

**"La app se ve toda blanca / no carga"**
- Mirá la pestaña **Deployments** del Worker en el dashboard de Cloudflare — ahí está el log del build que corrió con el último push.

**"Instalé la PWA pero no se actualiza"**
- En Safari: Ajustes → Safari → Borrar historial y datos. Volvé a abrir el link e instalar.

**"Los recordatorios no me llegan si la app está cerrada"**
- Limitación de iOS con PWAs. Cargalos también en la app Recordatorios de tu iPhone.

**"NEXO no me contesta"**
- Revisá que `nexo_bridge.py` esté corriendo en tu PC. El mensaje queda encolado igual — en cuanto lo prendas, te llega la respuesta (por chat y por push).

## Estructura

```
norte/
├── package.json
├── vite.config.js        base "/" (Cloudflare Workers, dominio propio)
├── wrangler.jsonc         deploy de NORTE (assets estáticos, ./dist)
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx            toda la app (una sola pantalla, sin rutas)
│   └── defaultProgram.js  rutina de gym por defecto
├── public/                íconos, service worker push
└── worker/                relay aparte: push nativo + puente de chat con NEXO
    ├── src/index.js       endpoints (schedule, chat/*, agenda/*, cmd/*)
    ├── src/webpush.js     Web Push (RFC 8291/8292) hecho a mano
    └── README.md          deploy y funcionamiento del relay
```
