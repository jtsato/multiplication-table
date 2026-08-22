import { describe, expect, it } from 'vitest';
import {
  REGIONS,
  REGION_ORDER,
  isOnLand,
  neighbours,
  WORLD_BOUNDS,
  randomGroundPositionIn,
  regionAt,
  regionById,
  type RegionId,
} from './regions.logic';
import { HOME } from '../home/home.logic';
import { createRng } from '../../shared/rng';
import { vec3 } from '../../shared/vec';

const distanciaXZ = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z);

describe('as nove ilhas', () => {
  it('sao nove, uma por tabuada, na ordem didatica', () => {
    expect(REGION_ORDER).toEqual([
      'praia',
      'porto',
      'bosque',
      'cachoeira',
      'pomar',
      'pico',
      'vale',
      'montanha',
      'observatorio',
    ]);
    expect(REGIONS).toHaveLength(9);
    expect(REGIONS.map((r) => r.id)).toEqual(REGION_ORDER);
    expect(REGIONS.map((r) => r.tables)).toEqual([[2], [3], [4], [5], [6], [7], [8], [9], [10]]);
  });

  it('cobre as tabuadas de 2 a 10, sem buraco e sem repetir', () => {
    const todas = REGIONS.flatMap((r) => r.tables);
    expect([...todas].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('toda regiao tem nome, tabuada e tamanho', () => {
    for (const regiao of REGIONS) {
      expect(regiao.nome.length).toBeGreaterThan(0);
      expect(regiao.tables.length).toBeGreaterThan(0);
      expect(regiao.radius).toBeGreaterThan(0);
    }
  });

  it('a praia e onde o jogo comeca: contem a origem e a casa inteira', () => {
    // Sem isto o jogador nasce na agua ou a casa fica meio dentro, meio fora.
    expect(regionAt(vec3(0, 0, 0))?.id).toBe('praia');

    const cantoMaisLonge = Math.hypot(HOME.halfWidth, HOME.halfDepth);
    const praia = regionById('praia');
    expect(distanciaXZ(HOME.position, praia.center) + cantoMaisLonge).toBeLessThan(praia.radius);
  });
});

describe('regionAt', () => {
  it('reconhece o centro de cada regiao', () => {
    for (const regiao of REGIONS) {
      expect(regionAt(regiao.center)?.id).toBe(regiao.id);
    }
  });

  it('devolve null na agua', () => {
    // Bem longe de tudo, e tambem no vao entre duas vizinhas.
    expect(regionAt(vec3(500, 0, 500))).toBeNull();

    const praia = regionById('praia');
    const porto = regionById('porto');
    const meio = vec3(
      (praia.center.x + porto.center.x) / 2,
      0,
      (praia.center.z + porto.center.z) / 2,
    );
    expect(regionAt(meio)).toBeNull();
  });

  it('isOnLand concorda com regionAt', () => {
    expect(isOnLand(vec3(0, 0, 0))).toBe(true);
    expect(isOnLand(vec3(500, 0, 500))).toBe(false);
  });

  it('ignora a altura — o mundo e lido no plano', () => {
    expect(regionAt(vec3(0, 40, 0))?.id).toBe('praia');
  });
});

describe('a forma do arquipelago', () => {
  /**
   * Duas regioes sobrepostas dariam terreno dentro de terreno e um ponto
   * pertencendo a duas tabuadas ao mesmo tempo — `regionAt` teria que escolher e
   * a escolha seria arbitraria.
   */
  it('nenhuma regiao se sobrepoe a outra', () => {
    for (const a of REGIONS) {
      for (const b of REGIONS) {
        if (a.id === b.id) continue;
        expect(distanciaXZ(a.center, b.center)).toBeGreaterThan(a.radius + b.radius);
      }
    }
  });

  /**
   * O vao entre vizinhas e o que a ponte atravessa. Grande demais e a ponte fica
   * absurda; pequeno demais e da para pular a progressao contornando pela beira.
   */
  it('vizinhas ficam a um vao de ponte, e nao vizinhas ficam longe', () => {
    for (const regiao of REGIONS) {
      for (const vizinha of neighbours(regiao.id)) {
        const vao =
          distanciaXZ(regiao.center, regionById(vizinha).center) -
          regiao.radius -
          regionById(vizinha).radius;
        expect(vao).toBeGreaterThan(0);
        expect(vao).toBeLessThanOrEqual(12);
      }
    }

    for (const a of REGIONS) {
      for (const b of REGIONS) {
        if (a.id === b.id || neighbours(a.id).includes(b.id)) continue;
        const vao = distanciaXZ(a.center, b.center) - a.radius - b.radius;
        expect(vao).toBeGreaterThan(12);
      }
    }
  });

  /**
   * A cadeia tem que ser uma cadeia: cada regiao ligada a seguinte, e a
   * vizinhanca simetrica. Um erro de dados aqui isolaria uma regiao para sempre,
   * e o jogo so mostraria isso quando a crianca chegasse la.
   */
  it('a vizinhanca e simetrica e liga a cadeia inteira', () => {
    for (const regiao of REGIONS) {
      for (const vizinha of neighbours(regiao.id)) {
        expect(neighbours(vizinha)).toContain(regiao.id);
      }
    }

    const alcancadas = new Set<RegionId>(['praia']);
    const fila: RegionId[] = ['praia'];
    while (fila.length > 0) {
      for (const vizinha of neighbours(fila.pop()!)) {
        if (alcancadas.has(vizinha)) continue;
        alcancadas.add(vizinha);
        fila.push(vizinha);
      }
    }
    expect(alcancadas.size).toBe(REGIONS.length);
  });
});

describe('randomGroundPositionIn', () => {
  it('sorteia sempre dentro da regiao pedida', () => {
    const rng = createRng(7);
    for (const regiao of REGIONS) {
      for (let i = 0; i < 200; i += 1) {
        expect(regionAt(randomGroundPositionIn(regiao, rng))?.id).toBe(regiao.id);
      }
    }
  });

  it('respeita a margem da borda — nada nasce colado na agua', () => {
    const rng = createRng(11);
    for (const regiao of REGIONS) {
      for (let i = 0; i < 200; i += 1) {
        const ponto = randomGroundPositionIn(regiao, rng);
        expect(distanciaXZ(ponto, regiao.center)).toBeLessThan(regiao.radius);
      }
    }
  });

  it('espalha de verdade, em vez de amontoar no centro', () => {
    const rng = createRng(13);
    const praia = regionById('praia');
    const distancias = Array.from({ length: 400 }, () =>
      distanciaXZ(randomGroundPositionIn(praia, rng), praia.center),
    );
    // Sortear o raio direto concentraria tudo no meio; a distancia media de uma
    // distribuicao uniforme por area fica perto de 2/3 do raio.
    const media = distancias.reduce((a, b) => a + b, 0) / distancias.length;
    expect(media).toBeGreaterThan(praia.radius * 0.5);
  });

  it('e reprodutivel para a mesma semente', () => {
    const praia = regionById('praia');
    const a = randomGroundPositionIn(praia, createRng(3));
    const b = randomGroundPositionIn(praia, createRng(3));
    expect(a).toEqual(b);
  });
});

describe('WORLD_BOUNDS', () => {
  it('envolve todas as regioes, com folga nenhuma a mais que o necessario', () => {
    for (const regiao of REGIONS) {
      const ateABorda = distanciaXZ(regiao.center, WORLD_BOUNDS.center) + regiao.radius;
      expect(ateABorda).toBeLessThanOrEqual(WORLD_BOUNDS.radius + 1e-9);
    }
    // Encostado em pelo menos uma: senao o circulo esta maior do que precisa e a
    // camera de sombra desperdicia resolucao no vazio.
    const maisLonge = Math.max(
      ...REGIONS.map((r) => distanciaXZ(r.center, WORLD_BOUNDS.center) + r.radius),
    );
    expect(maisLonge).toBeCloseTo(WORLD_BOUNDS.radius);
  });
});
