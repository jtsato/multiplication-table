import { defaultRng, weightedPick, type Rng } from './random';
import { getFactStat } from './mastery';
import { factKey, factsForTable, parseFactKey } from './questions';
import type { Fact, FactKey, FactStat, PlayerStatistics } from './types';

/** Quantas perguntas anteriores bloqueiam a repetição imediata de um fato. */
export const COOLDOWN = 3;
/** Proporção máxima de perguntas de revisão (tabuadas já jogadas). */
export const REVIEW_RATIO = 0.25;
/** Abaixo disso um fato é considerado "em dificuldade". */
export const WEAK_THRESHOLD = 0.7;

export interface SelectionContext {
  /** Tabuada da ilha atual. */
  table: number;
  stats: PlayerStatistics;
  /** Tabuadas já desbloqueadas (usadas para revisão). */
  unlockedTables: number[];
}

/**
 * Peso de um fato. Maior = aparece mais.
 *  - conteúdo novo: peso base;
 *  - domínio baixo: peso maior;
 *  - erro recente: peso bem maior;
 *  - domínio alto: peso bem menor.
 */
export function factWeight(stat: FactStat): number {
  if (stat.attempts === 0) return 1.6; // conteúdo novo tem prioridade moderada

  let weight = 0.6 + (1 - stat.masteryScore) * 3;

  const last = stat.recent[stat.recent.length - 1];
  if (last === false) weight += 2.2;
  const beforeLast = stat.recent[stat.recent.length - 2];
  if (last === false && beforeLast === false) weight += 1.2;

  if (stat.masteryScore >= 0.9 && stat.attempts >= 3) weight *= 0.3;
  else if (stat.masteryScore >= 0.75) weight *= 0.6;

  return Math.max(weight, 0.15);
}

/** Fatos de tabuadas anteriores que ainda precisam de revisão. */
export function reviewPool(ctx: SelectionContext): Fact[] {
  const pool: Fact[] = [];
  for (const table of ctx.unlockedTables) {
    if (table >= ctx.table) continue;
    for (const fact of factsForTable(table)) {
      const stat = getFactStat(ctx.stats, factKey(fact.a, fact.b));
      if (stat.attempts > 0 && stat.masteryScore < WEAK_THRESHOLD) pool.push(fact);
    }
  }
  return pool;
}

function chooseFrom(pool: Fact[], recent: FactKey[], rng: Rng, stats: PlayerStatistics): Fact | null {
  if (pool.length === 0) return null;
  const blocked = new Set(recent.slice(-COOLDOWN));
  let candidates = pool.filter((f) => !blocked.has(factKey(f.a, f.b)));
  // Se o cooldown eliminaria tudo (pool pequeno), relaxa para o último fato apenas.
  if (candidates.length === 0) {
    const lastKey = recent[recent.length - 1];
    candidates = pool.filter((f) => factKey(f.a, f.b) !== lastKey);
  }
  if (candidates.length === 0) candidates = pool;

  const weights = candidates.map((f) => factWeight(getFactStat(stats, factKey(f.a, f.b))));
  return weightedPick(candidates, weights, rng);
}

/**
 * Sequência de fatos para uma missão.
 * Mistura a tabuada atual com revisão adaptativa e evita repetição imediata.
 */
export function selectFacts(
  ctx: SelectionContext,
  count: number,
  rng: Rng = defaultRng,
  seedRecent: FactKey[] = [],
): Fact[] {
  const main = factsForTable(ctx.table);
  const review = reviewPool(ctx);
  const maxReview = Math.floor(count * REVIEW_RATIO);

  const chosen: Fact[] = [];
  const recent: FactKey[] = [...seedRecent];
  let reviewUsed = 0;

  for (let i = 0; i < count; i += 1) {
    const wantsReview = review.length > 0 && reviewUsed < maxReview && rng() < REVIEW_RATIO;
    const fact =
      (wantsReview ? chooseFrom(review, recent, rng, ctx.stats) : null) ??
      chooseFrom(main, recent, rng, ctx.stats);
    if (!fact) break;
    if (wantsReview && fact.a !== ctx.table) reviewUsed += 1;
    chosen.push(fact);
    recent.push(factKey(fact.a, fact.b));
  }
  return chosen;
}

/** Utilitário para telas de estatística. */
export function factsInDifficulty(stats: PlayerStatistics): Fact[] {
  return Object.entries(stats.facts)
    .filter(([, stat]) => stat.attempts > 0 && stat.masteryScore < WEAK_THRESHOLD)
    .sort((a, b) => a[1].masteryScore - b[1].masteryScore)
    .map(([key]) => parseFactKey(key));
}
