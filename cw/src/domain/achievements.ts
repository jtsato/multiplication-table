import { ISLANDS } from './world';
import { getIslandProgress } from './progression';
import type { AchievementState, GameProgress, PlayerStatistics } from './types';

export interface AchievementDef {
  id: string;
  /** Emblema desenhado em CSS/SVG (identificador de forma, não asset externo). */
  icon: 'spark' | 'stack' | 'flame' | 'island' | 'crown' | 'star';
  /** Retorna true quando a conquista deve ser desbloqueada. */
  test: (ctx: { stats: PlayerStatistics; progress: GameProgress }) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'firstCorrect',
    icon: 'spark',
    test: ({ stats }) => stats.totalCorrect >= 1,
  },
  {
    id: 'tenCorrect',
    icon: 'stack',
    test: ({ stats }) => stats.totalCorrect >= 10,
  },
  {
    id: 'streakFive',
    icon: 'flame',
    test: ({ stats }) => stats.bestStreak >= 5,
  },
  {
    id: 'firstIsland',
    icon: 'island',
    test: ({ progress }) => getIslandProgress(progress, 2).status === 'completed',
  },
  {
    id: 'fiftyCorrect',
    icon: 'star',
    test: ({ stats }) => stats.totalCorrect >= 50,
  },
  {
    id: 'allIslands',
    icon: 'crown',
    test: ({ progress }) =>
      ISLANDS.every((i) => getIslandProgress(progress, i.table).status === 'completed'),
  },
];

export function createInitialAchievements(): AchievementState[] {
  return ACHIEVEMENTS.map((a) => ({ id: a.id, unlocked: false, unlockedAt: null }));
}

/** Sincroniza a lista salva com o catálogo (permite adicionar conquistas depois). */
export function reconcileAchievements(saved: AchievementState[]): AchievementState[] {
  const byId = new Map(saved.map((a) => [a.id, a]));
  return ACHIEVEMENTS.map(
    (def) => byId.get(def.id) ?? { id: def.id, unlocked: false, unlockedAt: null },
  );
}

export interface AchievementEvaluation {
  achievements: AchievementState[];
  /** Conquistas desbloqueadas exatamente agora (para exibir o toast). */
  newlyUnlocked: string[];
}

export function evaluateAchievements(
  current: AchievementState[],
  ctx: { stats: PlayerStatistics; progress: GameProgress },
  now: string,
): AchievementEvaluation {
  const list = reconcileAchievements(current);
  const newlyUnlocked: string[] = [];
  const achievements = list.map((state) => {
    if (state.unlocked) return state;
    const def = ACHIEVEMENTS.find((a) => a.id === state.id);
    if (def && def.test(ctx)) {
      newlyUnlocked.push(state.id);
      return { ...state, unlocked: true, unlockedAt: now };
    }
    return state;
  });
  return { achievements, newlyUnlocked };
}
