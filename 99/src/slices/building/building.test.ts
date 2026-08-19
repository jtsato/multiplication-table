import { describe, expect, it } from 'vitest';
import {
  BUILDING,
  STRUCTURES,
  canAfford,
  checkPlacement,
  formatRecipe,
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
  kind: 'madeira',
  perGroup: 2,
  position: vec3(x, 0, z),
  groups: 3,
  depleted,
});

/** Inventário folgado para testes que não são sobre custo. */
const rico = inv({ madeira: 999, fruta: 999, pedra: 999 });

describe('canAfford', () => {
  it('aceita exatamente o custo — a borda conta como suficiente', () => {
    expect(canAfford(inv({ madeira: 8, pedra: 4 }), STRUCTURES.fogueira.recipe)).toBe(true);
  });

  it('recusa faltando uma unidade de qualquer ingrediente', () => {
    expect(canAfford(inv({ madeira: 7, pedra: 4 }), STRUCTURES.fogueira.recipe)).toBe(false);
    expect(canAfford(inv({ madeira: 8, pedra: 3 }), STRUCTURES.fogueira.recipe)).toBe(false);
  });

  it('ignora recursos que nao estao na receita', () => {
    expect(canAfford(inv({ madeira: 6 }), STRUCTURES.cerca.recipe)).toBe(true);
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
    const depois = payCost(inv({ madeira: 10, pedra: 6 }), STRUCTURES.fogueira.recipe);
    expect(depois.madeira).toBe(2);
    expect(depois.pedra).toBe(2);
  });

  it('nao mexe em recursos fora da receita', () => {
    const depois = payCost(inv({ madeira: 10, fruta: 5 }), STRUCTURES.cerca.recipe);
    expect(depois.fruta).toBe(5);
  });

  it('nao cobra nada quando nao da para pagar', () => {
    const antes = inv({ madeira: 3 });
    expect(payCost(antes, STRUCTURES.cerca.recipe)).toEqual(antes);
  });

  it('nunca deixa o inventario negativo', () => {
    for (const spec of Object.values(STRUCTURES)) {
      const depois = payCost(inv({ madeira: 1, pedra: 1 }), spec.recipe);
      expect(Object.values(depois).every((valor) => valor >= 0)).toBe(true);
    }
  });

  it('nao muta o inventario original', () => {
    const original = inv({ madeira: 10, pedra: 6 });
    payCost(original, STRUCTURES.fogueira.recipe);
    expect(original.madeira).toBe(10);
  });

  it('pagar exatamente o custo zera os ingredientes', () => {
    const depois = payCost(inv({ madeira: 8, pedra: 4 }), STRUCTURES.fogueira.recipe);
    expect(depois.madeira).toBe(0);
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

  it('ignora recurso ja colhido — ele nao atrapalha a construcao', () => {
    expect(checkPlacement(STRUCTURES.cerca, vec3(0, 0, 0), rico, [], [node(1.5, 0, true)])).toEqual(
      { ok: true },
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
    expect(formatRecipe(STRUCTURES.cerca.recipe, pt)).toBe('6 madeira');
    expect(formatRecipe(STRUCTURES.fogueira.recipe, pt)).toBe('8 madeira · 4 pedras');
  });

  it('concorda em numero — "1 pedra", "4 pedras"', () => {
    expect(formatRecipe({ pedra: 1 }, pt)).toBe('1 pedra');
    expect(formatRecipe({ pedra: 4 }, pt)).toBe('4 pedras');
    expect(formatRecipe({ fruta: 1 }, pt)).toBe('1 fruta');
    expect(formatRecipe({ fruta: 4 }, pt)).toBe('4 frutas');
  });

  it('madeira e invariavel', () => {
    expect(formatRecipe({ madeira: 1 }, pt)).toBe('1 madeira');
    expect(formatRecipe({ madeira: 8 }, pt)).toBe('8 madeira');
  });
});
