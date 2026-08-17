import { isPerfectRun } from './challenge';
import { completedIslandCount, getIslandProgress, isArchipelagoComplete } from './progression';
import type { AchievementId, AchievementState, GameState } from './types';

export interface AchievementDefinition {
  id: AchievementId;
  /** Emoji usado como icone; nenhum asset externo envolvido. */
  icon: string;
  check: (state: GameState) => boolean;
}

/** Poucas conquistas, todas alcancaveis. */
export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: 'firstCorrect',
    icon: '⭐',
    check: (state) => state.statistics.totalCorrect >= 1,
  },
  {
    id: 'firstMission',
    icon: '🧱',
    check: (state) =>
      Object.values(state.progress.islands).some(
        (island) => island.completedMissionIds.length >= 1,
      ),
  },
  {
    id: 'tenCorrect',
    icon: '🌟',
    check: (state) => state.statistics.totalCorrect >= 10,
  },
  {
    id: 'streakFive',
    icon: '🔥',
    check: (state) => state.statistics.bestStreak >= 5,
  },
  {
    id: 'tableTwoDone',
    icon: '🌻',
    check: (state) => getIslandProgress(state.progress, 2).completed,
  },
  {
    id: 'fiftyCorrect',
    icon: '🏅',
    check: (state) => state.statistics.totalCorrect >= 50,
  },
  {
    id: 'streakTen',
    icon: '⚡',
    check: (state) => state.statistics.bestStreak >= 10,
  },
  {
    id: 'halfArchipelago',
    icon: '🗺️',
    check: (state) => completedIslandCount(state.progress) >= 5,
  },
  {
    id: 'allIslands',
    icon: '👑',
    check: (state) => isArchipelagoComplete(state.progress),
  },
  {
    id: 'perfectChallenge',
    icon: '⚔️',
    check: (state) => isPerfectRun(state.challenge),
  },
];

export function createInitialAchievements(): AchievementState[] {
  return ACHIEVEMENTS.map((definition) => ({
    id: definition.id,
    unlocked: false,
    unlockedAt: null,
  }));
}

export function getAchievementDefinition(id: AchievementId): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((definition) => definition.id === id);
}

export interface AchievementEvaluation {
  achievements: AchievementState[];
  newlyUnlocked: AchievementId[];
}

/**
 * Reavalia todas as conquistas contra o estado atual.
 * Conquista nunca e perdida: uma vez desbloqueada, permanece.
 */
export function evaluateAchievements(
  state: GameState,
  now: Date = new Date(),
): AchievementEvaluation {
  const existing = new Map(state.achievements.map((entry) => [entry.id, entry]));
  const newlyUnlocked: AchievementId[] = [];

  const achievements = ACHIEVEMENTS.map((definition) => {
    const current = existing.get(definition.id) ?? {
      id: definition.id,
      unlocked: false,
      unlockedAt: null,
    };
    if (current.unlocked) {
      return current;
    }
    if (!definition.check(state)) {
      return current;
    }
    newlyUnlocked.push(definition.id);
    return { id: definition.id, unlocked: true, unlockedAt: now.toISOString() };
  });

  return { achievements, newlyUnlocked };
}

export function unlockedAchievementCount(achievements: readonly AchievementState[]): number {
  return achievements.filter((entry) => entry.unlocked).length;
}
