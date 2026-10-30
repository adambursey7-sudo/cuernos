import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Horns (antes Cuernos): estilo Marcador con la paleta Parqué de inicio (elegido por Adam el 29/10).
// `npm run build:pages` (modo `pages`) compila para GitHub Pages, que sirve la app en /cuernos/.
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/cuernos/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // lo registra src/main.tsx, que busca versión nueva al volver a la app
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        name: 'Horns',
        short_name: 'Horns',
        description: 'Sistemas, ejercicios y sesiones para entrenadores de baloncesto.',
        categories: ['sports'],
        lang: 'es',
        theme_color: '#1e2a44',
        background_color: '#1e2a44',
        display: 'standalone',
        icons: [
          { src: 'icono.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
}));
