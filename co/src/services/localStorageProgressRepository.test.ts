import { createDefaultGameState } from '../domain/defaultState';
import { LocalStorageProgressRepository, type StorageLike } from './localStorageProgressRepository';

class MemoryStorage implements StorageLike {
  private readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

describe('LocalStorageProgressRepository', () => {
  it('returns a safe initial state when no save exists', async () => {
    const repository = new LocalStorageProgressRepository(new MemoryStorage());
    const state = await repository.load();
    expect(state.schemaVersion).toBe(1);
    expect(state.progress.tables['2'].status).toBe('available');
    expect(state.progress.tables['3'].status).toBe('locked');
  });

  it('round-trips saved progress and resets it', async () => {
    const repository = new LocalStorageProgressRepository(new MemoryStorage());
    const state = createDefaultGameState();
    state.statistics.totalCorrect = 12;
    state.progress.activeMission = {
      table: 2,
      completedSteps: 1,
      correct: 1,
      incorrect: 0,
      currentQuestion: { key: '2x4', left: 2, right: 4, answer: 8, options: [6, 8, 10, 12] },
      feedback: null,
    };
    await repository.save(state);
    const loaded = await repository.load();
    expect(loaded.statistics.totalCorrect).toBe(12);
    expect(loaded.progress.activeMission).toEqual(state.progress.activeMission);
    await repository.reset();
    expect((await repository.load()).statistics.totalCorrect).toBe(0);
  });

  it('recovers from corrupted JSON', async () => {
    const storage = new MemoryStorage();
    storage.setItem('blocky-tables:progress', '{nope');
    const state = await new LocalStorageProgressRepository(storage).load();
    expect(state).toEqual(createDefaultGameState());
  });

  it('migrates legacy schema zero without losing statistics', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'blocky-tables:progress',
      JSON.stringify({ schemaVersion: 0, locale: 'en-US', totalCorrect: 7 }),
    );
    const state = await new LocalStorageProgressRepository(storage).load();
    expect(state.schemaVersion).toBe(1);
    expect(state.settings.locale).toBe('en-US');
    expect(state.statistics.totalCorrect).toBe(7);
  });

  it('sanitizes malformed current-schema data instead of exposing unsafe values', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'blocky-tables:progress',
      JSON.stringify({
        schemaVersion: 1,
        settings: { locale: 'fr', musicEnabled: 'yes' },
        progress: { tables: { '2': null }, mastery: { '7x3': 'broken' } },
      }),
    );
    const state = await new LocalStorageProgressRepository(storage).load();
    expect(state.settings).toEqual({
      locale: 'pt-BR',
      musicEnabled: true,
      soundEffectsEnabled: true,
    });
    expect(state.progress.tables['2'].status).toBe('available');
    expect(state.progress.mastery).toEqual({});
  });

  it('migrates an older schema-one checkpoint and rejects logically invalid facts', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'blocky-tables:progress',
      JSON.stringify({
        schemaVersion: 1,
        progress: {
          mastery: {
            '2x999': {
              attempts: 1,
              correct: 0,
              incorrect: 1,
              lastSeenAt: '2026-08-15T00:00:00.000Z',
              masteryScore: 0,
            },
          },
          activeMission: {
            table: 2,
            completedSteps: 1,
            correct: 1,
            incorrect: 0,
            currentQuestion: {
              key: '2x4',
              left: 2,
              right: 4,
              answer: 8,
              options: [6, 8, 10, 12],
            },
          },
        },
      }),
    );
    const state = await new LocalStorageProgressRepository(storage).load();
    expect(state.progress.activeMission?.feedback).toBeNull();
    expect(state.progress.activeMission?.currentQuestion.key).toBe('2x4');
    expect(state.progress.mastery).toEqual({});
  });

  it('discards a checkpoint whose question cannot be answered', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'blocky-tables:progress',
      JSON.stringify({
        schemaVersion: 1,
        progress: {
          activeMission: {
            table: 2,
            completedSteps: -1,
            correct: 1,
            incorrect: 0,
            feedback: null,
            currentQuestion: { key: '2x4', left: 2, right: 4, answer: 8, options: [] },
          },
        },
      }),
    );
    expect(
      (await new LocalStorageProgressRepository(storage).load()).progress.activeMission,
    ).toBeNull();
  });
});
