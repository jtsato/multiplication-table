/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
