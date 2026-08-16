import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: o build funciona ao abrir dist/index.html direto ou em subpasta.
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
