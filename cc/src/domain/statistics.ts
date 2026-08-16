import { recordAttempt } from './mastery';
import type { FactKey, PlayerStatistics } from './types';

export function createInitialStatistics(): PlayerStatistics {
  return {
    totalQuestions: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    playSessions: 0,
    facts: {},
  };
}

/**
 * Registra UMA tentativa de resposta.
 *
 * `totalQuestions` conta tentativas, nao perguntas distintas: uma pergunta
 * errada e depois acertada soma duas tentativas, um erro e um acerto. E o
 * numero que a crianca reconhece ("quantas vezes eu respondi").
 */
export function recordAnswer(
  statistics: PlayerStatistics,
  key: FactKey,
  wasCorrect: boolean,
  now: Date = new Date(),
): PlayerStatistics {
  const currentStreak = wasCorrect ? statistics.currentStreak + 1 : 0;

  return {
    ...statistics,
    totalQuestions: statistics.totalQuestions + 1,
    totalCorrect: statistics.totalCorrect + (wasCorrect ? 1 : 0),
    totalIncorrect: statistics.totalIncorrect + (wasCorrect ? 0 : 1),
    currentStreak,
    bestStreak: Math.max(statistics.bestStreak, currentStreak),
    facts: recordAttempt(statistics.facts, key, wasCorrect, now),
  };
}

/** Uma nova sessao de jogo comecou (abertura do app). */
export function startSession(statistics: PlayerStatistics): PlayerStatistics {
  return { ...statistics, playSessions: statistics.playSessions + 1, currentStreak: 0 };
}

export function globalAccuracy(statistics: PlayerStatistics): number {
  if (statistics.totalQuestions === 0) {
    return 0;
  }
  return statistics.totalCorrect / statistics.totalQuestions;
}
