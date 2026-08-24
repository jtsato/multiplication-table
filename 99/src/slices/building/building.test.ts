import { describe, expect, it } from 'vitest';
import {
  BUILDING,
  STRUCTURES,
  canAfford,
  checkPlacement,
  constructionTarget,
  formatRecipe,
  fuelRemaining,
  isLit,
  payCost,
  placementPosition,
  snapFencePlacement,
  type Structure,
} from './building.logic';
import { regionById } from '../regions/regions.logic';
import { emptyInventory, type Inventory, type ResourceNode } from '../resources/resources.logic';
import { vec3 } from '../../shared/vec';
import { bundleFor } from '../../i18n';

const pt = bundleFor('pt-BR');

const inv = (partial: Partial<Inventory>): Inventory => ({ ...emptyInventory(), ...partial });

const structure = (kind: Structure['kind'], x: number, z: number): Structure => ({
  id: `${kind}-${x}-${z}`,
  kind,
  position: vec3(x, 0, z),
  rotation: 0,
  fuelUntil: 0,
});

const node = (x: number, z: number, depleted = false): ResourceNode => ({
  id: `no-${x}-${z}`,
  kind: 'concha',
  perGroup: 2,
  position: vec3(x, 0, z),
  groups: 3,
  depleted,
});

/** Inventário folgado para testes que não são sobre custo. */
const rico = inv({ concha: 999, fruta: 999, pedra: 999 });

describe('canAfford', () => {
  it('aceita exatamente o custo — a borda conta como suficiente', () => {
    expect(canAfford(inv({ concha: 8, pedra: 2 }), STRUCTURES.fogueira.recipe)).toBe(true);
  });

  it('recusa faltando uma unidade de qualquer ingrediente', () => {
    expect(canAfford(inv({ concha: 7, pedra: 2 }), STRUCTURES.fogueira.recipe)).toBe(false);
    expect(canAfford(inv({ concha: 8, pedra: 1 }), STRUCTURES.fogueira.recipe)).toBe(false);
  });

  it('ignora recursos que nao estao na receita', () => {
    expect(canAfford(inv({ concha: 6 }), STRUCTURES.cerca.recipe)).toBe(true);
  });

  it('recusa inventario vazio', () => {
    expect(canAfford(emptyInventory(), STRUCTURES.cerca.recipe)).toBe(false);
  });

  it('aceita receita vazia', () => {
    expect(canAfford(emptyInventory(), {})).toBe(true);
  });
});

describe('payCost', () => {
  it('debita cada ingrediente da receita', () => {
    const depois = payCost(inv({ concha: 10, pedra: 6 }), STRUCTURES.fogueira.recipe);
    expect(depois.concha).toBe(2);
    expect(depois.pedra).toBe(4);
  });

  it('nao mexe em recursos fora da receita', () => {
    const depois = payCost(inv({ concha: 10, fruta: 5 }), STRUCTURES.cerca.recipe);
    expect(depois.fruta).toBe(5);
  });

  it('nao cobra nada quando nao da para pagar', () => {
    const antes = inv({ concha: 3 });
    expect(payCost(antes, STRUCTURES.cerca.recipe)).toEqual(antes);
  });

  it('nunca deixa o inventario negativo', () => {
    for (const spec of Object.values(STRUCTURES)) {
      const depois = payCost(inv({ concha: 1, pedra: 1 }), spec.recipe);
      expect(Object.values(depois).every((valor) => valor >= 0)).toBe(true);
    }
  });

  it('nao muta o inventario original', () => {
    const original = inv({ concha: 10, pedra: 6 });
    payCost(original, STRUCTURES.fogueira.recipe);
    expect(original.concha).toBe(10);
  });

  it('pagar exatamente o custo zera os ingredientes', () => {
    const depois = payCost(inv({ concha: 8, pedra: 2 }), STRUCTURES.fogueira.recipe);
    expect(depois.concha).toBe(0);
    expect(depois.pedra).toBe(0);
  });
});

describe('placementPosition', () => {
  it('coloca a construcao a frente do jogador — mesmo eixo do movimento', () => {
    // Com yaw 0 a frente e -Z, igual a `inputToDirection`.
    const alvo = placementPosition(vec3(0, 0, 0), 0, 3);
    expect(alvo.x).toBeCloseTo(0);
    expect(alvo.z).toBeCloseTo(-3);
  });

  it('acompanha o giro da camera', () => {
    const alvo = placementPosition(vec3(0, 0, 0), Math.PI / 2, 3);
    expect(alvo.x).toBeCloseTo(-3);
    expect(alvo.z).toBeCloseTo(0);
  });

  it('mantem a distancia pedida para qualquer angulo', () => {
    for (let yaw = -Math.PI; yaw <= Math.PI; yaw += 0.35) {
      const alvo = placementPosition(vec3(4, 0, -2), yaw, 3.4);
      expect(Math.hypot(alvo.x - 4, alvo.z - -2)).toBeCloseTo(3.4);
    }
  });

  it('sempre devolve altura zero — construcoes ficam no chao', () => {
    expect(placementPosition(vec3(0, 5, 0), 1).y).toBe(0);
  });
});

describe('checkPlacement', () => {
  it('aceita um ponto livre no centro da ilha', () => {
    expect(checkPlacement(STRUCTURES.fogueira, vec3(0, 0, 0), rico, [], [])).toEqual({ ok: true });
  });

  it('recusa por falta de recurso antes de qualquer outro motivo', () => {
    // Posicao invalida E sem recurso: a mensagem util e a do recurso.
    const resultado = checkPlacement(
      STRUCTURES.fogueira,
      vec3(999, 0, 999),
      emptyInventory(),
      [],
      [],
    );
    expect(resultado).toEqual({ ok: false, reason: 'sem-recursos' });
  });

  it('recusa na agua', () => {
    const resultado = checkPlacement(STRUCTURES.fogueira, vec3(500, 0, 500), rico, [], []);
    expect(resultado).toEqual({ ok: false, reason: 'fora-da-ilha' });
  });

  /**
   * A validacao acompanhou o mundo virar arquipelago. Enquanto ela olhava o
   * disco antigo de raio 30, a crianca nao conseguia acender uma fogueira em
   * cinco das seis regioes — e o motivo na tela seria "fora da ilha", estando
   * ela em terra firme.
   */
  it('aceita construir em qualquer regiao, e nao so na praia', () => {
    for (const id of ['praia', 'porto', 'bosque', 'cachoeira', 'pomar', 'pico'] as const) {
      const centro = regionById(id).center;
      expect(checkPlacement(STRUCTURES.fogueira, centro, rico, [], [])).toEqual({ ok: true });
    }
  });

  it('exige que a construcao inteira caiba, nao so o centro', () => {
    // Centro dentro do raio, mas o footprint atravessaria a borda.
    const porto = regionById('porto');
    const quaseNaBorda = vec3(
      porto.center.x + porto.radius - STRUCTURES.fogueira.footprint / 2,
      0,
      porto.center.z,
    );
    expect(checkPlacement(STRUCTURES.fogueira, quaseNaBorda, rico, [], [])).toEqual({
      ok: false,
      reason: 'fora-da-ilha',
    });
  });

  it('recusa sobreposicao com outra construcao', () => {
    const resultado = checkPlacement(
      STRUCTURES.fogueira,
      vec3(0, 0, 0),
      rico,
      [structure('fogueira', 1, 0)],
      [],
    );
    expect(resultado).toEqual({ ok: false, reason: 'sobreposta' });
  });

  it('aceita duas construcoes lado a lado quando ha espaco', () => {
    const distante = STRUCTURES.fogueira.footprint + STRUCTURES.cerca.footprint + 0.5;
    expect(
      checkPlacement(
        STRUCTURES.fogueira,
        vec3(0, 0, 0),
        rico,
        [structure('cerca', distante, 0)],
        [],
      ),
    ).toEqual({ ok: true });
  });

  it('recusa perto demais de um recurso', () => {
    const resultado = checkPlacement(STRUCTURES.cerca, vec3(0, 0, 0), rico, [], [node(1.5, 0)]);
    expect(resultado).toEqual({ ok: false, reason: 'perto-de-recurso' });
  });

  it('mantem o deposito esgotado ocupando o espaco da construcao', () => {
    expect(checkPlacement(STRUCTURES.cerca, vec3(0, 0, 0), rico, [], [node(1.5, 0, true)])).toEqual(
      { ok: false, reason: 'perto-de-recurso' },
    );
  });

  it('aceita quando o recurso esta alem da folga', () => {
    const longe =
      STRUCTURES.cerca.footprint + BUILDING.clearanceFromNodes + BUILDING.fenceLength / 2 + 0.3;
    expect(checkPlacement(STRUCTURES.cerca, vec3(0, 0, 0), rico, [], [node(longe, 0)])).toEqual({
      ok: true,
    });
  });

  it('recusa recurso proximo de uma extremidade da cerca', () => {
    const resultado = checkPlacement(STRUCTURES.cerca, vec3(0, 0, 0), rico, [], [node(4.1, 0)], 0);

    expect(resultado).toEqual({ ok: false, reason: 'perto-de-recurso' });
  });
});

describe('snapFencePlacement', () => {
  it('encaixa uma cerca na extensao reta da cerca mais proxima', () => {
    const existente = structure('cerca', 0, 0);
    const resultado = snapFencePlacement(vec3(1.75, 0, 0), 0, rico, [existente], []);

    expect(resultado.position.x).toBeCloseTo(2);
    expect(resultado.position.z).toBeCloseTo(0);
    expect(resultado.rotation).toBeCloseTo(0);
  });

  it('encaixa uma cerca em um canto de 90 graus', () => {
    const existente = structure('cerca', 0, 0);
    const resultado = snapFencePlacement(vec3(1, 0, -1.2), 0, rico, [existente], []);

    expect(resultado.position.x).toBeCloseTo(1);
    expect(resultado.position.z).toBeCloseTo(-1);
    expect(Math.abs(Math.sin(resultado.rotation))).toBeCloseTo(1);
  });

  it('mantem o posicionamento manual quando nenhuma ponta esta proxima', () => {
    const manual = vec3(6, 0, 6);
    const resultado = snapFencePlacement(manual, 0.3, rico, [structure('cerca', 0, 0)], []);

    expect(resultado.position).toEqual(manual);
    expect(resultado.rotation).toBeCloseTo(0.3);
  });

  it('mantem o posicionamento manual quando ainda nao ha cercas', () => {
    const manual = vec3(4.5, 0, -3);
    const resultado = snapFencePlacement(manual, 0.3, rico, [], []);

    expect(resultado.position).toEqual(manual);
    expect(resultado.rotation).toBeCloseTo(0.3);
  });

  it('descarta o encaixe proximo de recurso e preserva o ponto manual valido', () => {
    const manual = vec3(2, 0, -1.5);
    const resultado = snapFencePlacement(manual, 0, rico, [structure('cerca', 0, 0)], [node(2, 3)]);

    expect(resultado.position).toEqual(manual);
    expect(resultado.rotation).toBeCloseTo(0);
  });
});

describe('formatRecipe', () => {
  it('descreve o custo de forma legivel', () => {
    expect(formatRecipe(STRUCTURES.cerca.recipe, pt)).toBe('6 conchas');
    expect(formatRecipe(STRUCTURES.fogueira.recipe, pt)).toBe('8 conchas · 2 pedras');
  });

  it('concorda em numero — "1 pedra", "4 pedras"', () => {
    expect(formatRecipe({ pedra: 1 }, pt)).toBe('1 pedra');
    expect(formatRecipe({ pedra: 4 }, pt)).toBe('4 pedras');
    expect(formatRecipe({ fruta: 1 }, pt)).toBe('1 fruta');
    expect(formatRecipe({ fruta: 4 }, pt)).toBe('4 frutas');
  });

  it('concha e invariavel', () => {
    expect(formatRecipe({ concha: 1 }, pt)).toBe('1 concha');
    expect(formatRecipe({ concha: 8 }, pt)).toBe('8 conchas');
  });
});

/**
 * Casos que a mutacao cobrou.
 *
 * Cada um deles e uma regra que o codigo cumpre e que nenhum teste afirmava:
 * trocar a condicao por `true` passava por toda a suite.
 */
describe('regras que a mutacao encontrou sem teste', () => {
  it('cerca nao tem combustivel — so a fogueira queima', () => {
    const cerca = { ...structure('cerca', 0, 0), fuelUntil: 9999 };
    expect(fuelRemaining(cerca, 0)).toBe(0);
    expect(isLit(cerca, 0)).toBe(false);

    const fogueira = { ...structure('fogueira', 0, 0), fuelUntil: 30 };
    expect(fuelRemaining(fogueira, 0)).toBe(30);
    expect(isLit(fogueira, 0)).toBe(true);
  });

  /**
   * A isencao que deixa duas cercas se emendarem **nao pode valer para a
   * fogueira**. Sem estes casos, um mutante que ignorava o tipo passava: uma
   * fogueira poderia nascer colada numa cerca, atravessando-a.
   */
  it('a isencao de emenda e so entre cercas', () => {
    const cercaExistente = structure('cerca', 0, 0);
    const rico = inv({ concha: 99, pedra: 99 });

    // Fogueira encostada numa cerca: sem isencao, e recusada.
    expect(
      checkPlacement(STRUCTURES.fogueira, vec3(0.2, 0, 0), rico, [cercaExistente], []),
    ).toEqual({ ok: false, reason: 'sobreposta' });

    // Cerca encostada numa fogueira: tambem sem isencao.
    const fogueiraExistente = structure('fogueira', 0, 0);
    expect(
      checkPlacement(STRUCTURES.cerca, vec3(0.2, 0, 0), rico, [fogueiraExistente], []),
    ).toEqual({ ok: false, reason: 'sobreposta' });
  });

  it('duas cercas continuam podendo se emendar', () => {
    const rico = inv({ concha: 99 });
    const existente = structure('cerca', 0, 0);
    const emenda = vec3(STRUCTURES.cerca.footprint * 2, 0, 0);

    // Alinhadas ponta a ponta, a emenda e permitida.
    expect(checkPlacement(STRUCTURES.cerca, emenda, rico, [existente], [], 0).ok).toBe(true);
  });
});

describe('constructionTarget', () => {
  it('a fogueira pede 8 grupos de 2 — a própria receita', () => {
    expect(constructionTarget('fogueira')).toMatchObject({
      id: 'construir-fogueira',
      kind: 'concha',
      groups: 8,
      perGroup: 2,
    });
  });

  it('a cerca vira 3 grupos de 2 conchas', () => {
    const alvo = constructionTarget('cerca');
    expect(alvo.groups).toBe(3);
    expect(alvo.perGroup).toBe(2);
    expect(alvo.groups * alvo.perGroup).toBe(STRUCTURES.cerca.recipe.concha);
  });
});
