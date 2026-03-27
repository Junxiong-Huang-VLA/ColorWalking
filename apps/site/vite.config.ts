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
      includeAssets: ["brand-logo.svg", "app-icon.png"],
      manifest: {
        name: "ColorWalking",
        short_name: "ColorWalking",
        description: "每日幸运色与小羊卷陪伴，让今天多一点温柔与期待。",
        theme_color: "#1f2a44",
        background_color: "#f3f6fb",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/app-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/app-icon.png",
            sizes: "512x512",
            type: "image/png",
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
