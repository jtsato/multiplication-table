import { factKey } from './questions';
import type { Fact, FactKey, FactStat, PlayerStatistics } from './types';

/** Quantas tentativas recentes influenciam o mastery. */
export const RECENT_WINDOW = 5;

export function emptyFactStat(): FactStat {
  return {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    lastSeenAt: null,
    recent: [],
    masteryScore: 0,
  };
}

export function getFactStat(stats: PlayerStatistics, key: FactKey): FactStat {
  return stats.facts[key] ?? emptyFactStat();
}

/**
 * masteryScore em [0,1].
 * Combina o histórico completo (estabilidade) com as tentativas recentes
 * (situação atual), dando mais peso ao recente. Sem tentativas => 0.
 */
export function computeMastery(stat: FactStat): number {
  if (stat.attempts === 0) return 0;
  const lifetime = stat.correct / stat.attempts;
  const window = stat.recent.slice(-RECENT_WINDOW);
  const recent = window.length > 0 ? window.filter(Boolean).length / window.length : lifetime;
  const raw = lifetime * 0.35 + recent * 0.65;
  // Confiança: poucas tentativas não podem gerar mastery alto imediatamente.
  const confidence = Math.min(1, stat.attempts / 3);
  return round2(raw * confidence);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Aplica uma resposta e devolve novas estatísticas (imutável). */
export function recordAnswer(
  stats: PlayerStatistics,
  fact: Fact,
  correct: boolean,
  now: string,
): PlayerStatistics {
  const key = factKey(fact.a, fact.b);
  const previous = getFactStat(stats, key);
  const updated: FactStat = {
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    incorrect: previous.incorrect + (correct ? 0 : 1),
    lastSeenAt: now,
    recent: [...previous.recent, correct].slice(-RECENT_WINDOW * 2),
    masteryScore: 0,
  };
  updated.masteryScore = computeMastery(updated);

  const currentStreak = correct ? stats.currentStreak + 1 : 0;

  return {
    ...stats,
    totalQuestions: stats.totalQuestions + 1,
    totalCorrect: stats.totalCorrect + (correct ? 1 : 0),
    totalIncorrect: stats.totalIncorrect + (correct ? 0 : 1),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    facts: { ...stats.facts, [key]: updated },
  };
}

/** Multiplicações com maior dificuldade (para telas de revisão/estatística). */
export function weakestFacts(stats: PlayerStatistics, limit = 5): FactKey[] {
  return Object.entries(stats.facts)
    .filter(([, stat]) => stat.incorrect > 0)
    .sort((a, b) => a[1].masteryScore - b[1].masteryScore || b[1].incorrect - a[1].incorrect)
    .slice(0, limit)
    .map(([key]) => key);
}
