import { describe, expect, it } from 'vitest';
import { ISLAND, isWithinIsland, randomGroundPosition, scatterPositions } from './world.logic';
import { createRng } from '../../shared/rng';
import { vec3 } from '../../shared/vec';

describe('isWithinIsland', () => {
  it('aceita o centro e rejeita um ponto muito alem da borda', () => {
    expect(isWithinIsland(vec3(0, 0, 0))).toBe(true);
    expect(isWithinIsland(vec3(ISLAND.radius + 5, 0, 0))).toBe(false);
  });

  it('trata a borda exata como dentro', () => {
    expect(isWithinIsland(vec3(ISLAND.radius, 0, 0))).toBe(true);
  });

  it('aplica a margem pedida', () => {
    const almostEdge = vec3(ISLAND.radius - 1, 0, 0);
    expect(isWithinIsland(almostEdge)).toBe(true);
    expect(isWithinIsland(almostEdge, 3)).toBe(false);
  });

  it('ignora a altura — o limite e o disco XZ', () => {
    expect(isWithinIsland(vec3(0, 100, 0))).toBe(true);
  });

  it('rejeita tudo quando a margem consome o raio inteiro', () => {
    expect(isWithinIsland(vec3(0, 0, 0), ISLAND.radius)).toBe(false);
  });
});

describe('randomGroundPosition', () => {
  it('sorteia sempre fora da area de spawn e dentro da margem da borda', () => {
    const rng = createRng(2024);
    for (let i = 0; i < 400; i += 1) {
      const p = randomGroundPosition(rng);
      const radius = Math.hypot(p.x, p.z);
      expect(radius).toBeGreaterThanOrEqual(ISLAND.spawnClearance - 1e-9);
      expect(radius).toBeLessThanOrEqual(ISLAND.radius - ISLAND.edgeMargin + 1e-9);
      expect(p.y).toBe(ISLAND.groundY);
    }
  });

  it('e deterministico para a mesma semente', () => {
    expect(randomGroundPosition(createRng(7))).toEqual(randomGroundPosition(createRng(7)));
  });
});

describe('scatterPositions', () => {
  it('respeita o espacamento minimo entre todos os pares', () => {
    const positions = scatterPositions(createRng(1), 20, 5);
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        expect(
          Math.hypot(positions[i].x - positions[j].x, positions[i].z - positions[j].z),
        ).toBeGreaterThanOrEqual(5 - 1e-9);
      }
    }
  });

  it('nunca devolve mais do que o pedido', () => {
    expect(scatterPositions(createRng(3), 12, 4).length).toBeLessThanOrEqual(12);
  });

  it('entrega a quantidade pedida quando ha espaco de sobra', () => {
    expect(scatterPositions(createRng(5), 8, 2)).toHaveLength(8);
  });

  it('termina em vez de travar quando o espacamento e impossivel', () => {
    // Espacamento maior que a ilha inteira: cabe no maximo um ponto.
    const positions = scatterPositions(createRng(9), 50, ISLAND.radius * 4);
    expect(positions.length).toBeLessThanOrEqual(1);
  });

  it('mantem todos os pontos dentro da ilha', () => {
    for (const p of scatterPositions(createRng(11), 25, 3)) {
      expect(isWithinIsland(p, ISLAND.edgeMargin - 1e-6)).toBe(true);
    }
  });
});
