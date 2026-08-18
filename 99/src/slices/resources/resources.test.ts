import { describe, expect, it } from 'vitest';
import {
  RESOURCES,
  RESOURCE_KINDS,
  addToInventory,
  createNodes,
  emptyInventory,
  fullYield,
  isNodeReady,
  itemPlacements,
  nearestNodeInRange,
  type ResourceNode,
} from './resources.logic';
import { createRng } from '../../shared/rng';
import { isWithinIsland } from '../world/world.logic';
import { vec3 } from '../../shared/vec';

const node = (id: string, x: number, z: number, depleted = false): ResourceNode => ({
  id,
  kind: 'madeira',
  position: vec3(x, 0, z),
  groups: 3,
  perGroup: 2,
  depleted,
});

/** As dez tabuadas que o jogo passa a cobrir. */
const TABUADAS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

describe('createNodes', () => {
  it('gera a quantidade pedida de cada tipo', () => {
    const nodes = createNodes(createRng(2026));
    for (const kind of RESOURCE_KINDS) {
      expect(nodes.filter((n) => n.kind === kind)).toHaveLength(RESOURCES.nodesPerKind);
    }
  });

  it('mantem todos os nos dentro da ilha', () => {
    for (const n of createNodes(createRng(5))) {
      expect(isWithinIsland(n.position)).toBe(true);
    }
  });

  it('respeita o espacamento minimo entre todos os nos', () => {
    const nodes = createNodes(createRng(8));
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[i].position.x - nodes[j].position.x;
        const dz = nodes[i].position.z - nodes[j].position.z;
        expect(Math.hypot(dx, dz)).toBeGreaterThanOrEqual(RESOURCES.minSpacing - 1e-9);
      }
    }
  });

  it('gera ids unicos', () => {
    const nodes = createNodes(createRng(13));
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
  });

  it('mantem os grupos entre 1 e 10 — a tabuada do 2 inteira', () => {
    for (const n of createNodes(createRng(21))) {
      expect(n.groups).toBeGreaterThanOrEqual(1);
      expect(n.groups).toBeLessThanOrEqual(10);
    }
  });

  it('e deterministico para a mesma semente', () => {
    expect(createNodes(createRng(77))).toEqual(createNodes(createRng(77)));
  });

  it('nasce com todos os nos disponiveis', () => {
    for (const n of createNodes(createRng(3))) {
      expect(isNodeReady(n)).toBe(true);
    }
  });
});

describe('isNodeReady', () => {
  it('segue o estado de esgotamento do no', () => {
    expect(isNodeReady(node('a', 0, 0, false))).toBe(true);
    expect(isNodeReady(node('a', 0, 0, true))).toBe(false);
  });
});

describe('nearestNodeInRange', () => {
  const player = vec3(0, 0, 0);

  it('devolve null quando nao ha nenhum no', () => {
    expect(nearestNodeInRange(player, [])).toBeNull();
  });

  it('escolhe o no mais proximo', () => {
    const nodes = [node('longe', 3, 0), node('perto', 1, 0), node('medio', 2, 0)];
    expect(nearestNodeInRange(player, nodes)?.id).toBe('perto');
  });

  it('devolve null quando todos estao fora do alcance', () => {
    expect(nearestNodeInRange(player, [node('a', 50, 0)])).toBeNull();
  });

  it('aceita um no exatamente na borda do alcance', () => {
    const naBorda = node('borda', RESOURCES.interactRange, 0);
    expect(nearestNodeInRange(player, [naBorda])?.id).toBe('borda');
  });

  it('rejeita logo depois da borda', () => {
    const foraPorPouco = node('fora', RESOURCES.interactRange + 0.01, 0);
    expect(nearestNodeInRange(player, [foraPorPouco])).toBeNull();
  });

  it('ignora nos esgotados mesmo se forem os mais proximos', () => {
    const nodes = [node('esgotado', 0.5, 0, true), node('disponivel', 2, 0)];
    expect(nearestNodeInRange(player, nodes)?.id).toBe('disponivel');
  });

  it('resolve empate de forma estavel — o realce nao pode piscar', () => {
    const nodes = [node('primeiro', 2, 0), node('segundo', -2, 0)];
    expect(nearestNodeInRange(player, nodes)?.id).toBe('primeiro');
    // Mesma entrada, mesma resposta, sempre.
    expect(nearestNodeInRange(player, nodes)?.id).toBe('primeiro');
  });

  it('ignora a altura — so a distancia no plano importa', () => {
    const noAlto = { ...node('alto', 1, 0), position: vec3(1, 100, 0) };
    expect(nearestNodeInRange(player, [noAlto])?.id).toBe('alto');
  });
});

describe('itemPlacements — contrato visual do desafio', () => {
  /**
   * O teste que faltava.
   *
   * A versao anterior fixava `perGroup` em 2 e por isso nunca provou nada: o
   * contrato visual valia por acidente, porque so existia uma tabuada. Com a
   * tabuada saindo da regiao, ele precisa valer para as dez.
   */
  it('mostra exatamente grupos x perGroup itens, em qualquer tabuada', () => {
    for (const perGroup of TABUADAS) {
      for (let groups = 1; groups <= 10; groups += 1) {
        const placements = itemPlacements({ ...node('a', 0, 0), groups, perGroup });
        expect(placements).toHaveLength(groups * perGroup);
      }
    }
  });

  it('coloca exatamente perGroup itens em cada grupo, em qualquer tabuada', () => {
    for (const perGroup of TABUADAS) {
      const placements = itemPlacements({ ...node('a', 0, 0), groups: 7, perGroup });
      for (let groupIndex = 0; groupIndex < 7; groupIndex += 1) {
        expect(placements.filter((p) => p.groupIndex === groupIndex)).toHaveLength(perGroup);
      }
    }
  });

  /**
   * Com dez itens num grupo so, o arranjo antigo — dois itens lado a lado — nao
   * serve mais. Contar na tela e a regra que sustenta o jogo, entao itens
   * empilhados invisiveis quebrariam o contrato tanto quanto um numero errado.
   */
  it('nunca sobrepoe itens do mesmo grupo, nem com a tabuada do 10', () => {
    for (const perGroup of TABUADAS) {
      const placements = itemPlacements({ ...node('a', 0, 0), groups: 10, perGroup });
      const chaves = placements.map(
        (p) => `${p.position.x.toFixed(3)}|${p.position.y.toFixed(3)}|${p.position.z.toFixed(3)}`,
      );
      expect(new Set(chaves).size).toBe(placements.length);
    }
  });

  it('bate com fullYield — o que se conta na tela e o que se recebe', () => {
    for (let groups = 1; groups <= 10; groups += 1) {
      const target = { ...node('a', 0, 0), groups };
      expect(itemPlacements(target)).toHaveLength(fullYield(target));
    }
  });

  it('nunca sobrepoe dois itens na mesma posicao', () => {
    const placements = itemPlacements({ ...node('a', 0, 0), groups: 10 });
    const chaves = placements.map((p) => `${p.position.x.toFixed(4)}|${p.position.z.toFixed(4)}`);
    expect(new Set(chaves).size).toBe(placements.length);
  });

  it('posiciona os itens em volta do no, acima do chao', () => {
    const alvo = { ...node('a', 5, -3), groups: 6 };
    for (const p of itemPlacements(alvo)) {
      expect(p.position.y).toBeGreaterThan(alvo.position.y);
      // Dentro de um raio pequeno em volta do centro do no.
      expect(
        Math.hypot(p.position.x - alvo.position.x, p.position.z - alvo.position.z),
      ).toBeLessThan(1.2);
    }
  });

  it('acompanha a posicao do no no mundo', () => {
    const naOrigem = itemPlacements({ ...node('a', 0, 0), groups: 3 });
    const deslocado = itemPlacements({ ...node('a', 10, 4), groups: 3 });
    for (let i = 0; i < naOrigem.length; i += 1) {
      expect(deslocado[i].position.x).toBeCloseTo(naOrigem[i].position.x + 10);
      expect(deslocado[i].position.z).toBeCloseTo(naOrigem[i].position.z + 4);
    }
  });
});

describe('fullYield', () => {
  it('multiplica os grupos pelos itens por grupo', () => {
    for (const perGroup of TABUADAS) {
      expect(fullYield({ ...node('a', 0, 0), groups: 4, perGroup })).toBe(4 * perGroup);
    }
  });
});

describe('addToInventory', () => {
  it('soma no tipo certo sem tocar nos demais', () => {
    const result = addToInventory(emptyInventory(), 'madeira', 6);
    expect(result.madeira).toBe(6);
    expect(result.fruta).toBe(0);
    expect(result.pedra).toBe(0);
  });

  it('acumula em chamadas sucessivas', () => {
    let inv = emptyInventory();
    inv = addToInventory(inv, 'pedra', 2);
    inv = addToInventory(inv, 'pedra', 3);
    expect(inv.pedra).toBe(5);
  });

  it('nao muta o inventario original', () => {
    const original = emptyInventory();
    addToInventory(original, 'fruta', 5);
    expect(original.fruta).toBe(0);
  });

  it('trata quantidade negativa como zero', () => {
    expect(addToInventory(emptyInventory(), 'madeira', -10).madeira).toBe(0);
  });

  it('arredonda para baixo quantidades fracionarias', () => {
    expect(addToInventory(emptyInventory(), 'fruta', 3.9).fruta).toBe(3);
  });
});
