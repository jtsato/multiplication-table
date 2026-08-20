import { REGIONS, WORLD_BOUNDS, type RegionId } from '../regions/regions.logic';
import { REGION_PALETTE } from '../../shared/palette';

/**
 * Navegação: minimapa.
 *
 * Projeção pura de coordenadas do mundo para o painel do minimapa. O painel é
 * quadrado e o arquipélago é circular, então uma escala única por `WORLD_BOUNDS`
 * enquadra tudo sem distorcer proporções.
 */

export interface MinimapPoint {
  x: number;
  y: number;
}

/** Projeta uma posição do mundo (x, z) no painel do minimapa. */
export function projectToMinimap(x: number, z: number, size: number): MinimapPoint {
  const scale = size / (2 * WORLD_BOUNDS.radius);
  return {
    x: (x - WORLD_BOUNDS.center.x) * scale + size / 2,
    y: (z - WORLD_BOUNDS.center.z) * scale + size / 2,
  };
}

export interface MinimapRegion {
  id: RegionId;
  x: number;
  y: number;
  color: string;
}

/** Marcadores das seis regiões no minimapa. */
export function minimapRegions(size: number): MinimapRegion[] {
  return REGIONS.map((regiao) => {
    const ponto = projectToMinimap(regiao.center.x, regiao.center.z, size);
    return {
      id: regiao.id,
      x: ponto.x,
      y: ponto.y,
      color: REGION_PALETTE[regiao.id].ground,
    };
  });
}
