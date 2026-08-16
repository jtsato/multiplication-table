import { createDefaultGameState } from './defaultState';
import { calculateMasteryScore, recordAnswer } from './mastery';

describe('mastery', () => {
  it('stays bounded and rewards correct answers', () => {
    expect(calculateMasteryScore(0, 0)).toBe(0);
    expect(calculateMasteryScore(8, 2)).toBe(0.8);
    expect(calculateMasteryScore(99, 0)).toBeLessThanOrEqual(1);
  });

  it('records fact-level and aggregate performance with streaks', () => {
    let state = createDefaultGameState();
    state = recordAnswer(state, 7, 3, false, '2026-08-15T12:00:00.000Z');
    state = recordAnswer(state, 7, 3, true, '2026-08-15T12:01:00.000Z');
    expect(state.progress.mastery['7x3']).toMatchObject({
      attempts: 2,
      correct: 1,
      incorrect: 1,
      masteryScore: 0.5,
    });
    expect(state.statistics).toMatchObject({
      totalQuestions: 2,
      totalCorrect: 1,
      totalIncorrect: 1,
      currentStreak: 1,
      bestStreak: 1,
    });
  });
});
