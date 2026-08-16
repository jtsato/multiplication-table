import type { GameState, TableNumber } from './types';

export function calculateMasteryScore(correct: number, incorrect: number): number {
  const attempts = correct + incorrect;
  if (attempts === 0) return 0;
  return Math.max(0, Math.min(1, Number((correct / attempts).toFixed(2))));
}

export function recordAnswer(
  state: GameState,
  table: TableNumber,
  factor: number,
  correct: boolean,
  now = new Date().toISOString(),
): GameState {
  const key = `${table}x${factor}`;
  const previous = state.progress.mastery[key] ?? {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    lastSeenAt: now,
    masteryScore: 0,
  };
  const nextCorrect = previous.correct + (correct ? 1 : 0);
  const nextIncorrect = previous.incorrect + (correct ? 0 : 1);
  const currentStreak = correct ? state.statistics.currentStreak + 1 : 0;
  return {
    ...state,
    progress: {
      ...state.progress,
      mastery: {
        ...state.progress.mastery,
        [key]: {
          attempts: previous.attempts + 1,
          correct: nextCorrect,
          incorrect: nextIncorrect,
          lastSeenAt: now,
          masteryScore: calculateMasteryScore(nextCorrect, nextIncorrect),
        },
      },
    },
    statistics: {
      ...state.statistics,
      totalQuestions: state.statistics.totalQuestions + 1,
      totalCorrect: state.statistics.totalCorrect + (correct ? 1 : 0),
      totalIncorrect: state.statistics.totalIncorrect + (correct ? 0 : 1),
      currentStreak,
      bestStreak: Math.max(state.statistics.bestStreak, currentStreak),
    },
  };
}
