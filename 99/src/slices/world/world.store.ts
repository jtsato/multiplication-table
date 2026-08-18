import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';

/**
 * Semente do mundo. Toda distribuicao aleatoria (cenario, recursos) deriva
 * dela, entao reiniciar com a mesma semente recria a mesma ilha — util para
 * depurar e para testar.
 */
export const DEFAULT_WORLD_SEED = 20260816;

export interface WorldSlice {
  worldSeed: number;
}

export const createWorldSlice: StateCreator<GameState, [], [], WorldSlice> = () => ({
  worldSeed: DEFAULT_WORLD_SEED,
});
