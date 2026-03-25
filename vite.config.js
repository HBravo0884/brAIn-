import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  cacheDir: '/sessions/keen-hopeful-clarke/.vite-cache',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brain-icon.png'],
      manifest: {
        name: 'brAIn',
        short_name: 'brAIn',
        description: 'brAIn — RWJF Grant Program Manager at Howard University College of Medicine',
        theme_color: '#5b8a8a',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'brain-icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'brain-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB — covers the art assets
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
