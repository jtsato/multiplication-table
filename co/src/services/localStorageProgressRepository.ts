import { createDefaultGameState, migrateState } from '../domain/defaultState';
import type { GameState } from '../domain/types';
import type { ProgressRepository } from './progressRepository';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = 'blocky-tables:progress';

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(
    private readonly storage: StorageLike,
    private readonly key = STORAGE_KEY,
  ) {}

  async load(): Promise<GameState> {
    const raw = this.storage.getItem(this.key);
    if (!raw) return createDefaultGameState();
    try {
      return migrateState(JSON.parse(raw) as unknown);
    } catch {
      this.storage.removeItem(this.key);
      return createDefaultGameState();
    }
  }

  async save(state: GameState): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(state));
  }

  async reset(): Promise<void> {
    this.storage.removeItem(this.key);
  }
}
