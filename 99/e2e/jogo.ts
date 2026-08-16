import { expect, type Page } from '@playwright/test';
import { DAYNIGHT, PHASE_BOUNDS, type DayPhase } from '../src/slices/daynight/daynight.logic';

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
 * Coloca o jogador ao lado de um recurso disponivel e espera o destaque acender.
 *
 * Monta a cena em vez de atravessar a ilha correndo: caminhar depende da
 * velocidade do WebGL por software e deixava a suite lenta e instavel. Andar de
 * verdade continua coberto pelo teste proprio; aqui o que se testa e o que vem
 * depois de chegar perto.
 */
export async function ficarAoLadoDeUmRecurso(page: Page): Promise<string> {
  const alvo = await page.evaluate(() => {
    const ponte = window.__tabuada!;
    const no = ponte.store.getState().nodes.find((n) => !n.depleted)!;
    // 1,2 m ao lado: dentro do alcance de 3,2 e sem ficar dentro do objeto.
    ponte.teleportar!(no.position.x + 1.2, no.position.z);
    return no.id;
  });

  await page.waitForFunction(
    (id) => window.__tabuada!.store.getState().highlightedNodeId === id,
    alvo,
    { timeout: 15_000 },
  );

  return alvo;
}

/**
 * Piloto automatico: caminha de fato ate um recurso, corrigindo o rumo.
 *
 * Mantido para o caso de se querer exercitar a locomocao ponta a ponta. Os
 * testes de colheita usam `ficarAoLadoDeUmRecurso`, que e determinístico.
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

  const rotulos = await Promise.all((await botoes.all()).map((b) => b.getAttribute('aria-label')));
  const numerosNaTela = rotulos.map(Number);
  expect(numerosNaTela).toContain(esperado);

  const alvo = certo ? esperado : numerosNaTela.find((v) => v !== esperado)!;
  await page.getByRole('button', { name: String(alvo), exact: true }).click();

  return esperado;
}

export interface Dedo {
  encostar: (em: Ponto) => Promise<void>;
  arrastarAte: (destino: Ponto, passos?: number) => Promise<void>;
  soltar: () => Promise<void>;
}

interface Ponto {
  x: number;
  y: number;
}

/**
 * Um dedo de verdade, via CDP.
 *
 * `page.touchscreen` so faz toque simples, sem arrasto — e o joystick precisa de
 * arrasto. O CDP emite eventos de toque nativos, que o Chromium converte nos
 * mesmos `pointerdown`/`pointermove` de um dedo real.
 *
 * A sessao CDP e criada uma vez e reaproveitada pelo gesto inteiro. Criar uma
 * sessao nova so para soltar o dedo faz o Chromium responder
 * "Must send a TouchStart first": o toque em andamento pertence a sessao que o
 * iniciou.
 */
export async function usarDedo(page: Page): Promise<Dedo> {
  const cdp = await page.context().newCDPSession(page);
  let atual: Ponto = { x: 0, y: 0 };

  const enviar = (type: 'touchStart' | 'touchMove' | 'touchEnd', ponto: Ponto) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x: ponto.x, y: ponto.y, id: 1 }],
    });

  return {
    async encostar(em) {
      atual = em;
      await enviar('touchStart', em);
    },
    async arrastarAte(destino, passos = 8) {
      const de = atual;
      for (let i = 1; i <= passos; i += 1) {
        const t = i / passos;
        atual = { x: de.x + (destino.x - de.x) * t, y: de.y + (destino.y - de.y) * t };
        await enviar('touchMove', atual);
        await page.waitForTimeout(16);
      }
    },
    async soltar() {
      await enviar('touchEnd', atual);
    },
  };
}

/**
 * Adianta o relogio do jogo ate o meio de uma fase.
 *
 * Derivado das constantes do proprio jogo, e nao de fracoes fixas: o ritmo do
 * ciclo e um numero de ajuste de jogabilidade e ja mudou uma vez — o dia era
 * curto demais para montar o acampamento antes de anoitecer.
 */
export async function irParaOMeioDe(page: Page, fase: DayPhase): Promise<void> {
  const alvo = ((PHASE_BOUNDS[fase].start + PHASE_BOUNDS[fase].end) / 2) * DAYNIGHT.cycleSeconds;
  await page.evaluate((segundos) => {
    window.__tabuada!.clock.seconds = segundos;
  }, alvo);
  // Alguns quadros para a fase ser publicada e a cena reagir.
  await page.waitForTimeout(600);
}

/** Centro de um elemento na tela, para mirar o dedo. */
export async function centroDe(page: Page, seletor: string): Promise<Ponto> {
  const caixa = await page.locator(seletor).boundingBox();
  expect(caixa).not.toBeNull();
  return { x: caixa!.x + caixa!.width / 2, y: caixa!.y + caixa!.height / 2 };
}
