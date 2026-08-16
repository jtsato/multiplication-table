import { expect, test } from '@playwright/test';
import { centroDe, esperarJogoPronto, ficarAoLadoDeUmRecurso, lerEstado, usarDedo } from './jogo';

/**
 * Partida no celular, com toque de verdade.
 *
 * O projeto `celular` do Playwright emula um Pixel 5: viewport pequeno,
 * `hasTouch` e `pointer: coarse`. Os eventos de toque sao emitidos pelo CDP, o
 * que faz o Chromium gerar os mesmos `pointerdown`/`pointermove` que um dedo
 * geraria — nao sao eventos sinteticos disparados por JavaScript.
 */
test.describe('partida no celular', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await esperarJogoPronto(page);
  });

  test('mostra os controles de toque e esconde as dicas de teclado', async ({ page }) => {
    await expect(page.locator('.touch__joystick')).toBeVisible();
    // Listar teclas que o aparelho nao tem so ocuparia a tela.
    await expect(page.getByText('WASD — andar')).toHaveCount(0);

    // O HUD essencial continua de pe.
    await expect(page.getByRole('meter', { name: 'Vida' })).toBeVisible();
    await expect(page.locator('.hud__panel--inventory')).toBeVisible();
    // A barra de receitas sai da tela pequena: o espaco do rodape e do joystick
    // e dos botoes, e as receitas ja aparecem nos proprios botoes.
    await expect(page.locator('.hud__recipes')).toBeHidden();

    await page.screenshot({ path: 'e2e/telas/celular-01-inicio.png' });
  });

  test('o joystick move o jogador na direcao empurrada', async ({ page }) => {
    const antes = await lerEstado(page);
    const centro = await centroDe(page, '.touch__joystick');
    const dedo = await usarDedo(page);

    // Empurra para cima: tem que andar para frente, ou seja, -Z.
    await dedo.encostar(centro);
    await dedo.arrastarAte({ x: centro.x, y: centro.y - 55 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: 'e2e/telas/celular-02-joystick.png' });
    await dedo.soltar();

    const depois = await lerEstado(page);
    expect(depois.jogador.z).toBeLessThan(antes.jogador.z - 2);
    expect(Math.abs(depois.jogador.x - antes.jogador.x)).toBeLessThan(1.5);
  });

  test('empurrar para o lado anda para o lado', async ({ page }) => {
    const antes = await lerEstado(page);
    const centro = await centroDe(page, '.touch__joystick');
    const dedo = await usarDedo(page);

    await dedo.encostar(centro);
    await dedo.arrastarAte({ x: centro.x + 55, y: centro.y });
    await page.waitForTimeout(900);
    await dedo.soltar();

    const depois = await lerEstado(page);
    expect(depois.jogador.x).toBeGreaterThan(antes.jogador.x + 2);
  });

  test('soltar o joystick faz o jogador parar', async ({ page }) => {
    const centro = await centroDe(page, '.touch__joystick');
    const dedo = await usarDedo(page);

    await dedo.encostar(centro);
    await dedo.arrastarAte({ x: centro.x, y: centro.y - 55 });
    await page.waitForTimeout(500);
    await dedo.soltar();
    await page.waitForTimeout(300);

    const parado = await lerEstado(page);
    await page.waitForTimeout(700);
    const aindaParado = await lerEstado(page);

    // Sem deriva: o personagem para na hora em que o dedo sai.
    expect(Math.abs(aindaParado.jogador.x - parado.jogador.x)).toBeLessThan(0.1);
    expect(Math.abs(aindaParado.jogador.z - parado.jogador.z)).toBeLessThan(0.1);
  });

  test('colher pelo toque: botao Colher, painel e resposta', async ({ page }) => {
    await ficarAoLadoDeUmRecurso(page);

    // O botao so aparece com algo ao alcance.
    const colher = page.getByRole('button', { name: /Colher/ });
    await expect(colher).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/celular-03-botao-colher.png' });

    await colher.tap();
    await expect(page.locator('.challenge')).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/celular-04-desafio.png' });

    const estado = await lerEstado(page);
    const resposta = estado.desafio!.resposta;

    await page.getByRole('button', { name: String(resposta), exact: true }).tap();
    await expect(page.getByText('Isso!')).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/celular-05-acertou.png' });

    const depois = await lerEstado(page);
    const total = depois.inventario.madeira + depois.inventario.fruta + depois.inventario.pedra;
    expect(total).toBe(resposta);
  });

  test('construir pelo toque', async ({ page }) => {
    await page.evaluate(() => {
      window.__tabuada!.store.setState({ inventory: { madeira: 40, fruta: 10, pedra: 20 } });
    });

    await page.getByRole('button', { name: /Fogueira/ }).tap();
    // No modo construcao os botoes trocam para confirmar e cancelar.
    const construir = page.getByRole('button', { name: 'Construir' });
    await expect(construir).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/celular-06-construindo.png' });

    await construir.tap();
    await page.waitForTimeout(400);

    const estado = await lerEstado(page);
    expect(estado.construcoes).toBe(1);
    await page.screenshot({ path: 'e2e/telas/celular-07-fogueira.png' });
  });

  test('o botao de construir fica desabilitado sem recurso', async ({ page }) => {
    const fogueira = page.getByRole('button', { name: /Fogueira/ });
    await expect(fogueira).toBeDisabled();
  });

  test('a tela de vitoria funciona no toque', async ({ page }) => {
    await page.evaluate(() => {
      window.__tabuada!.clock.seconds = 0.7 * 180;
    });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      window.__tabuada!.clock.seconds = 0.92 * 180;
    });
    await page.waitForTimeout(600);

    await expect(page.getByText('Amanheceu!')).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/celular-08-vitoria.png' });

    await page.getByRole('button', { name: 'Jogar de novo' }).tap();
    await page.waitForTimeout(400);
    expect((await lerEstado(page)).desfecho).toBe('jogando');
  });
});
