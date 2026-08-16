import { expect, type Page } from '@playwright/test';

/**
 * Utilitarios para conduzir o jogo de verdade no navegador.
 *
 * Concentrados aqui para que os specs leiam como uma partida — "anda ate um
 * recurso", "responde certo" — em vez de uma sequencia de teclas.
 */

export interface EstadoJogo {
  inventario: { madeira: number; fruta: number; pedra: number };
  destacado: string | null;
  desafio: { prompt: string; opcoes: number[]; resposta: number; proposito: string } | null;
  fase: string;
  vida: number;
  desfecho: string;
  construcoes: number;
  jogador: { x: number; z: number };
  inimigos: number;
}

/** Le o estado do jogo pela ponte de depuracao. */
export async function lerEstado(page: Page): Promise<EstadoJogo> {
  return page.evaluate(() => {
    const ponte = window.__tabuada!;
    const s = ponte.store.getState();
    return {
      inventario: s.inventory,
      destacado: s.highlightedNodeId,
      desafio: s.activeChallenge
        ? {
            prompt: s.activeChallenge.prompt,
            opcoes: s.activeChallenge.options,
            resposta: s.activeChallenge.answer,
            proposito: s.activeChallenge.purpose,
          }
        : null,
      fase: s.clock.phase,
      vida: s.health,
      desfecho: s.outcome,
      construcoes: s.structures.length,
      jogador: { x: ponte.transform.x, z: ponte.transform.z },
      inimigos: s.enemies.length,
    };
  });
}

/**
 * Espera o jogo estar de fato jogavel.
 *
 * Nao basta o canvas existir. A primeira versao desta funcao checava
 * `transform.y < 1.5` — mas `playerTransform` comeca zerado, entao a condicao
 * passava antes de qualquer quadro rodar e os screenshots saiam na tela de
 * carregamento. O sinal confiavel e o corpo ja ter caido e assentado: a capsula
 * repousa por volta de y = 0,8, valor que so aparece depois do WASM do Rapier
 * inicializar e a fisica rodar.
 */
export async function esperarJogoPronto(page: Page): Promise<void> {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 60_000 });

  // A tela de carregamento e o fallback do Suspense: enquanto estiver na
  // arvore, o canvas ainda nao montou.
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 60_000 });

  await page.waitForFunction(
    () => {
      const ponte = window.__tabuada;
      if (!ponte) return false;
      const assentado = ponte.transform.y > 0.5 && ponte.transform.y < 1.5;
      return ponte.store.getState().nodes.length > 0 && assentado;
    },
    null,
    { timeout: 60_000 },
  );

  // Um quadro a mais para a camera terminar de convergir para o jogador.
  await page.waitForTimeout(400);
}

/**
 * Rumo ate o no coletavel mais proximo, numa unica ida ao navegador.
 *
 * Jogador, alvo e destaque saem da mesma chamada de proposito: com leituras
 * separadas, cada passo do piloto custava tres viagens de ida e volta e o teste
 * estourava o tempo antes de chegar a um recurso.
 */
async function rumo(page: Page) {
  return page.evaluate(() => {
    const ponte = window.__tabuada!;
    const { x, z } = ponte.transform;
    const estado = ponte.store.getState();

    let melhor = { x: 0, z: 0, id: '' };
    let melhorDist = Infinity;
    for (const no of estado.nodes) {
      if (no.depleted) continue;
      const d = Math.hypot(no.position.x - x, no.position.z - z);
      if (d < melhorDist) {
        melhor = { x: no.position.x, z: no.position.z, id: no.id };
        melhorDist = d;
      }
    }

    return {
      jogador: { x, z },
      alvo: melhor,
      distancia: melhorDist,
      destacado: estado.highlightedNodeId,
    };
  });
}

/**
 * Piloto automatico: caminha ate destacar um recurso.
 *
 * Corrige o rumo a cada passo em vez de calcular a rota de uma vez — o jogador
 * e um corpo fisico, entao esbarrao em cerca ou pedra desvia a trajetoria e uma
 * rota fixa erraria o alvo. Com a camera em yaw 0, W anda para -Z e D para +X.
 */
export async function andarAteUmRecurso(page: Page, tentativas = 90): Promise<void> {
  for (let passo = 0; passo < tentativas; passo += 1) {
    const { jogador, alvo, distancia } = await rumo(page);

    /**
     * Para bem dentro do alcance, e nao assim que o destaque acende.
     *
     * A primeira versao retornava no primeiro `destacado` — mas nesse instante
     * o jogador ainda corre a 7 m/s, e no tempo entre o Playwright ler o estado
     * e soltar as teclas ele ja passou do recurso. Parar a 1,5 m e esperar o
     * corpo assentar deixa o teste no mesmo lugar em que uma pessoa pararia.
     */
    if (distancia < 1.5) {
      await soltarTudo(page);
      await page.waitForTimeout(250);
      if ((await rumo(page)).destacado) return;
    }

    const dx = alvo.x - jogador.x;
    const dz = alvo.z - jogador.z;

    const teclas: string[] = [];
    if (dz < -0.3) teclas.push('KeyW');
    if (dz > 0.3) teclas.push('KeyS');
    if (dx > 0.3) teclas.push('KeyD');
    if (dx < -0.3) teclas.push('KeyA');

    await soltarTudo(page);
    for (const tecla of teclas) await page.keyboard.down(tecla);
    // Passo curto: a 7 m/s, 80 ms sao ~56 cm de avanco por correcao de rumo.
    await page.waitForTimeout(80);
  }

  await soltarTudo(page);
  throw new Error('O piloto automatico nao alcancou nenhum recurso a tempo.');
}

export async function soltarTudo(page: Page): Promise<void> {
  for (const tecla of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) {
    await page.keyboard.up(tecla).catch(() => {});
  }
}

/**
 * Responde o desafio aberto clicando na alternativa certa.
 *
 * Calcula a resposta **a partir do enunciado exibido na tela**, e nao do estado
 * interno: e assim que se prova que o texto que a crianca le corresponde a conta
 * que o jogo espera. Um enunciado que dissesse "4 galhos" enquanto a resposta
 * fosse 10 seria pego aqui.
 */
export async function responderPeloEnunciado(page: Page, certo: boolean): Promise<number> {
  const enunciado = await page.locator('.challenge__prompt').textContent();
  expect(enunciado).toBeTruthy();

  const numeros = enunciado!.match(/\d+/g)!.map(Number);
  expect(numeros).toHaveLength(2);
  const esperado = numeros[0] * numeros[1];

  // Os botoes tem `aria-label` com o proprio numero — o mesmo rotulo que um
  // leitor de tela anuncia, entao o teste enxerga o que a crianca enxerga.
  const botoes = page.getByRole('button', { name: /^\d+$/ });
  const valores = (await botoes.all()).map((_, i) => i);
  expect(valores.length).toBeGreaterThan(0);

  const rotulos = await Promise.all(
    (await botoes.all()).map((b) => b.getAttribute('aria-label')),
  );
  const numerosNaTela = rotulos.map(Number);
  expect(numerosNaTela).toContain(esperado);

  const alvo = certo ? esperado : numerosNaTela.find((v) => v !== esperado)!;
  await page.getByRole('button', { name: String(alvo), exact: true }).click();

  return esperado;
}

/** Toque real via CDP — `page.touchscreen` so faz toque simples, sem arrasto. */
export async function arrastarDedo(
  page: Page,
  de: { x: number; y: number },
  para: { x: number; y: number },
  passos = 8,
): Promise<void> {
  const cdp = await page.context().newCDPSession(page);

  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: de.x, y: de.y, id: 1 }],
  });

  for (let i = 1; i <= passos; i += 1) {
    const t = i / passos;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: de.x + (para.x - de.x) * t, y: de.y + (para.y - de.y) * t, id: 1 }],
    });
    await page.waitForTimeout(16);
  }
}

/** Solta o dedo que `arrastarDedo` deixou pressionado. */
export async function soltarDedo(page: Page, em: { x: number; y: number }): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [{ x: em.x, y: em.y, id: 1 }],
  });
}
