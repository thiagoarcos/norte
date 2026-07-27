---
name: verify
description: How to run and drive NEXO FIT end-to-end to verify UI changes.
---

# Verifying NEXO FIT changes

Surface: browser GUI (mobile PWA). Drive it headless with Playwright.

## Recipe that works

1. `npm run dev` in background → serves at `http://localhost:5173/nexofit/` (note the base path — the root URL 404s).
2. No Playwright in the repo. Install `playwright-core` in the session scratchpad (`npm i playwright-core`) and launch the cached browser directly:
   - executablePath: `C:\Users\arcossz\AppData\Local\ms-playwright\chromium-1228\chrome-win64\chrome.exe` (check `ms-playwright` dir for current version).
3. Use viewport `{ width: 390, height: 844 }` (iPhone-ish — the app is mobile-only).
4. Fresh context = fresh localStorage = no PIN gate, default state. All state is localStorage (`nexofit-state-v4`), so `page.reload()` tests persistence and a new context tests first-run.
5. Saves are debounced 500 ms — wait ~600 ms after an action before reloading.
6. `confirm()` dialogs are native — register `page.on("dialog", d => d.accept())`.
7. Tab navigation: bottom nav buttons by role/name ("Hoy", "Dieta", "Más"...). Checkboxes are `button[aria-label="Marcar"|"Desmarcar"]`.
8. Collect `console`/`pageerror` events — the app should produce zero console errors.

## Worker de push (worker/)

- `cd worker; npx wrangler dev --port 8787` corre local sin login (secretos desde `.dev.vars`).
- Para verificar el envío de push sin un teléfono: `scratchpad/push-sink.mjs` (sesiones anteriores) hace de push service — genera claves de suscripción falsas apuntando a `http://127.0.0.1:9099/push` y descifra aes128gcm como lo haría el navegador.
- Round-trip de cifrado puro: `crypto-roundtrip.mjs` (Node ≥20 tiene WebCrypto global; NO asignar `globalThis.crypto`).
- Para probar la integración app↔worker en headless: inyectar `localStorage nexofit-state-v4` con `{push:{url:"http://127.0.0.1:8787",token:...,enabled:true}}` vía addInitScript (no se puede suscribir push real en headless).
- El widget del temporizador (chips 60s/90s/120s) vive en la pestaña **Hoy**, flotante sobre la nav.
- `page.clock.install()` + `fastForward()` simula bien el congelamiento de iOS en segundo plano.

## Gotchas

- `npm run lint` has 13 pre-existing problems (4 `no-empty` errors in `catch (e) {}` blocks). Don't count those against a change; diff lint output against a stash of HEAD.
- Reminder/nag banners fire based on real wall-clock time, so screenshots may include a banner depending on time of day.
