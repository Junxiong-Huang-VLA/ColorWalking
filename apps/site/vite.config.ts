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
      includeAssets: ["brand-icon.svg", "brand-lockup.svg", "brand-wordmark.svg"],
      manifest: {
        name: "\u5c0f\u7f8a\u5377 \u00b7 \u7f8a\u5377\u5c9b",
        short_name: "\u5c0f\u7f8a\u5377",
        description: "\u5c0f\u7f8a\u5377\u662f\u4f1a\u628a\u4eca\u65e5\u5e78\u8fd0\u8272\u9001\u5230\u4f60\u8eab\u8fb9\u7684\u6e29\u67d4\u966a\u4f34\u4f53\u3002",
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
