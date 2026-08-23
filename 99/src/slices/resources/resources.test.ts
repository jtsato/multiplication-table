import { describe, expect, it } from 'vitest';
import {
  RESOURCES,
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
import { REGIONS, regionAt, regionById } from '../regions/regions.logic';
import { BASE_RADIUS, RESOURCE_KINDS, RESOURCE_LABELS } from './resources.logic';
import { blocksHome } from '../home/home.logic';
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
  it('gera a quantidade pedida por regiao', () => {
    const nodes = createNodes(createRng(2026));
    for (const regiao of REGIONS) {
      const daRegiao = nodes.filter((n) => regionAt(n.position)?.id === regiao.id);
      expect(daRegiao).toHaveLength(RESOURCES.nodesPerRegion);
    }
  });

  it('mantem todos os nos em terra firme — nenhum na agua', () => {
    for (const n of createNodes(createRng(5))) {
      expect(regionAt(n.position)).not.toBeNull();
    }
  });

  /**
   * O coracao da fase: a tabuada de um no e a da regiao onde ele esta. Sem isto
   * o jogo inteiro continua preso no 2, por mais mundo que exista.
   */
  it('tira a tabuada do no da regiao onde ele nasceu', () => {
    for (const n of createNodes(createRng(31))) {
      const regiao = regionAt(n.position)!;
      expect(regiao.tables).toContain(n.perGroup);
    }
  });

  /**
   * Uma tabuada sem nenhum no no mundo e um acessorio inalcancavel de novo — o
   * defeito exato que esta fase existe para consertar. Vale para toda semente,
   * e nao so para uma de sorte.
   */
  it('nenhuma tabuada de 2 a 10 fica sem no, em nenhuma semente', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const vistas = new Set(createNodes(createRng(seed)).map((n) => n.perGroup));
      expect([...vistas].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });

  it('toda regiao com duas tabuadas oferece as duas', () => {
    const nodes = createNodes(createRng(44));
    for (const regiao of REGIONS.filter((r) => r.tables.length > 1)) {
      const oferecidas = new Set(
        nodes.filter((n) => regionAt(n.position)?.id === regiao.id).map((n) => n.perGroup),
      );
      expect([...oferecidas].sort((a, b) => a - b)).toEqual(
        [...regiao.tables].sort((a, b) => a - b),
      );
    }
  });

  it('nenhum no nasce dentro da casa', () => {
    const praia = regionById('praia');
    expect(praia.id).toBe('praia');
    for (const n of createNodes(createRng(9))) {
      expect(blocksHome(n.position)).toBe(false);
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

  it('mantem os grupos entre 1 e 10 — a tabuada inteira, seja qual for', () => {
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

  /**
   * Grupos que nao se encostam.
   *
   * O teste vizinho compara posicoes identicas, e por isso nunca pegou nada: com
   * deslocamentos diferentes, dois itens praticamente nunca caem no mesmo ponto
   * exato — eles so ficam **visualmente** em cima uns dos outros. Foi olhando um
   * arbusto do Porto na tela que apareceu: com a tabuada do 10 e dez grupos, a
   * largura de um grupo era 1.04 e o espaco entre grupos, 0.38.
   *
   * Contar na tela e a regra que sustenta o jogo. Se os grupos se fundem, o
   * enunciado vira promessa que a cena nao cumpre.
   */
  it('mantem os grupos separados o bastante para serem contados', () => {
    for (const perGroup of TABUADAS) {
      for (const groups of [2, 5, 8, 10]) {
        const placements = itemPlacements({ ...node('a', 0, 0), groups, perGroup });
        for (const a of placements) {
          for (const b of placements) {
            if (a.groupIndex === b.groupIndex) continue;
            const distancia = Math.hypot(
              a.position.x - b.position.x,
              a.position.y - b.position.y,
              a.position.z - b.position.z,
            );
            expect(distancia).toBeGreaterThanOrEqual(0.2);
          }
        }
      }
    }
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

describe('as colheitas das regioes', () => {
  it('toda regiao colhe pelo menos um tipo, e todos existem', () => {
    for (const regiao of REGIONS) {
      expect(regiao.harvest.length).toBeGreaterThan(0);
      for (const kind of regiao.harvest) {
        expect(RESOURCE_KINDS).toContain(kind);
      }
    }
  });

  /**
   * O inventario tem que virar registro de onde a crianca esteve. Um tipo que
   * nasce em toda regiao nao conta historia nenhuma, e um tipo que nao nasce em
   * lugar nenhum e conteudo morto.
   */
  it('todo deposito permanente nasce em alguma regiao', () => {
    const depositos = new Set(REGIONS.flatMap((r) => r.deposits));
    for (const kind of new Set(REGIONS.flatMap((region) => region.deposits))) {
      expect(depositos, `${kind} nao nasce em regiao nenhuma`).toContain(kind);
    }
  });

  it('cada regiao oferece colheita e os recursos de regiao sao exclusivos', () => {
    // Três materiais (madeira, fruta, pedra) aparecem em mais de uma regiao por
    // design; os seis recursos de regiao (concha, peixe, cogumelo, cristal, mel,
    // gelo) são exclusivos de uma única ilha.
    const materiais = new Set(['madeira', 'fruta', 'pedra'] as const);
    for (const regiao of REGIONS) {
      expect(regiao.harvest.length).toBeGreaterThan(0);
      const exclusivas = regiao.harvest.filter((kind) => !materiais.has(kind as never));
      if (exclusivas.length === 0) {
        expect(regiao.harvest.some((kind) => materiais.has(kind as never))).toBe(true);
      }
    }
    for (const kind of ['concha', 'peixe', 'cogumelo', 'cristal', 'mel', 'gelo'] as const) {
      const donas = REGIONS.filter((r) => r.harvest.includes(kind));
      expect(donas.length, `${kind} deveria ser exclusivo de uma regiao`).toBeGreaterThanOrEqual(1);
    }
  });

  it('o tipo de um no e um dos depositos da regiao onde ele nasceu', () => {
    for (const n of createNodes(createRng(55))) {
      expect(regionAt(n.position)!.deposits).toContain(n.kind);
    }
  });

  it('a ilha comeca sem vegetacao: nada de madeira ou fruta espalhada', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      for (const n of createNodes(createRng(seed))) {
        expect(['madeira', 'fruta']).not.toContain(n.kind);
      }
    }
  });

  it('a Praia oferece pedra desde o inicio, para a primeira fogueira', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const praia = createNodes(createRng(seed)).filter(
        (n) => regionAt(n.position)?.id === 'praia',
      );
      expect(praia.some((n) => n.kind === 'pedra'), `semente ${seed}`).toBe(true);
    }
  });

  it('toda regiao oferece todos os seus depositos', () => {
    const nodes = createNodes(createRng(66));
    for (const regiao of REGIONS) {
      const oferecidos = new Set(
        nodes.filter((n) => regionAt(n.position)?.id === regiao.id).map((n) => n.kind),
      );
      expect([...oferecidos].sort()).toEqual([...new Set(regiao.deposits)].sort());
    }
  });

  it('todo tipo tem rotulo de singular e plural', () => {
    for (const kind of RESOURCE_KINDS) {
      expect(RESOURCE_LABELS[kind].one.length).toBeGreaterThan(0);
      expect(RESOURCE_LABELS[kind].many.length).toBeGreaterThan(0);
    }
  });
});

describe('os itens nunca somem dentro da base', () => {
  /**
   * Apareceu numa captura do Pomar: os nos de mel estavam pelados, sem nada para
   * contar. Com poucos grupos o anel ficava no raio minimo de 0,62 enquanto a
   * moita tinha 0,85 — os itens nasciam **dentro** da base e a cena deixava de
   * cumprir o que o enunciado prometia.
   */
  it('todo item fica por fora da base do proprio no, em qualquer tabuada', () => {
    for (const kind of RESOURCE_KINDS) {
      for (const perGroup of TABUADAS) {
        for (let groups = 1; groups <= 10; groups += 1) {
          const alvo = { ...node('a', 0, 0), kind, groups, perGroup };
          for (const p of itemPlacements(alvo)) {
            const distancia = Math.hypot(p.position.x, p.position.z);
            expect(distancia, `${kind} groups=${groups} perGroup=${perGroup}`).toBeGreaterThan(
              BASE_RADIUS[kind],
            );
          }
        }
      }
    }
  });
});

describe('itens de chão não flutuam', () => {
  it('concha e pedra ficam rentes ao chão em qualquer tabuada', () => {
    for (const kind of ['concha', 'pedra'] as const) {
      for (const perGroup of TABUADAS) {
        for (let groups = 1; groups <= 10; groups += 1) {
          const alvo = { ...node('a', 0, 0), kind, groups, perGroup };
          for (const p of itemPlacements(alvo)) {
            expect(p.position.y, `${kind} groups=${groups} perGroup=${perGroup}`).toBeLessThan(0.5);
          }
        }
      }
    }
  });

  it('itens de galho continuam acima do chão', () => {
    const alvo = { ...node('a', 0, 0), kind: 'madeira' as const, groups: 3, perGroup: 2 };
    for (const p of itemPlacements(alvo)) {
      expect(p.position.y).toBeGreaterThan(1);
    }
  });
});
