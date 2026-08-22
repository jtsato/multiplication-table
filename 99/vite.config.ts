/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'maskable-icon.svg'],
      manifest: {
        name: 'Numi 99 — A ilha da tabuada',
        short_name: 'Numi 99',
        description: 'Jogo 3D cozy de tabuada',
        theme_color: '#16202e',
        background_color: '#16202e',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'maskable-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
        navigateFallback: 'index.html',
        // O WASM do Rapier embutido passa de 2 MiB; sem subir o limite ele não
        // entraria no precache e o jogo não abriria offline.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  // Necessario para o deploy em subcaminho do GitHub Pages (site/99).
  base: './',
  // three costuma aparecer duas vezes quando ha dependencias que importam
  // versoes diferentes; dedupe garante que o bundle use uma instancia so.
  resolve: {
    dedupe: ['three'],
  },
  build: {
    target: 'es2020',
    // O WASM do Rapier e embutido como base64 no proprio JS (~2.2 MB); nao ha
    // como encolher sem trocar de mecanismo de fisica. O limite fica acima dele
    // para o build nao gritar a cada commit, e o `manualChunks` separa three/R3F
    // para o navegador cachear vendors que mudam pouco.
    chunkSizeWarningLimit: 2600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@dimforge')) return 'rapier';
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/@react-three')) return 'react-three';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    // A maior parte da suite testa funcoes puras (`*.logic.ts`) e slices do store,
    // que nao precisam de DOM. Arquivos de UI optam por jsdom via
    // `// @vitest-environment jsdom` no topo do arquivo.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
