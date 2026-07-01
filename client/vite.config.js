import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "logo-5gspace.png"],
      manifest: {
        name: "5G Space Manager",
        short_name: "5G Space",
        description: "Gestion des réservations — 5G Space Bizerte",
        lang: "fr",
        theme_color: "#4f46e5",
        background_color: "#0b1220",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          // Never cache API responses — always hit the network (auth'd, dynamic data).
          { urlPattern: ({ url }) => url.pathname.startsWith("/api"), handler: "NetworkOnly" },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    host: true, // listen on 0.0.0.0 so phones on the same WiFi can reach it
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        headers: { origin: "http://localhost:5173" },
      },
    },
  },
});
