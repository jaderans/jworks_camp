import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' keeps every asset path relative, so the same build works on
// GitHub Pages (a sub-folder), Cloudflare Pages, or any static host.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png'],
      manifest: {
        id: './',
        name: 'JoshWorks Campaigns',
        short_name: 'JW Campaigns',
        description: 'Content calendar, campaigns, trends, results and SMM client tools for JoshWorks.',
        lang: 'en-PH',
        theme_color: '#161312',
        background_color: '#161312',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,ttf,webp}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // The weekly trend report is fetched fresh when online and served from cache offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/trends/latest.json'),
            handler: 'NetworkFirst',
            options: { cacheName: 'trend-feed', networkTimeoutSeconds: 6 },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 3000,
  },
  server: { host: true },
  preview: { host: true },
});
