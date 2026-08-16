import type { GameState } from '../domain/types';

export interface ProgressRepository {
  load(): Promise<GameState>;
  save(state: GameState): Promise<void>;
  reset(): Promise<void>;
}
