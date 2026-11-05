import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base relativa: funciona em https://usuario.github.io/<repositorio>/ e em domínio próprio
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
      manifest: {
        name: 'Caderno de Erros | Tais Elena',
        short_name: 'Caderno de Erros',
        description: 'Uma ferramenta para transformar erros em acertos.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fbf5f9',
        theme_color: '#fbf5f9',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'StaleWhileRevalidate', options: { cacheName: 'fontes' } },
        ],
      },
    }),
  ],
});
