import { createDefaultState, normalizeState } from './schema';
import type { ProgressRepository } from './ProgressRepository';
import type { GameState } from '../domain/types';

/** Usado em testes e como fallback quando localStorage não está disponível. */
export class InMemoryProgressRepository implements ProgressRepository {
  private state: GameState;

  constructor(initial?: GameState) {
    this.state = initial ?? createDefaultState();
  }

  async load(): Promise<GameState> {
    return normalizeState(this.state);
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }

  async clear(): Promise<void> {
    this.state = createDefaultState(this.state.settings.locale);
  }
}
