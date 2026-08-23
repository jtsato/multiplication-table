import { describe, expect, it } from 'vitest';
import {
  BRIDGES,
  BRIDGE_GUARD,
  BRIDGE_FACTS_REQUIRED,
  BRIDGE_MASTERY,
  bridgeAnchors,
  bridgeById,
  bridgeFor,
  bridgeGuardPosition,
  checkBridge,
  openingsFor,
  reachableFrom,
  requiredTables,
} from './bridges.logic';
import { REGION_ORDER, regionAt, regionById, type RegionId } from './regions.logic';
import { emptyInventory, type Inventory } from '../resources/resources.logic';
import { factKey } from '../economy/economy.logic';

/** Os `quantos` primeiros fatos de uma tabuada, como a economia os guarda. */
const fatosDe = (table: number, quantos = 10) =>
  Array.from({ length: quantos }, (_, i) => factKey(table, i + 1));

/** Contagens: cada fato com `repeticoes` acertos (padrão 3 = domina). */
const contagensDe = (table: number, repeticoes = BRIDGE_MASTERY): Record<string, number> =>
  Object.fromEntries(fatosDe(table).map((fato) => [fato, repeticoes]));

/** Contagens suficientes para liberar a saida desta regiao. */
const dominaSaidaDe = (id: RegionId) =>
  regionById(id).tables.reduce<Record<string, number>>(
    (acc, t) => ({ ...acc, ...contagensDe(t) }),
    {},
  );

const rico: Inventory = { ...emptyInventory(), madeira: 99, fruta: 99, pedra: 99 };

describe('o catalogo de pontes', () => {
  it('liga a cadeia inteira, uma ponte por par de vizinhas', () => {
    expect(BRIDGES).toHaveLength(REGION_ORDER.length - 1);
    for (let i = 0; i < REGION_ORDER.length - 1; i += 1) {
      expect(bridgeFor(REGION_ORDER[i], REGION_ORDER[i + 1])).toBeDefined();
    }
  });

  it('nao existe ponte entre regioes que nao sao vizinhas', () => {
    expect(bridgeFor('praia', 'pico')).toBeUndefined();
    expect(bridgeFor('praia', 'bosque')).toBeUndefined();
  });

  it('acha a ponte nos dois sentidos — atravessar e simetrico', () => {
    const ida = bridgeFor('praia', 'porto');
    expect(bridgeFor('porto', 'praia')).toBe(ida);
  });

  it('custa mais a cada travessia, e sempre moeda e recurso', () => {
    const custos = BRIDGES.map((b) => b.coins);
    expect([...custos].sort((a, b) => a - b)).toEqual(custos);
    for (const ponte of BRIDGES) {
      expect(ponte.coins).toBeGreaterThan(0);
      expect(Object.keys(ponte.recipe).length).toBeGreaterThan(0);
    }
  });

  /**
   * A ponte cobra a tabuada de onde se sai, e nao de onde se chega. O contrario
   * seria pedir a conta antes de a crianca ter tido onde aprende-la.
   */
  it('exige a tabuada da regiao de origem', () => {
    expect(requiredTables(bridgeFor('praia', 'porto')!)).toEqual([2]);
    expect(requiredTables(bridgeFor('porto', 'bosque')!)).toEqual([3]);
  });
});

describe('checkBridge', () => {
  const ponte = () => bridgeFor('praia', 'porto')!;

  it('abre com moeda, recurso e a tabuada repetida 3 vezes', () => {
    expect(checkBridge(ponte(), 999, rico, dominaSaidaDe('praia'))).toEqual({ ok: true });
  });

  it('recusa sem moeda, e diz que falta moeda', () => {
    expect(checkBridge(ponte(), 0, rico, dominaSaidaDe('praia'))).toEqual({
      ok: false,
      reason: 'sem-moedas',
    });
  });

  it('recusa sem recurso, e diz que falta recurso', () => {
    expect(checkBridge(ponte(), 999, emptyInventory(), dominaSaidaDe('praia'))).toEqual({
      ok: false,
      reason: 'sem-recursos',
    });
  });

  /**
   * A recusa por tabuada tem que ser distinguivel das outras duas: dizer "faltam
   * moedas" para quem tem moedas de sobra e nao treinou a tabuada manda a
   * crianca juntar mais moedas, que e exatamente o caminho errado.
   */
  it('recusa sem a tabuada, mesmo com moeda e recurso sobrando', () => {
    expect(checkBridge(ponte(), 999, rico, {})).toEqual({
      ok: false,
      reason: 'sem-tabuada',
    });
  });

  /**
   * O caso que prende a prioridade: sem moeda, sem recurso e sem tabuada, a
   * recusa tem que falar da tabuada. Foi um teste de mutacao que mostrou a
   * falta dele — trocar a ordem das verificacoes nao quebrava nada, e a
   * prioridade que o comentario do codigo promete era so comentario.
   */
  it('sem nada, a recusa fala da tabuada — o unico caminho util', () => {
    expect(checkBridge(ponte(), 0, emptyInventory(), {})).toEqual({
      ok: false,
      reason: 'sem-tabuada',
    });
  });

  it('mantem compatibilidade do save legado com 3 repetições de cada fato', () => {
    const quaseLa = contagensDe(2, BRIDGE_MASTERY - 1);
    expect(checkBridge(ponte(), 999, rico, quaseLa)).toEqual({
      ok: false,
      reason: 'sem-tabuada',
    });
    expect(checkBridge(ponte(), 999, rico, contagensDe(2))).toEqual({ ok: true });
  });

  it('libera com domínio suficiente no progresso novo, sem perfeccionismo', () => {
    const progresso = Object.fromEntries(
      fatosDe(2, BRIDGE_FACTS_REQUIRED).map((key) => [
        key,
        { key, correct: 4, wrong: 0, streak: 4, lastSeen: 4, dueAt: 999 },
      ]),
    );
    expect(checkBridge(ponte(), 999, rico, progresso)).toEqual({ ok: true });
  });

  it('não libera progresso novo com um fato dominado a menos', () => {
    const progresso = Object.fromEntries(
      fatosDe(2, BRIDGE_FACTS_REQUIRED - 1).map((key) => [
        key,
        { key, correct: 4, wrong: 0, streak: 4, lastSeen: 4, dueAt: 999 },
      ]),
    );
    expect(checkBridge(ponte(), 999, rico, progresso)).toEqual({
      ok: false,
      reason: 'sem-tabuada',
    });
  });

  it('recusa factProgress sem domínio mastered mesmo com contagens altas', () => {
    const progresso = Object.fromEntries(
      fatosDe(2).map((key) => [key, { key, correct: 10, wrong: 5, streak: 0, lastSeen: 10, dueAt: 999 }]),
    );
    expect(checkBridge(ponte(), 999, rico, progresso)).toEqual({
      ok: false,
      reason: 'sem-tabuada',
    });
  });

  it('a ilha do Porto exige a tabuada do 3', () => {
    const ponteDoPorto = bridgeFor('porto', 'bosque')!;
    expect(checkBridge(ponteDoPorto, 999, rico, contagensDe(5))).toEqual({
      ok: false,
      reason: 'sem-tabuada',
    });
    expect(checkBridge(ponteDoPorto, 999, rico, dominaSaidaDe('porto'))).toEqual({ ok: true });
  });
});

describe('as aberturas na parede', () => {
  it('sem ponte comprada, a praia e fechada', () => {
    expect(openingsFor('praia', [])).toEqual([]);
  });

  it('a ponte comprada abre uma passagem, apontada para a vizinha', () => {
    const ponte = bridgeFor('praia', 'porto')!;
    const aberturas = openingsFor('praia', [ponte.id]);
    expect(aberturas).toHaveLength(1);

    const praia = regionById('praia');
    const porto = regionById('porto');
    const esperado = Math.atan2(porto.center.z - praia.center.z, porto.center.x - praia.center.x);
    expect(aberturas[0]).toBeCloseTo(esperado);
  });

  it('a passagem aparece dos dois lados — atravessar volta', () => {
    const ponte = bridgeFor('praia', 'porto')!;
    expect(openingsFor('praia', [ponte.id])).toHaveLength(1);
    expect(openingsFor('porto', [ponte.id])).toHaveLength(1);
  });

  it('uma ponte de outra parte do mapa nao abre buraco aqui', () => {
    const longe = bridgeFor('pomar', 'pico')!;
    expect(openingsFor('praia', [longe.id])).toEqual([]);
  });
});

describe('bridgeAnchors', () => {
  it('encosta exatamente na beira de cada regiao', () => {
    for (const ponte of BRIDGES) {
      const { from, to } = bridgeAnchors(ponte);
      const origem = regionById(ponte.from);
      const destino = regionById(ponte.to);

      expect(Math.hypot(from.x - origem.center.x, from.z - origem.center.z)).toBeCloseTo(
        origem.radius,
      );
      expect(Math.hypot(to.x - destino.center.x, to.z - destino.center.z)).toBeCloseTo(
        destino.radius,
      );
    }
  });

  it('nasce e termina na altura de cada margem — a ponte e a rampa do desnivel', () => {
    const subida = bridgeFor('bosque', 'cachoeira')!;
    const { from, to } = bridgeAnchors(subida);
    expect(from.y).toBe(regionById('bosque').groundY);
    expect(to.y).toBe(regionById('cachoeira').groundY);
    expect(from.y).not.toBe(to.y);
  });
});

describe('bridgeGuardPosition', () => {
  it('fica na regiao de origem — a guardia cobra a tabuada de onde se sai', () => {
    for (const ponte of BRIDGES) {
      const posicao = bridgeGuardPosition(ponte);
      expect(regionAt(posicao)?.id, ponte.id).toBe(ponte.from);
    }
  });

  it('fica na altura da margem de origem, nao no meio do desnivel', () => {
    for (const ponte of BRIDGES) {
      expect(bridgeGuardPosition(ponte).y, ponte.id).toBe(regionById(ponte.from).groundY);
    }
  });

  it('fica perto da margem, um passo para dentro e para o lado', () => {
    for (const ponte of BRIDGES) {
      const { from } = bridgeAnchors(ponte);
      const posicao = bridgeGuardPosition(ponte);
      const distancia = Math.hypot(posicao.x - from.x, posicao.z - from.z);
      // Recuo lateral e para tras somados: perto da ponte, mas fora do tabuleiro.
      expect(distancia, ponte.id).toBeGreaterThan(BRIDGE_GUARD.side);
      expect(distancia, ponte.id).toBeLessThan(BRIDGE_GUARD.side + BRIDGE_GUARD.back + 0.5);
    }
  });
});

describe('reachableFrom', () => {
  it('sem ponte nenhuma, so a praia', () => {
    expect(reachableFrom('praia', [])).toEqual(['praia']);
  });

  it('as pontes abrem uma regiao por vez, na ordem didatica', () => {
    const primeira = bridgeFor('praia', 'porto')!;
    expect(reachableFrom('praia', [primeira.id]).sort()).toEqual(['porto', 'praia']);
  });

  /**
   * Com todas compradas, nenhuma regiao pode ficar de fora. Um erro de dados
   * aqui isolaria uma tabuada para sempre, e o jogo so mostraria isso para a
   * crianca que chegasse la.
   */
  it('com todas compradas, alcanca as nove', () => {
    const todas = BRIDGES.map((b) => b.id);
    expect(reachableFrom('praia', todas)).toHaveLength(REGION_ORDER.length);
  });

  it('uma ponte solta no meio nao teleporta ninguem', () => {
    // Comprar so a ultima ponte nao da acesso ao Pico: falta a cadeia inteira.
    const ultima = bridgeFor('pomar', 'pico')!;
    expect(reachableFrom('praia', [ultima.id])).toEqual(['praia']);
  });
});

describe('bridgeById', () => {
  it('devolve a ponte pelo id', () => {
    for (const ponte of BRIDGES) {
      expect(bridgeById(ponte.id)).toBe(ponte);
    }
  });
});
