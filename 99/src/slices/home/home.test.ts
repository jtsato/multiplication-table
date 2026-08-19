import { describe, expect, it } from 'vitest';
import { SHOP_ITEMS } from '../economy/economy.logic';
import { REGIONS } from '../regions/regions.logic';
import { createRng } from '../../shared/rng';
import { vec3 } from '../../shared/vec';
import { RESOURCES, createNodes } from '../resources/resources.logic';
import { isWithinIsland, ISLAND } from '../world/world.logic';
import {
  HOME,
  HOME_SPOTS,
  HOME_SPOT_OFFSETS,
  HOME_DECORATION_KINDS,
  HOME_DECORATION_OFFSETS,
  blocksHome,
  isInHomeLight,
  isInsideHome,
  nearestSpot,
} from './home.logic';

describe('a casa', () => {
  it('esta dentro da ilha, com folga para as paredes', () => {
    const maiorLado = Math.max(HOME.halfWidth, HOME.halfDepth);
    expect(isWithinIsland(HOME.position, maiorLado)).toBe(true);
  });

  it('nao nasce em cima do ponto onde o jogador aparece', () => {
    expect(isInsideHome(vec3(0, 0, 0))).toBe(false);
  });

  it('bloqueia os proprios cantos contra a geracao de recursos', () => {
    const cantos = [
      vec3(HOME.position.x - HOME.halfWidth, 0, HOME.position.z - HOME.halfDepth),
      vec3(HOME.position.x + HOME.halfWidth, 0, HOME.position.z - HOME.halfDepth),
      vec3(HOME.position.x - HOME.halfWidth, 0, HOME.position.z + HOME.halfDepth),
      vec3(HOME.position.x + HOME.halfWidth, 0, HOME.position.z + HOME.halfDepth),
    ];

    for (const canto of cantos) {
      expect(blocksHome(canto)).toBe(true);
    }
  });

  it('a folga vai alem das paredes, mas nao toma a ilha inteira', () => {
    expect(blocksHome(vec3(HOME.position.x, 0, HOME.position.z - HOME.halfDepth - 1))).toBe(true);
    expect(blocksHome(vec3(0, 0, 0))).toBe(false);
    expect(blocksHome(vec3(ISLAND.radius - 5, 0, 0))).toBe(false);
  });
});

describe('isInsideHome', () => {
  it('reconhece o centro da casa', () => {
    expect(isInsideHome(HOME.position)).toBe(true);
  });

  it('recusa um ponto fora das paredes', () => {
    expect(isInsideHome(vec3(HOME.position.x + HOME.halfWidth + 1, 0, HOME.position.z))).toBe(
      false,
    );
    expect(isInsideHome(vec3(HOME.position.x, 0, HOME.position.z + HOME.halfDepth + 1))).toBe(
      false,
    );
  });

  it('e retangular, e nao circular — o canto conta como dentro', () => {
    const canto = vec3(
      HOME.position.x + HOME.halfWidth - 0.1,
      0,
      HOME.position.z + HOME.halfDepth - 0.1,
    );
    expect(isInsideHome(canto)).toBe(true);
  });
});

describe('isInHomeLight', () => {
  it('a luz alcanca mais longe que as paredes — a varanda tambem abriga', () => {
    expect(HOME.lightRadius).toBeGreaterThan(Math.max(HOME.halfWidth, HOME.halfDepth));
  });

  it('cobre a casa inteira', () => {
    expect(isInHomeLight(HOME.position)).toBe(true);
    expect(
      isInHomeLight(vec3(HOME.position.x + HOME.halfWidth, 0, HOME.position.z + HOME.halfDepth)),
    ).toBe(true);
  });

  it('nao alcanca o outro lado da ilha', () => {
    expect(isInHomeLight(vec3(ISLAND.radius - 1, 0, 0))).toBe(false);
  });
});

describe('nearestSpot', () => {
  it('reconhece cada movel quando o jogador esta em cima dele', () => {
    for (const [spot, position] of Object.entries(HOME_SPOTS)) {
      expect(nearestSpot(position)).toBe(spot);
    }
  });

  it('nao responde no meio da sala, longe de tudo', () => {
    expect(nearestSpot(HOME.position)).toBeNull();
  });

  it('nao responde de fora da casa, mesmo colado na parede', () => {
    const foraDaParede = vec3(HOME_SPOTS.espelho.x, 0, HOME.position.z - HOME.halfDepth - 0.3);
    expect(nearestSpot(foraDaParede)).toBeNull();
  });

  it('os moveis estao afastados o bastante para nunca haver duvida', () => {
    const posicoes = Object.values(HOME_SPOTS);
    for (let i = 0; i < posicoes.length; i += 1) {
      for (let j = i + 1; j < posicoes.length; j += 1) {
        const distancia = Math.hypot(posicoes[i].x - posicoes[j].x, posicoes[i].z - posicoes[j].z);
        expect(distancia).toBeGreaterThan(HOME.spotRange * 2);
      }
    }
  });
});

describe('geracao de recursos com a casa de pe', () => {
  it('nenhum no nasce dentro da casa', () => {
    const nodes = createNodes(createRng(20260816));

    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      expect(isInsideHome(node.position), `${node.id} nasceu dentro da casa`).toBe(false);
    }
  });

  it('a casa nao engole tantos pontos a ponto de faltar recurso', () => {
    const nodes = createNodes(createRng(20260816));
    expect(nodes.length).toBeGreaterThanOrEqual(RESOURCES.nodesPerRegion * REGIONS.length - 2);
  });
});

describe('coordenadas dos moveis', () => {
  /**
   * A cena desenha os moveis dentro de um grupo que ja desloca para a casa. Usar
   * as coordenadas absolutas la somava a posicao da casa duas vezes, e os
   * moveis apareceram no gramado do lado de fora — visivel so na tela gravada.
   */
  it('o deslocamento relativo mais a casa da a posicao absoluta', () => {
    for (const spot of ['espelho', 'mural', 'cama'] as const) {
      expect(HOME_SPOTS[spot].x).toBeCloseTo(HOME.position.x + HOME_SPOT_OFFSETS[spot].x);
      expect(HOME_SPOTS[spot].z).toBeCloseTo(HOME.position.z + HOME_SPOT_OFFSETS[spot].z);
    }
  });

  it('todos os moveis ficam dentro das paredes', () => {
    for (const posicao of Object.values(HOME_SPOTS)) {
      expect(isInsideHome(posicao)).toBe(true);
    }
  });
});

describe('decoracoes da casa', () => {
  /**
   * A lista visual mora em `home/` e o catalogo em `economy/`, de proposito.
   * Este teste e a ponte entre os dois: se alguem acrescentar uma peca a loja
   * sem desenhar na casa, ou desenhar uma peca que a loja nao vende, quebra.
   */
  it('todo item de categoria casa da loja tem visual na casa, e so ele', () => {
    const casa = Object.values(SHOP_ITEMS)
      .filter((item) => item.category === 'casa')
      .map((item) => item.kind)
      .sort();

    expect([...HOME_DECORATION_KINDS].sort()).toEqual(casa);
  });

  it('nenhuma decoracao fica fora das paredes', () => {
    for (const [kind, offset] of Object.entries(HOME_DECORATION_OFFSETS)) {
      const absoluto = vec3(HOME.position.x + offset.x, 0, HOME.position.z + offset.z);
      expect(isInsideHome(absoluto), `${kind} ficou fora da casa`).toBe(true);
    }
  });

  it('as decoracoes de piso nao nascem em cima dos moveis interativos', () => {
    // Ignora lustre e prateleira: pendem do teto / ficam na parede, em outra
    // altura, e nao disputam o chao com espelho, mural e cama.
    const dePiso = ['tapete', 'aquario', 'vaso', 'escultura'] as const;
    const moveis = Object.values(HOME_SPOT_OFFSETS);

    for (const kind of dePiso) {
      const offset = HOME_DECORATION_OFFSETS[kind];
      for (const movel of moveis) {
        const distancia = Math.hypot(offset.x - movel.x, offset.z - movel.z);
        expect(distancia, `${kind} colado em um movel`).toBeGreaterThan(0.9);
      }
    }
  });
});
