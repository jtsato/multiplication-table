import { expect, test } from '@playwright/test';
import { concluirOnboarding, entrarNaPrimeiraIlha, irParaHome, responderCerto } from './jogo';

/**
 * A mesma partida em um Pixel 5, no toque.
 *
 * O jogo e feito para a mao de uma crianca: aqui vale conferir que nada
 * transborda na horizontal e que os alvos respeitam o minimo de 24 CSS px do
 * criterio 2.5.8 — na pratica o jogo usa 48 px.
 */
test.describe('partida no celular', () => {
  test('o onboarding e o mapa cabem na tela estreita', async ({ page }) => {
    await concluirOnboarding(page);

    const transbordou = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(transbordou).toBe(false);
  });

  test('a missao funciona no toque', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    await expect(page.getByText('Blocos colocados: 0 de 5')).toBeVisible();
    await responderCerto(page);
    await expect(page.getByText('Blocos colocados: 1 de 5')).toBeVisible();

    const transbordou = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(transbordou).toBe(false);
  });

  test('os alvos de toque tem pelo menos 24 px', async ({ page }) => {
    await concluirOnboarding(page);
    await irParaHome(page);

    const alvos = page.locator('button:visible');
    const total = await alvos.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const caixa = await alvos.nth(i).boundingBox();
      if (!caixa) continue;
      const nome = (await alvos.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      expect(Math.min(caixa.width, caixa.height), `alvo "${nome}"`).toBeGreaterThanOrEqual(24);
    }
  });
});
