import { expect, test } from '@playwright/test';
import { createSwarms, swarmSeed } from '../src/slices/lantern/fireflies.logic';
import { createRng } from '../src/shared/rng';
import { DEFAULT_WORLD_SEED } from '../src/slices/world/world.store';
import { REGIONS } from '../src/slices/regions/regions.logic';
import { whaleMidWindow } from '../src/slices/wildlife/whale.logic';
import { merchantPosition, npcPosition, teacherPosition } from '../src/slices/npc/npc.logic';
import { gardenPosition } from '../src/slices/garden/garden.logic';
import {
  esperarJogoPronto,
  esperarPainelCentralizado,
  ficarAoLadoDeUmRecurso,
  irParaOMeioDe,
  irParaOMovel,
  lerEstado,
  responderPeloEnunciado,
  soltarTudo,
  totalColhido,
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
    await expect(page.getByTestId('hud-controls')).toBeVisible();
    await expect(page.getByRole('meter', { name: 'Lanterna' })).toBeVisible();

    const estado = await lerEstado(page);
    expect(estado.fase).toBe('dia');
    // A lanterna comeca apagada: acende-la e o gesto que ensina a mecanica.
    expect(estado.cargaLanterna).toBe(0);
    expect(totalColhido(estado)).toBe(0);

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
    // Perto do spawn a crianca esta na Praia, que e a regiao da tabuada do 2.
    expect(comDesafio.desafio!.porGrupo).toBe(2);

    const esperado = await responderPeloEnunciado(page, true);

    // O enunciado que a crianca le tem que bater com a conta interna.
    expect(esperado).toBe(comDesafio.desafio!.resposta);

    await expect(page.getByText('Isso!')).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/06-acertou.png' });

    const depois = await lerEstado(page);
    const total = totalColhido(depois);
    expect(total).toBe(esperado);
    // O acerto tambem paga moeda: o recurso e o resultado da conta, a moeda e o
    // premio por ter acertado.
    expect(depois.moedas).toBeGreaterThan(0);
  });

  test('o loop economico completo: acertar, abrir a loja e comprar', async ({ page }) => {
    // Moedas e recursos suficientes sem colher meia ilha; a colheita ja tem
    // teste proprio logo acima, inclusive provando que ela paga moeda.
    await page.evaluate(() => {
      window.__tabuada!.store.setState({
        coins: 120,
        inventory: {
          ...window.__tabuada!.store.getState().inventory,
          concha: 40,
          fruta: 20,
          pedra: 20,
        },
      });
    });

    await page.keyboard.press('KeyL');
    await expect(page.getByRole('dialog', { name: 'Loja' })).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/13-loja.png' });

    const antes = await lerEstado(page);
    expect(antes.lojaAberta).toBe(true);

    await page.getByRole('button', { name: /Lanterna maior/ }).click();

    const depois = await lerEstado(page);
    expect(depois.comprados).toContain('lanterna-maior');
    expect(depois.moedas).toBeLessThan(antes.moedas);
    // A lanterna maior custa conchas: a madeira saiu do jogo e a concha ocupou
    // o lugar dela nas receitas.
    expect(depois.inventario.concha).toBeLessThan(antes.inventario.concha);

    // O item comprado nao pode ser comprado de novo.
    await expect(page.getByRole('button', { name: /Lanterna maior/ })).toBeDisabled();
    await page.screenshot({ path: 'e2e/telas/14-loja-comprada.png' });

    await page.getByRole('button', { name: 'Fechar' }).click();
    expect((await lerEstado(page)).lojaAberta).toBe(false);
  });

  test('a decoracao comprada aparece na casa e sobrevive a recarregar', async ({ page }) => {
    // Moedas e gelo suficientes para a escultura, sem depender de colher a ilha;
    // o caminho completo de compra (debita moedas e recursos) já tem teste acima.
    await page.evaluate(() => {
      window.__tabuada!.store.setState({
        coins: 120,
        inventory: {
          ...window.__tabuada!.store.getState().inventory,
          gelo: 20,
        },
      });
    });

    await page.keyboard.press('KeyL');
    await expect(page.getByRole('dialog', { name: 'Loja' })).toBeVisible();
    await page.getByRole('button', { name: /Escultura de gelo/ }).click();
    await page.waitForTimeout(300);
    expect((await lerEstado(page)).comprados).toContain('escultura');
    await page.getByRole('button', { name: 'Fechar' }).click();

    // Dentro da casa, a escultura fica na parede do fundo — visível na captura.
    await irParaOMovel(page, 'mural');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/telas/27-casa-decorada.png' });

    // O save grava com atraso; espera passar do debounce antes de recarregar.
    await page.waitForTimeout(1200);
    await page.reload();
    await esperarJogoPronto(page);
    await irParaOMovel(page, 'mural');
    expect((await lerEstado(page)).comprados).toContain('escultura');
    await page.screenshot({ path: 'e2e/telas/28-casa-decorada-recarregada.png' });
  });

  test('o pet segue o jogador', async ({ page }) => {
    // Amizade e pet montados direto: o caminho de alimentar tem teste de unidade
    // e o painel da caderneta tem teste proprio logo abaixo.
    await page.evaluate(() => {
      window.__tabuada!.store.setState({
        pet: 'cachorro',
        animalBook: [{ kind: 'cachorro', seen: true, friend: true }],
      });
    });

    await page.waitForTimeout(2500);

    const distancia = await page.evaluate(() => {
      const ponte = window.__tabuada!;
      return Math.hypot(ponte.pet.x - ponte.transform.x, ponte.pet.z - ponte.transform.z);
    });
    // O pet caminha atras do jogador; alguns metros de folga cobrem o tempo de
    // convergencia em WebGL por software.
    expect(distancia).toBeLessThan(4);
    await page.screenshot({ path: 'e2e/telas/29-pet.png' });
  });

  test('a caderneta mostra o amigo e escolhe o pet', async ({ page }) => {
    await page.evaluate(() => {
      window.__tabuada!.store.setState({
        animalBook: [{ kind: 'cachorro', seen: true, friend: true }],
      });
    });

    await irParaOMovel(page, 'caderneta');
    await page.keyboard.press('KeyE');

    const caderneta = page.getByRole('dialog', { name: 'Caderneta dos animais' });
    await expect(caderneta).toBeVisible();
    await expect(caderneta).toContainText('Cachorro');
    await page.screenshot({ path: 'e2e/telas/30-caderneta.png' });

    await page.getByRole('button', { name: /Levar comigo Cachorro/ }).click();
    expect((await lerEstado(page)).pet).toBe('cachorro');

    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(caderneta).toHaveCount(0);
  });

  test('a baleia sobe no mar do Porto no meio da janela', async ({ page }) => {
    // A janela da baleia e independente do dia/noite: um acontecimento para
    // olhar, nao uma mecanica de progresso.
    await page.evaluate((segundos) => {
      window.__tabuada!.clock.seconds = segundos;
      // Vira a camera para o leste, onde a baleia aparece no mar aberto.
      window.__tabuada!.transform.yaw = -Math.PI / 2;
    }, whaleMidWindow());
    await page.evaluate(() => window.__tabuada!.teleportar?.(42, 0));

    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/telas/31-baleia.png' });

    // Acontecimento nao mexe no estado: sem moeda, sem desafio.
    const estado = await lerEstado(page);
    expect(estado.moedas).toBe(0);
    expect(estado.desafio).toBeNull();
  });

  test('entregar uma encomenda debita recurso e paga moedas', async ({ page }) => {
    const pedido = await page.evaluate(() => {
      const ponte = window.__tabuada!;
      const order = ponte.store.getState().orders.find((o) => o.regionId === 'praia')!;
      const quantidade = order.groups * order.perGroup;
      ponte.store.setState({
        inventory: { ...ponte.store.getState().inventory, [order.kind]: quantidade + 5 },
      });
      return { kind: order.kind, quantidade };
    });

    const pos = npcPosition('praia');
    await page.evaluate(({ x, z }) => window.__tabuada!.teleportar?.(x, z), { x: pos.x, z: pos.z });
    await page.waitForTimeout(700);

    await page.keyboard.press('KeyE');
    await expect(page.locator('.challenge')).toBeVisible();
    await responderPeloEnunciado(page, true);
    await page.waitForTimeout(400);

    const depois = await lerEstado(page);
    expect(depois.inventario[pedido.kind]).toBe(5);
    expect(depois.moedas).toBeGreaterThan(0);
    await page.screenshot({ path: 'e2e/telas/32-encomenda.png' });
  });

  test('a horta do Pomar planta e colhe no dia seguinte', async ({ page }) => {
    await page.evaluate(() => {
      window.__tabuada!.store.setState((atual) => ({
        seeds: 1,
        clock: { ...atual.clock, day: 1 },
        animals: [],
        nodes: [],
      }));
    });
    const pos = gardenPosition();
    await page.evaluate(({ x, z }) => window.__tabuada!.teleportar?.(x, z), {
      x: pos.x,
      z: pos.z,
    });
    await page.waitForTimeout(700);

    await page.keyboard.press('KeyE');
    expect(
      await page.evaluate(() => window.__tabuada!.store.getState().garden[0]?.planted),
    ).toBe(true);
    await page.screenshot({ path: 'e2e/telas/35-horta-plantada.png' });

    // No dia seguinte a horta esta pronta; colher entrega frutas de graca.
    // O dia e derivado do relogio vivo, entao avancamos os segundos de verdade.
    await page.evaluate(() => {
      window.__tabuada!.clock.seconds = 301;
    });
    await page.waitForTimeout(700);
    await page.keyboard.press('KeyE');
    const depois = await lerEstado(page);
    expect(depois.inventario.fruta).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => window.__tabuada!.store.getState().garden[0]?.planted),
    ).toBe(false);
    await page.screenshot({ path: 'e2e/telas/36-horta-colhida.png' });
  });

  test('a comerciante abre a loja e o professor abre a tabuada', async ({ page }) => {
    const loja = merchantPosition();
    await page.evaluate(({ x, z }) => window.__tabuada!.teleportar?.(x, z), {
      x: loja.x,
      z: loja.z,
    });
    await page.waitForTimeout(700);
    await page.keyboard.press('KeyE');
    await expect(page.getByRole('dialog', { name: 'Loja' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const professor = teacherPosition('praia');
    await page.evaluate(({ x, z }) => window.__tabuada!.teleportar?.(x, z), {
      x: professor.x,
      z: professor.z,
    });
    // Sem animais nem nos de recurso perto: o teste e sobre o NPC, e nao sobre
    // quem tem prioridade na hora de apertar E (alimentar/colher > professor).
    await page.evaluate(() => window.__tabuada!.store.setState({ animals: [], nodes: [] }));
    await page.waitForTimeout(700);
    await page.keyboard.press('KeyE');
    await expect(page.getByRole('dialog', { name: 'Mural da tabuada' })).toBeVisible();
    // O professor abre o mural com a ajuda da regiao, consultando o progresso
    // pedagogico de verdade em vez de um texto estatico.
    await expect(page.getByRole('heading', { name: 'Ajuda do professor' })).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/33-professor.png' });
  });

  test('a loja nao abre com um desafio na tela', async ({ page }) => {
    await ficarAoLadoDeUmRecurso(page);
    await page.keyboard.press('KeyE');
    await expect(page.locator('.challenge')).toBeVisible();

    await page.keyboard.press('KeyL');

    await expect(page.getByRole('dialog', { name: 'Loja' })).toHaveCount(0);
  });

  test('a casa: entrar, acender de graca e olhar o mural', async ({ page }) => {
    await irParaOMovel(page, 'mural');

    const dentro = await lerEstado(page);
    expect(dentro.emCasa).toBe(true);
    expect(dentro.movelPerto).toBe('mural');
    // A lanterna acende sozinha em casa, sem conta e sem moeda.
    expect(dentro.cargaLanterna).toBeGreaterThan(0);
    expect(dentro.moedas).toBe(0);
    await page.screenshot({ path: 'e2e/telas/16-dentro-de-casa.png' });

    await page.keyboard.press('KeyE');
    const mural = page.getByRole('dialog', { name: 'Mural da tabuada' });
    await expect(mural).toBeVisible();
    // Consultar em casa e de graca: o resultado esta na parede para quem olhar.
    await expect(mural).toContainText('56');
    await page.screenshot({ path: 'e2e/telas/17-mural.png' });

    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(mural).toHaveCount(0);
  });

  test('o quadro de encomendas mostra os pedidos do dia', async ({ page }) => {
    await irParaOMovel(page, 'encomendas');
    await page.keyboard.press('KeyE');

    const quadro = page.getByRole('dialog', { name: 'Quadro de encomendas' });
    await expect(quadro).toBeVisible();
    await expect(quadro).toContainText('moedas');
    await page.screenshot({ path: 'e2e/telas/34-quadro-encomendas.png' });

    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(quadro).toHaveCount(0);
  });

  test('o espelho troca a aparencia, e ela sobrevive a recarregar a pagina', async ({ page }) => {
    await irParaOMovel(page, 'espelho');
    await page.keyboard.press('KeyE');

    const espelho = page.getByRole('dialog', { name: 'Espelho' });
    await expect(espelho).toBeVisible();

    await page.getByRole('button', { name: 'Menina' }).click();
    await page.getByLabel('Tom de pele 5').click();
    await page.getByLabel('Cor de roupa 3').click();
    await page.screenshot({ path: 'e2e/telas/18-espelho.png' });
    await page.getByRole('button', { name: 'Pronto' }).click();

    const escolhido = (await lerEstado(page)).aparencia;
    expect(escolhido).toMatchObject({ silhueta: 'menina', pele: 4, roupa: 2 });
    await page.screenshot({ path: 'e2e/telas/19-personagem-vestido.png' });

    // O save grava com atraso; espera passar do debounce antes de recarregar.
    await page.waitForTimeout(1200);
    await page.reload();
    await esperarJogoPronto(page);

    expect((await lerEstado(page)).aparencia).toMatchObject(escolhido);
  });

  test('a cama leva ao amanhecer', async ({ page }) => {
    await irParaOMovel(page, 'cama');
    await page.keyboard.press('KeyE');

    await expect(page.getByRole('dialog', { name: 'Cama' })).toBeVisible();
    await page.screenshot({ path: 'e2e/telas/20-cama.png' });

    await page.getByRole('button', { name: /Dormir/ }).click();
    await page.waitForTimeout(700);

    expect((await lerEstado(page)).fase).toBe('amanhecer');
  });

  test('o amanhecer fecha o dia com o resumo', async ({ page }) => {
    await ficarAoLadoDeUmRecurso(page);
    await page.keyboard.press('KeyE');
    await responderPeloEnunciado(page, true);

    await irParaOMeioDe(page, 'amanhecer');

    const resumo = page.getByRole('dialog', { name: 'Resumo do dia' });
    await expect(resumo).toBeVisible();
    await expect(resumo).toContainText('Amanheceu');
    await page.screenshot({ path: 'e2e/telas/15-resumo-do-dia.png' });

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(resumo).toHaveCount(0);
    // As moedas atravessam o dia; so os contadores do dia zeram.
    expect((await lerEstado(page)).moedas).toBeGreaterThan(0);
  });

  /**
   * Os vaga-lumes, e o motivo de este teste existir.
   *
   * A regra tem teste de unidade, mas ele chama a recarga direto e escolhe o
   * `delta`. No navegador, com WebGL por software, o quadro dura mais que os
   * `1 / 60` que a versao anterior tinha cravado — a lanterna expirava antes do
   * quadro seguinte e a carga ficava presa em 0,03 s para sempre. Só o navegador
   * lento mostrou.
   */
  test('encostar num enxame de vaga-lumes enche a lanterna, sem conta nenhuma', async ({
    page,
  }) => {
    await page.goto('/');
    await esperarJogoPronto(page);
    await irParaOMeioDe(page, 'noite');

    const enxame = createSwarms(createRng(swarmSeed(DEFAULT_WORLD_SEED)))[0];
    await page.evaluate((p) => window.__tabuada!.teleportar?.(p.x, p.z), {
      x: enxame.position.x + 2,
      z: enxame.position.z + 2,
    });

    await page.waitForTimeout(500);
    const inicio = (await lerEstado(page)).cargaLanterna;
    await page.waitForTimeout(2000);
    const depois = await lerEstado(page);

    // Cresce de verdade ao longo do tempo, e nao trava num valor de um quadro.
    expect(depois.cargaLanterna).toBeGreaterThan(inicio + 1);
    // E o socorro e de graca: nenhum desafio foi aberto.
    expect(depois.desafio).toBeNull();

    await page.screenshot({ path: 'e2e/telas/24-vagalumes.png' });
  });

  test('errar rende menos, revela a resposta e nao deixa de maos vazias', async ({ page }) => {
    await ficarAoLadoDeUmRecurso(page);
    await page.keyboard.press('KeyE');
    await expect(page.locator('.challenge')).toBeVisible();
    await esperarPainelCentralizado(page);

    const comDesafio = await lerEstado(page);
    const certa = comDesafio.desafio!.resposta;

    await responderPeloEnunciado(page, false);

    // Uma assercao so, de proposito.
    //
    // O painel de feedback vive `FEEDBACK_MS` (1,6 s) e some sozinho. Duas
    // esperas sequenciais contra ele passam nesta maquina e falham no CI, onde
    // o WebGL e por software e cada ida e volta ao navegador custa quase um
    // segundo: a primeira encontra a mensagem, a segunda chega depois de ela
    // ter sumido. Verificar as duas coisas numa unica espera acaba com a
    // corrida — nao separar de novo.
    await expect(page.locator('.challenge--feedback')).toContainText(
      new RegExp(`Quase!.*A resposta era ${certa}`, 's'),
    );
    await page.screenshot({ path: 'e2e/telas/07-errou.png' });

    const depois = await lerEstado(page);
    const total = totalColhido(depois);
    expect(total).toBeGreaterThanOrEqual(1);
    expect(total).toBeLessThan(certa);
  });

  /**
   * A promessa da fase inteira, provada no navegador.
   *
   * A regra das pontes tem teste de unidade, mas nenhum deles sabe se a parede
   * invisivel realmente abre, se o tabuleiro sustenta o jogador e se a fisica
   * deixa atravessar. Isso so o navegador responde.
   */
  /**
   * O álbum das seis regiões.
   *
   * Vale como documentação e como teste: percorrer o arquipélago inteiro prova
   * que `regionAt` concorda com o mundo físico em todo lugar — que o chão existe
   * onde os dados dizem que existe, e que o jogador pousa nele em vez de cair.
   * Um erro de coordenada numa região distante só apareceria quando a criança
   * chegasse lá.
   */
  /**
   * A troca de idioma, no navegador.
   *
   * Tradução quebra layout, e isso não aparece em teste de unidade nenhum: o
   * texto em inglês é mais curto aqui e mais longo ali, e um botão que cresce
   * escapa do painel. As capturas dos dois idiomas existem para serem olhadas.
   */
   test('trocar de idioma repinta o jogo sem recarregar', async ({ page }) => {
    await page.goto('/');
    await esperarJogoPronto(page);

    await expect(page.getByTestId('hud-controls')).toContainText('Controles');
    await page.screenshot({ path: 'e2e/telas/25-idioma-pt.png' });

    // O idioma nao e mais um seletor fixo no canto: esta no painel de
    // configuracoes. Abrir, trocar, fechar.
    await page.getByLabel('Configurações').click();
    await page.getByRole('dialog', { name: 'Configurações' });
    await page.getByRole('button', { name: 'English' }).click();
    await page.waitForTimeout(300);

    // O HUD inteiro trocou, sem recarregar a página.
    await expect(page.getByTestId('hud-controls')).toContainText('Controls');
    // O nome da regiao tambem troca.
    await expect(page.getByTestId('hud-regiao')).toHaveText('Beach');
    await expect(page.getByTestId('hud-controls')).not.toContainText('Controles');
    // O idioma selecionado tem que continuar legível com o ponteiro em cima: o
    // `:hover` tem especificidade maior que a classe de selecionado, e já ganhou
    // dela uma vez, deixando texto escuro sobre fundo escuro.
    const selecionado = await page.evaluate(() => {
      const botao = document.querySelector('.settings__language--on')!;
      const cs = getComputedStyle(botao);
      return { cor: cs.color, fundo: cs.backgroundColor };
    });
    expect(selecionado.fundo).not.toContain('20, 28, 44');

    await page.screenshot({ path: 'e2e/telas/26-idioma-en.png' });

    // Fechar o painel e voltar ao portugues: a troca tambem funciona no menu.
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByLabel('Settings').click();
    await page.getByRole('button', { name: 'Português' }).click();
    await page.getByRole('button', { name: 'Fechar' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('hud-controls')).toContainText('Controles');
  });

  test('o arquipelago inteiro: uma captura de cada regiao', async ({ page }) => {
    await page.goto('/');
    await esperarJogoPronto(page);

    for (const regiao of REGIONS) {
      await page.evaluate((p) => window.__tabuada!.teleportar?.(p.x, p.z), {
        x: regiao.center.x,
        z: regiao.center.z,
      });
      // Tempo para o corpo assentar no chão da região e a câmera acompanhar.
      await page.waitForTimeout(900);

      const estado = await lerEstado(page);
      expect(estado.regiao, `${regiao.id}: o jogador nao esta na regiao`).toBe(regiao.id);
      // Não caiu na água nem atravessou o terreno.
      expect(estado.jogador.y, `${regiao.id}: caiu`).toBeGreaterThan(regiao.groundY - 1);

      await page.screenshot({ path: `e2e/telas/regiao-${regiao.id}.png` });
    }
  });

  test('a ponte fechada barra a travessia, e a comprada deixa passar', async ({ page }) => {
    await page.goto('/');
    await esperarJogoPronto(page);

    // Fatos da tabuada do 2 dominados, moeda e recurso de sobra: falta so a ponte.
    await page.evaluate(() => {
      const factProgress = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => {
          const fator = i + 1;
          const key = `${Math.min(2, fator)}x${Math.max(2, fator)}`;
          return [key, { key, correct: 4, wrong: 0, streak: 4, lastSeen: 10, dueAt: 999 }];
        }),
      );
      window.__tabuada!.store.setState({
        coins: 300,
        inventory: {
          ...window.__tabuada!.store.getState().inventory,
          concha: 60,
          fruta: 20,
          pedra: 40,
        },
        factProgress,
      });
    });

    // Encostado na beira leste da Praia, de frente para o vao.
    await page.evaluate(() => window.__tabuada!.teleportar?.(14, 0));
    await page.waitForTimeout(400);
    expect((await lerEstado(page)).regiao).toBe('praia');
    // A guardia fica na margem, ao lado da ponte fechada: o pedagio tem cara.
    await page.screenshot({ path: 'e2e/telas/20b-guardia.png' });

    // Com a ponte fechada, andar para leste esbarra na parede.
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(2500);
    await soltarTudo(page);
    const barrado = await lerEstado(page);
    expect(barrado.regiao).toBe('praia');
    expect(barrado.jogador.x).toBeLessThan(17);
    await page.screenshot({ path: 'e2e/telas/21-ponte-fechada.png' });

    // A guardia cobra a conta antes de liberar a compra.
    await expect(page.getByText(/para construir a ponte/)).toBeVisible();
    await page.keyboard.press('KeyE');
    await expect(page.locator('.challenge')).toBeVisible();
    await responderPeloEnunciado(page, true);
    await page.waitForTimeout(400);
    expect((await lerEstado(page)).pontes).toContain('praia-porto');
    await page.screenshot({ path: 'e2e/telas/22-ponte-aberta.png' });

    // E agora atravessa.
    await page.keyboard.down('KeyD');
    for (let i = 0; i < 60; i += 1) {
      await page.waitForTimeout(150);
      if ((await lerEstado(page)).regiao === 'porto') break;
    }
    await soltarTudo(page);

    const doOutroLado = await lerEstado(page);
    expect(doOutroLado.regiao).toBe('porto');
    // Nao caiu na agua no caminho.
    expect(doOutroLado.jogador.y).toBeGreaterThan(-1);
    await page.screenshot({ path: 'e2e/telas/23-do-outro-lado.png' });
  });

  test('construir uma fogueira com o recurso colhido', async ({ page }) => {
    // Recurso suficiente sem precisar colher meia ilha; a colheita ja foi
    // provada nos testes acima.
    await page.evaluate(() => {
      window.__tabuada!.store.setState({
        inventory: {
          ...window.__tabuada!.store.getState().inventory,
          concha: 40,
          fruta: 10,
          pedra: 20,
        },
      });
    });

    await irParaOMeioDe(page, 'entardecer');
    await page.keyboard.press('KeyB');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/telas/08-modo-construcao.png' });

    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    // Construir também é conta: o Espaço abre o desafio e o acerto ergue a
    // fogueira.
    await responderPeloEnunciado(page, true);
    await page.waitForTimeout(400);

    const estado = await lerEstado(page);
    expect(estado.construcoes).toBe(1);
    // 8 conchas e 2 pedras debitados — a receita da fogueira.
    expect(estado.inventario.concha).toBe(32);
    expect(estado.inventario.pedra).toBe(18);

    await page.screenshot({ path: 'e2e/telas/09-fogueira.png' });
  });

  test('o entardecer convida a acender a lanterna', async ({ page }) => {
    await irParaOMeioDe(page, 'entardecer');

    const estado = await lerEstado(page);
    expect(estado.fase).toBe('entardecer');
    await expect(page.getByText(/Anoitecendo/)).toBeVisible();

    await page.screenshot({ path: 'e2e/telas/09b-entardecer.png' });
  });

  /**
   * O fluxo inteiro da noite, na ordem em que a crianca vive.
   *
   * Este teste substitui o antigo "sobreviver ate o amanhecer". Nao ha mais o
   * que sobreviver: o que se prova agora e que a noite chega, que a conta na
   * fogueira acende a lanterna e que o amanhecer devolve o dia.
   */
  test('a noite chega, a conta na fogueira acende a lanterna', async ({ page }) => {
    // Fogueira de pe ao lado do jogador — construi-la ja tem teste proprio.
    await page.evaluate(() => {
      const ponte = window.__tabuada!;
      ponte.store.setState({
        inventory: {
          ...window.__tabuada!.store.getState().inventory,
          concha: 40,
          fruta: 10,
          pedra: 20,
        },
        structures: [
          {
            id: 'fogueira-e2e',
            kind: 'fogueira' as const,
            position: { x: 0, y: 0, z: -2.5 },
            rotation: 0,
            fuelUntil: ponte.clock.seconds + 50,
          },
        ],
      });
    });

    // Adianta o relogio em vez de esperar o ciclo inteiro em tempo real.
    await irParaOMeioDe(page, 'noite');

    const noite = await lerEstado(page);
    expect(noite.fase).toBe('noite');
    expect(noite.cargaLanterna).toBe(0);
    await page.screenshot({ path: 'e2e/telas/10-noite-sem-lanterna.png' });

    // A mesma tecla da colheita, agora sem recurso ao alcance: abre a conta da
    // fogueira.
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(400);

    const comDesafio = await lerEstado(page);
    expect(comDesafio.desafio?.proposito).toBe('abastecer');

    await responderPeloEnunciado(page, true);
    await page.waitForTimeout(400);

    const acesa = await lerEstado(page);
    expect(acesa.cargaLanterna).toBeGreaterThan(noite.cargaLanterna);
    // Uma carga inteira cobre a noite (48 s) com folga.
    expect(acesa.cargaLanterna).toBeGreaterThan(48);

    // A tela com a lanterna acesa e o que prova o clima da fase — nenhum teste
    // unitario diz se a noite ficou acolhedora.
    await page.screenshot({ path: 'e2e/telas/11-noite-com-lanterna.png' });

    await irParaOMeioDe(page, 'amanhecer');
    expect((await lerEstado(page)).fase).toBe('amanhecer');
    await page.screenshot({ path: 'e2e/telas/12-amanhecer.png' });
  });

  test('errar na fogueira acende menos, mas nunca deixa no escuro', async ({ page }) => {
    await page.evaluate(() => {
      const ponte = window.__tabuada!;
      ponte.store.setState({
        structures: [
          {
            id: 'fogueira-e2e',
            kind: 'fogueira' as const,
            position: { x: 0, y: 0, z: -2.5 },
            rotation: 0,
            fuelUntil: ponte.clock.seconds + 50,
          },
        ],
      });
    });

    await irParaOMeioDe(page, 'noite');
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(400);

    await responderPeloEnunciado(page, false);
    await page.waitForTimeout(400);

    const carga = (await lerEstado(page)).cargaLanterna;
    expect(carga).toBeGreaterThan(0);
    expect(carga).toBeLessThan(48);
  });

  test('nenhum erro no console durante a partida', async ({ page }) => {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1500);
    await soltarTudo(page);

    const erros = (page as unknown as { _erros: string[] })._erros;
    expect(erros).toEqual([]);
  });
});
