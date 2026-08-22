import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
});
