import type { AchievementId, GameState } from './types';

function earned(state: GameState, id: AchievementId): boolean {
  const completed = Object.values(state.progress.tables).filter(
    (table) => table.status === 'completed',
  ).length;
  switch (id) {
    case 'first-correct':
      return state.statistics.totalCorrect >= 1;
    case 'ten-correct':
      return state.statistics.totalCorrect >= 10;
    case 'streak-five':
      return state.statistics.bestStreak >= 5;
    case 'table-two':
      return state.progress.tables['2'].status === 'completed';
    case 'first-island':
      return completed >= 1;
    case 'fifty-correct':
      return state.statistics.totalCorrect >= 50;
  }
}

export function evaluateAchievements(state: GameState, now = new Date().toISOString()): GameState {
  return {
    ...state,
    achievements: state.achievements.map((achievement) => ({
      ...achievement,
      unlockedAt: achievement.unlockedAt ?? (earned(state, achievement.id) ? now : null),
    })),
  };
}
