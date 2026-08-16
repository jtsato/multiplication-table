/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Necessario para o deploy em subcaminho do GitHub Pages (site/99).
  base: './',
  build: {
    target: 'es2020',
    // three + rapier geram bundles grandes por natureza; o aviso padrao de 500kB
    // so produziria ruido em todo build.
    chunkSizeWarningLimit: 1500,
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
