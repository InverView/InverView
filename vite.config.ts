import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import http from "node:http"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: {
        name: "InverView",
        short_name: "InverView",
        description: "InverView",
        theme_color: "#2A8CFF",
        background_color: "#111827",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        launch_handler: {
          client_mode: "focus-existing",
        },
        protocol_handlers: [
          {
            protocol: "web+inverview",
            url: "/open?url=%s",
          },
        ],
        share_target: {
          action: "/share-target",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ico,woff2}"],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["youtube.tsub4sa.xyz"],
    proxy: {
      "/tv-sync": {
        target: "http://127.0.0.1:8282",
        changeOrigin: true,
      },
      "/api-proxy": {
        target: "http://127.0.0.1:8282",
        changeOrigin: true,
      },
      "/youtubejs-proxy": {
        target: "http://127.0.0.1:8282",
        changeOrigin: true,
        agent: new http.Agent({ keepAlive: false }),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
})
