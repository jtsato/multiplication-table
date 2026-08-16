import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { createRng } from '../../shared/rng';
import type { Vec3 } from '../../shared/vec';
import { DEFAULT_WORLD_SEED } from '../world/world.store';
import { ENEMIES, spawnPointsFor, type Outcome } from './enemies.logic';

export interface EnemySpawn {
  id: string;
  position: Vec3;
}

export interface EnemiesSlice {
  health: number;
  /** Ponto de surgimento de cada inimigo da noite. A posicao viva fica no view. */
  enemies: EnemySpawn[];
  outcome: Outcome;
  /** Ja houve pelo menos uma noite nesta partida? Condicao da vitoria. */
  survivedNight: boolean;
  spawnNightEnemies: () => void;
  clearEnemies: () => void;
  setHealth: (health: number) => void;
  setOutcome: (outcome: Outcome) => void;
  markNightSurvived: () => void;
  resetSurvival: () => void;
}

let nextEnemyId = 0;

export const createEnemiesSlice: StateCreator<GameState, [], [], EnemiesSlice> = (set) => {
  const rng = createRng(DEFAULT_WORLD_SEED ^ 0x9e37);

  return {
    health: ENEMIES.maxHealth,
    enemies: [],
    outcome: 'jogando',
    survivedNight: false,

    spawnNightEnemies: () =>
      set((state) => {
        // Uma leva por noite: sem esta guarda, a virada de fase publicada mais de
        // uma vez encheria a ilha de inimigos.
        if (state.enemies.length > 0) return state;

        const points = spawnPointsFor('noite', rng);
        return {
          enemies: points.map((position) => {
            nextEnemyId += 1;
            return { id: `inimigo-${nextEnemyId}`, position };
          }),
          survivedNight: true,
        };
      }),

    clearEnemies: () => set((state) => (state.enemies.length === 0 ? state : { enemies: [] })),

    setHealth: (health) =>
      set((state) => (state.health === health ? state : { health: Math.max(0, health) })),

    setOutcome: (outcome) => set((state) => (state.outcome === outcome ? state : { outcome })),

    markNightSurvived: () => set({ survivedNight: true }),

    resetSurvival: () =>
      set({
        health: ENEMIES.maxHealth,
        enemies: [],
        outcome: 'jogando',
        survivedNight: false,
      }),
  };
};
