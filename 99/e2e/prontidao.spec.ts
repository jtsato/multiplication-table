import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  ficarAoLadoDeUmRecurso,
  esperarPainelCentralizado,
  irParaOMeioDe,
} from './jogo';

/** Aguarda o canvas do jogo (e o HUD) aparecerem. */
async function esperarJogoPronto(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible' });
  await page.getByTestId('hud-controls').waitFor({ state: 'visible' });
}

test('PWA: manifesto presente e service worker pronto', async ({ page }) => {
  await page.goto('/');

  const manifesto = page.locator('link[rel="manifest"]');
  await expect(manifesto).toHaveCount(1);
  const href = await manifesto.getAttribute('href');
  expect(href).toBeTruthy();

  const registrado = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registro = await navigator.serviceWorker.ready;
    return registro.active !== null;
  });
  expect(registrado).toBe(true);
});

test('sem violações críticas de acessibilidade na tela inicial', async ({ page }) => {
  await esperarJogoPronto(page);

  const resultados = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
    .analyze();

  const criticas = resultados.violations.filter((violacao) => violacao.impact === 'critical');
  expect(criticas).toEqual([]);

  await page.screenshot({ path: 'e2e/telas/prontidao-inicial.png' });
});

test('movimento reduzido desliga a animação de aviso no HUD', async ({ page }) => {
  await esperarJogoPronto(page);
  await irParaOMeioDe(page, 'entardecer');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const aviso = page.locator('.hud__prompt--aviso');
  await expect(aviso).toBeVisible();

  const animacao = await aviso.evaluate((elemento) => {
    const estilo = getComputedStyle(elemento);
    return estilo.animationName;
  });
  expect(animacao).toBe('none');
});

test('painel de desafio aberto não tem violações críticas', async ({ page }) => {
  await esperarJogoPronto(page);
  await page.waitForFunction(() => typeof window.__tabuada?.teleportar === 'function');
  await ficarAoLadoDeUmRecurso(page);
  await page.keyboard.press('KeyE');
  await esperarPainelCentralizado(page);

  const resultados = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
    .analyze();

  const criticas = resultados.violations.filter((violacao) => violacao.impact === 'critical');
  expect(criticas).toEqual([]);
});
