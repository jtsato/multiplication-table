/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // jsdom 26+ so cria localStorage quando ha uma cota de armazenamento;
    // sem isto, testes com `// @vitest-environment jsdom` veem
    // `window.localStorage` como undefined.
    environmentOptions: {
      jsdom: {
        storageQuota: 10_000_000,
      },
    },
  },
});
