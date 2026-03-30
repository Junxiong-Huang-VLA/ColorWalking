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
      includeAssets: ["brand-icon.svg", "brand-lockup.svg", "brand-wordmark.svg", "app-icon.png"],
      manifest: {
        name: "LambRoll Isle",
        short_name: "LambRoll",
        description: "每日幸运色与小羊卷陪伴，让今天多一点温柔与期待。",
        theme_color: "#1F3A58",
        background_color: "#E5EDF5",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/brand-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/brand-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable"
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
