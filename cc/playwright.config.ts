import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

/**
 * Testes ponta a ponta em navegador de verdade.
 *
 * Rodam contra o **build de producao** servido pelo `vite preview`, e nao
 * contra o dev server: e o artefato que vai para o GitHub Pages, com o mesmo
 * empacotamento, a mesma minificacao de CSS e o mesmo `base: './'`.
 *
 * A suite do Vitest cobre logica, persistencia e o texto de `global.css`.
 * Estes testes cobrem o que so o navegador prova: as telas navegam de fato, o
 * progresso sobrevive a um reload real do localStorage, o layout cabe na
 * viewport e o design system chega **computado** no elemento — com as razoes
 * de contraste medidas sobre a cor que o navegador realmente pintou.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.resultados',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    // O jogo escolhe o idioma inicial pelo navegador. Sem fixar aqui, a suite
    // passaria na maquina de quem tem pt-BR no sistema e quebraria no CI, que
    // roda em en-US — os specs falam portugues.
    locale: 'pt-BR',
    // Rastro e video apenas do que falhar — o suficiente para depurar sem
    // encher o disco a cada execucao.
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      testMatch: /(desktop|design-system)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'celular',
      testMatch: /celular\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    // Build antes do preview: `dist/` e ignorado pelo git, entao um clone
    // limpo nao tem o que servir.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
