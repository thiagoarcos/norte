import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Deploy en Cloudflare Pages: sirve desde la raíz del dominio (norte.pages.dev o
// dominio propio), así que el base es "/". (Con GitHub Pages tenía que ser "/norte/".)
const BASE = "/";

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
