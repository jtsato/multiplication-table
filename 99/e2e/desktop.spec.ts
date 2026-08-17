import { expect, test } from '@playwright/test';
import {
  esperarJogoPronto,
  esperarPainelCentralizado,
  ficarAoLadoDeUmRecurso,
  irParaOMeioDe,
  lerEstado,
  responderPeloEnunciado,
  soltarTudo,
} from './jogo';

/**
 * Partida completa no teclado, em navegador de verdade.
 *
 * Prova o que a suite do Vitest nao alcanca: WebGL inicializa, o WASM do Rapier
 * carrega no build de producao, a fisica move o jogador e o loop
 * matematica -> recurso -> construcao funciona ponta a ponta.
 */
test.describe('partida no computador', () => {
  test.beforeEach(async ({ page }) => {
    const errosDoConsole: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errosDoConsole.push(msg.text());
    });
    page.on('pageerror', (erro) => errosDoConsole.push(erro.message));
    // Guardado no contexto do teste para conferir ao final.
    (page as unknown as { _erros: string[] })._erros = errosDoConsole;

    await page.goto('/');
    await esperarJogoPronto(page);
  });

  test('carrega a ilha e mostra o HUD', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByText('Controles')).toBeVisible();
    await expect(page.getByRole('meter', { name: 'Vida' })).toBeVisible();

    const estado = await lerEstado(page);
    expect(estado.fase).toBe('dia');
    expect(estado.vida).toBe(100);
    expect(estado.inventario).toEqual({ madeira: 0, fruta: 0, pedra: 0 });

    await page.screenshot({ path: 'e2e/telas/01-inicio.png' });
  });

  test('o jogador anda de fato quando as teclas sao pressionadas', async ({ page }) => {
    const antes = await lerEstado(page);

    await page.keyboard.down('KeyW');
    await page.waitForTimeout(900);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(200);

    const depois = await lerEstado(page);
    const percorrido = Math.hypot(
      depois.jogador.x - antes.jogador.x,
      depois.jogador.z - antes.jogador.z,
    );

    // A 7 unidades/s, quase um segundo tem que render varios metros.
    expect(percorrido).toBeGreaterThan(2);
    await page.screenshot({ path: 'e2e/telas/02-andando.png' });
  });

  test('o jogador nao cai da ilha nem atravessa a borda', async ({ page }) => {
    // Corre para o norte por bastante tempo: a parede invisivel tem que segurar.
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(7000);
    await page.keyboard.up('KeyW');
    await soltarTudo(page);

    const estado = await lerEstado(page);
    const raio = Math.hypot(estado.jogador.x, estado.jogador.z);

    expect(raio).toBeLessThan(31);
    const altura = await page.evaluate(() => window.__tabuada!.transform.y);
    expect(altura).toBeGreaterThan(-1);

    await page.screenshot({ path: 'e2e/telas/03-borda-da-ilha.png' });
  });

  test('colher: aproximar, resolver a conta e receber o recurso', async ({ page }) => {
    await ficarAoLadoDeUmRecurso(page);

    const perto = await lerEstado(page);
    expect(perto.destacado).not.toBeNull();
    await expect(page.getByText('para colher')).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/04-recurso-destacado.png' });

    await page.keyboard.press('KeyE');
    await expect(page.locator('.challenge')).toBeVisible();
    await esperarPainelCentralizado(page);
    await page.screenshot({ path: 'e2e/telas/05-desafio.png' });

    const comDesafio = await lerEstado(page);
    expect(comDesafio.desafio).not.toBeNull();
    expect(comDesafio.desafio!.proposito).toBe('colher');
    // Toda a POC e tabuada do 2.
    expect(comDesafio.desafio!.prompt).toContain('com 2 ');

    const esperado = await responderPeloEnunciado(page, true);

    // O enunciado que a crianca le tem que bater com a conta interna.
    expect(esperado).toBe(comDesafio.desafio!.resposta);

    await expect(page.getByText('Isso!')).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/06-acertou.png' });

    const depois = await lerEstado(page);
    const total = depois.inventario.madeira + depois.inventario.fruta + depois.inventario.pedra;
    expect(total).toBe(esperado);
  });

  test('errar rende menos, revela a resposta e nao deixa de maos vazias', async ({ page }) => {
    await ficarAoLadoDeUmRecurso(page);
    await page.keyboard.press('KeyE');
    await expect(page.locator('.challenge')).toBeVisible();

    const comDesafio = await lerEstado(page);
    const certa = comDesafio.desafio!.resposta;

    await responderPeloEnunciado(page, false);

    await expect(page.getByText('Quase!')).toBeVisible();
    await expect(page.getByText(`A resposta era ${certa}`)).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/07-errou.png' });

    const depois = await lerEstado(page);
    const total = depois.inventario.madeira + depois.inventario.fruta + depois.inventario.pedra;
    expect(total).toBeGreaterThanOrEqual(1);
    expect(total).toBeLessThan(certa);
  });

  test('construir uma fogueira com o recurso colhido', async ({ page }) => {
    // Recurso suficiente sem precisar colher meia ilha; a colheita ja foi
    // provada nos testes acima.
    await page.evaluate(() => {
      window.__tabuada!.store.setState({ inventory: { madeira: 40, fruta: 10, pedra: 20 } });
    });

    await page.keyboard.press('KeyB');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/telas/08-modo-construcao.png' });

    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    const estado = await lerEstado(page);
    expect(estado.construcoes).toBe(1);
    // 8 madeira e 4 pedra debitados.
    expect(estado.inventario.madeira).toBe(32);
    expect(estado.inventario.pedra).toBe(16);

    await page.screenshot({ path: 'e2e/telas/09-fogueira.png' });
  });

  test('o entardecer avisa antes de a noite chegar', async ({ page }) => {
    await irParaOMeioDe(page, 'entardecer');

    const estado = await lerEstado(page);
    expect(estado.fase).toBe('entardecer');
    // Ainda nao ha perigo: o entardecer e o aviso, nao a ameaca.
    expect(estado.inimigos).toBe(0);
    await expect(page.getByText(/A noite está chegando/)).toBeVisible();

    await page.screenshot({ path: 'e2e/telas/09b-entardecer.png' });
  });

  test('a noite chega, os inimigos surgem e o amanhecer traz a vitoria', async ({ page }) => {
    // Adianta o relogio em vez de esperar o ciclo inteiro em tempo real.
    await irParaOMeioDe(page, 'noite');

    const noite = await lerEstado(page);
    expect(noite.fase).toBe('noite');
    expect(noite.inimigos).toBeGreaterThan(0);
    await page.screenshot({ path: 'e2e/telas/10-noite.png' });

    await irParaOMeioDe(page, 'amanhecer');

    const amanhecer = await lerEstado(page);
    expect(amanhecer.fase).toBe('amanhecer');
    expect(amanhecer.desfecho).toBe('venceu');

    await expect(page.getByText('Amanheceu!')).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/11-vitoria.png' });

    // Reiniciar sem recarregar a pagina devolve o jogo jogavel.
    await page.getByRole('button', { name: 'Jogar de novo' }).click();
    await page.waitForTimeout(400);

    const reiniciado = await lerEstado(page);
    expect(reiniciado.desfecho).toBe('jogando');
    expect(reiniciado.vida).toBe(100);
    expect(reiniciado.fase).toBe('dia');
    await page.screenshot({ path: 'e2e/telas/12-reiniciado.png' });
  });

  test('a cerca barra os monstros — eles nao passam por dentro', async ({ page }) => {
    // Cerca o jogador com um anel de cercas construidas de verdade.
    await page.evaluate(() => {
      const ponte = window.__tabuada!;
      ponte.store.setState({
        inventory: { madeira: 999, fruta: 999, pedra: 999 },
        structures: Array.from({ length: 12 }, (_, i) => {
          const angulo = (i / 12) * Math.PI * 2;
          const raio = 2.6;
          return {
            id: `cerca-${i}`,
            kind: 'cerca' as const,
            position: { x: Math.cos(angulo) * raio, y: 0, z: Math.sin(angulo) * raio },
            rotation: -angulo + Math.PI / 2,
            fuelUntil: 0,
          };
        }),
      });
    });

    await irParaOMeioDe(page, 'noite');
    expect((await lerEstado(page)).inimigos).toBeGreaterThan(0);

    // Tempo de sobra para atravessarem a ilha inteira, se conseguissem.
    await page.waitForTimeout(9000);
    await page.screenshot({ path: 'e2e/telas/13-cerca-segurando.png' });

    const depois = await lerEstado(page);
    // Nenhum monstro entrou no cercado, entao ninguem encostou.
    expect(depois.vida).toBe(100);
    expect(depois.desfecho).toBe('jogando');
  });

  test('nenhum erro no console durante a partida', async ({ page }) => {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1500);
    await soltarTudo(page);

    const erros = (page as unknown as { _erros: string[] })._erros;
    expect(erros).toEqual([]);
  });
});
