import type { FactKey, FactStat, FactStats } from './types';

/**
 * Peso da media movel. Mais alto = esquece o passado mais rapido.
 * 0.35 faz o placar reagir a ~3 respostas recentes sem apagar o historico.
 */
const RECENCY_ALPHA = 0.35;

/** Abaixo disso a multiplicacao entra na fila de revisao. */
export const STRUGGLING_THRESHOLD = 0.6;

/** Acima disso consideramos a multiplicacao dominada. */
export const MASTERED_THRESHOLD = 0.85;

export function createEmptyFactStat(): FactStat {
  return {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    lastSeenAt: null,
    lastWasCorrect: false,
    recentScore: 0,
    masteryScore: 0,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Nota de dominio: metade taxa historica, metade desempenho recente.
 *
 * A parte historica evita que um unico acerto de sorte marque a conta como
 * dominada; a parte recente garante que a crianca que finalmente aprendeu
 * `7x3` pare de ver a pergunta o tempo todo.
 */
export function computeMasteryScore(
  attempts: number,
  correct: number,
  recentScore: number,
): number {
  if (attempts === 0) {
    return 0;
  }
  const ratio = correct / attempts;
  return round2(0.5 * ratio + 0.5 * recentScore);
}

/** Aplica uma tentativa e devolve um NOVO stat (nunca muta o original). */
export function applyAttempt(stat: FactStat, wasCorrect: boolean, now: Date): FactStat {
  const outcome = wasCorrect ? 1 : 0;
  const attempts = stat.attempts + 1;
  const correct = stat.correct + outcome;
  const incorrect = stat.incorrect + (wasCorrect ? 0 : 1);
  const recentScore =
    stat.attempts === 0
      ? outcome
      : round2(stat.recentScore + RECENCY_ALPHA * (outcome - stat.recentScore));

  return {
    attempts,
    correct,
    incorrect,
    lastSeenAt: now.toISOString(),
    lastWasCorrect: wasCorrect,
    recentScore,
    masteryScore: computeMasteryScore(attempts, correct, recentScore),
  };
}

/** Registra uma tentativa dentro de um mapa de stats, imutavelmente. */
export function recordAttempt(
  stats: FactStats,
  key: FactKey,
  wasCorrect: boolean,
  now: Date = new Date(),
): FactStats {
  const current = stats[key] ?? createEmptyFactStat();
  return { ...stats, [key]: applyAttempt(current, wasCorrect, now) };
}

export function getFactStat(stats: FactStats, key: FactKey): FactStat | undefined {
  return stats[key];
}

/** Dominio de uma multiplicacao; 0 para o que a crianca nunca viu. */
export function getMastery(stats: FactStats, key: FactKey): number {
  return stats[key]?.masteryScore ?? 0;
}

/** Ja foi vista pelo menos uma vez e ainda esta fraca. */
export function isStruggling(stats: FactStats, key: FactKey): boolean {
  const stat = stats[key];
  return stat !== undefined && stat.attempts > 0 && stat.masteryScore < STRUGGLING_THRESHOLD;
}

export function isMastered(stats: FactStats, key: FactKey): boolean {
  const stat = stats[key];
  return stat !== undefined && stat.attempts >= 2 && stat.masteryScore >= MASTERED_THRESHOLD;
}

/** Chaves ordenadas da mais fraca para a mais forte; util na tela de revisao. */
export function weakestFacts(stats: FactStats, limit: number): FactKey[] {
  return Object.keys(stats)
    .filter((key) => (stats[key]?.attempts ?? 0) > 0)
    .sort((a, b) => getMastery(stats, a) - getMastery(stats, b))
    .slice(0, limit);
}
