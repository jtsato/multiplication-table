import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Testes ponta a ponta em navegador de verdade.
 *
 * Rodam contra o **build de producao** servido pelo `vite preview`, e nao contra
 * o dev server: e o artefato que vai para o GitHub Pages, com o mesmo
 * empacotamento e a mesma divisao de chunks.
 *
 * A suite do Vitest cobre logica e montagem de cena; estes testes cobrem o que
 * so o navegador prova — WebGL inicializa, o WASM do Rapier carrega, o jogador
 * anda de fato e o loop de matematica funciona ponta a ponta.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.resultados',
  // Um worker: cada teste sobe um contexto WebGL, e varios em paralelo brigam
  // pela GPU virtual e produzem falhas intermitentes.
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    // Rastro e video apenas do que falhar — o suficiente para depurar sem
    // encher o disco a cada execucao.
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      testMatch: /desktop\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        launchOptions: {
          args: [
            // Sem GPU real no CI: o SwiftShader entrega WebGL por software.
            // Sem isto o canvas simplesmente nao inicializa e o teste falha por
            // um motivo que nao tem nada a ver com o jogo.
            '--use-gl=swiftshader',
            '--enable-unsafe-swiftshader',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
    {
      name: 'celular',
      testMatch: /celular\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
        },
      },
    },
  ],

  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
