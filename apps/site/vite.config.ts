import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["brand-logo.svg"],
      manifest: {
        name: "ColorWalking",
        short_name: "ColorWalking",
        description: "????????????????",
        theme_color: "#1f2a44",
        background_color: "#f3f6fb",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/brand-logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ico}"],
        navigateFallback: "/index.html"
      }
    })
  ]
});
