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

  test('a tabuada da ilha cabe inteira na tela do telefone', async ({ page }) => {
    await concluirOnboarding(page);
    await page.locator('button.island:not([disabled])').first().click();
    await expect(page.getByRole('heading', { name: 'Tabuada do 2' })).toBeVisible();

    const linhas = page.locator('.table-list__row');
    await expect(linhas).toHaveCount(10);

    // As dez linhas E o botao de jogar visiveis de uma vez: a crianca nao
    // precisa rolar para descobrir que da para pular o estudo.
    const ultima = await linhas.last().boundingBox();
    const jogar = await page.getByRole('button', { name: /Jogar a missão/ }).boundingBox();
    const altura = page.viewportSize()?.height ?? 0;
    expect(ultima).not.toBeNull();
    expect(jogar).not.toBeNull();
    expect(ultima!.y + ultima!.height).toBeLessThanOrEqual(jogar!.y);
    expect(jogar!.y + jogar!.height).toBeLessThanOrEqual(altura);
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

  /**
   * `scrollWidth` da pagina nao pega este caso: `body` tem `overflow-x: hidden`,
   * entao um rotulo largo demais e recortado em silencio em vez de criar barra
   * de rolagem. Foi assim que "Desligado" saiu da tela numa caixa de 3,2em que
   * so tinha sido medida com o "Off" do ingles. O texto vem da traducao, entao
   * a unica defesa e conferir a caixa de cada rotulo, e nao a da pagina.
   */
  test('nenhum rotulo das configuracoes e recortado pela propria caixa', async ({ page }) => {
    await concluirOnboarding(page);
    await irParaHome(page);
    await page.getByRole('button', { name: 'Configurações' }).click();
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();

    const recortados = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.settings *')]
        .filter((no) => {
          const temTextoProprio = [...no.childNodes].some(
            (filho) => filho.nodeType === Node.TEXT_NODE && filho.textContent?.trim(),
          );
          return (
            temTextoProprio &&
            no.clientWidth > 0 &&
            getComputedStyle(no).overflowX === 'visible' &&
            no.scrollWidth > no.clientWidth + 1
          );
        })
        .map((no) => ({
          texto: no.textContent?.trim().slice(0, 40),
          sobra: no.scrollWidth - no.clientWidth,
        })),
    );

    expect(recortados).toEqual([]);
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
