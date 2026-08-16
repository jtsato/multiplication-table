import { createDefaultGameState } from './defaultState';
import { completeIsland } from './progression';

describe('linear island progression', () => {
  it('starts only table two as available', () => {
    const state = createDefaultGameState();
    expect(state.progress.tables['2'].status).toBe('available');
    expect(
      Object.values(state.progress.tables)
        .slice(1)
        .every((table) => table.status === 'locked'),
    ).toBe(true);
  });

  it('completes an island, assigns stars, and unlocks only its successor', () => {
    const state = completeIsland(createDefaultGameState(), 2, 5, 1);
    expect(state.progress.tables['2']).toMatchObject({
      status: 'completed',
      stars: 3,
      questionsAnswered: 6,
    });
    expect(state.progress.tables['3'].status).toBe('available');
    expect(state.progress.tables['4'].status).toBe('locked');
  });
});
