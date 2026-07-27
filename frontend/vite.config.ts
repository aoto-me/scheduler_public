import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      includeAssets: ['favicon.ico', 'icon-192x192.png', 'icon-512x512.png', 'ogp.jpg'],
      manifest: {
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            sizes: '192x192',
            src: 'icon-192x192.png',
            type: 'image/png',
          },
          {
            sizes: '512x512',
            src: 'icon-512x512.png',
            type: 'image/png',
          },
        ],
        lang: 'ja',
        name: 'Scheduler',
        short_name: 'Scheduler',
        start_url: '/',
        theme_color: '#222222',
      },
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/backend/],
        skipWaiting: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/backend': {
        changeOrigin: true,
        target: 'http://localhost',
      },
    },
  },
});
