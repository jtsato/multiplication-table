import { describe, expect, it } from 'vitest';
import { minimapRegions, projectToMinimap } from './navigation.logic';
import { WORLD_BOUNDS } from '../regions/regions.logic';

describe('navigation.logic', () => {
  it('projeta o centro do mundo no centro do painel', () => {
    const ponto = projectToMinimap(WORLD_BOUNDS.center.x, WORLD_BOUNDS.center.z, 200);
    expect(ponto.x).toBeCloseTo(100);
    expect(ponto.y).toBeCloseTo(100);
  });

  it('coloca as 9 regiões dentro do painel', () => {
    const regioes = minimapRegions(200);
    expect(regioes).toHaveLength(9);
    for (const regiao of regioes) {
      expect(regiao.x).toBeGreaterThanOrEqual(0);
      expect(regiao.x).toBeLessThanOrEqual(200);
      expect(regiao.y).toBeGreaterThanOrEqual(0);
      expect(regiao.y).toBeLessThanOrEqual(200);
    }
  });
});
