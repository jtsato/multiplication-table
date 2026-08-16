import { createDefaultGameState } from './defaultState';
import { evaluateAchievements } from './achievements';

describe('achievements', () => {
  it('unlocks earned milestones and preserves their timestamp', () => {
    const state = createDefaultGameState();
    state.statistics.totalCorrect = 10;
    state.statistics.bestStreak = 5;
    const earned = evaluateAchievements(state, '2026-08-15T12:00:00.000Z');
    expect(
      earned.achievements.find((item) => item.id === 'first-correct')?.unlockedAt,
    ).toBeTruthy();
    expect(earned.achievements.find((item) => item.id === 'ten-correct')?.unlockedAt).toBeTruthy();
    expect(earned.achievements.find((item) => item.id === 'streak-five')?.unlockedAt).toBeTruthy();
  });
});
