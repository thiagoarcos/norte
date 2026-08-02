import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// IMPORTANTE: el base tiene que ser "/<nombre-del-repo>/" (GitHub Pages sirve ahí).
// El repo es github.com/thiagoarcos/norte → base "/norte/". Si renombrás el repo, cambialo acá.
const BASE = "/norte/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      // push-sw.js (en public/) agrega los handlers de Web Push al SW generado.
      // cleanupOutdatedCaches + clientsClaim: cada deploy purga los cachés viejos y
      // toma control de la página al toque (evita pantallas en blanco por caché rancio).
      workbox: { importScripts: ["push-sw.js"], cleanupOutdatedCaches: true, clientsClaim: true },
      manifest: {
        name: "NORTE",
        short_name: "NORTE",
        description: "Disciplina: hábitos, gym, dieta y tu cronograma en un solo lugar",
        theme_color: "#2E5BFF",
        background_color: "#F7F8FA",
        display: "standalone",
        orientation: "portrait",
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
});
