import { factKey, factsForTable, factsForTables } from './facts';
import { getMastery, isStruggling, MASTERED_THRESHOLD } from './mastery';
import { weightedPick, type Rng } from './rng';
import type { FactKey, FactStats, MultiplicationFact } from './types';

/**
 * Revisao inteligente.
 *
 * Objetivo declarado no produto: multiplicacoes erradas com frequencia devem
 * voltar mais vezes, SEM repetir a mesma conta duas ou tres vezes seguidas.
 * Sao duas forcas opostas, resolvidas por dois mecanismos separados:
 *
 *  1. peso  -> decide quais contas sao mais provaveis (adaptacao);
 *  2. cooldown -> proibe as ultimas N contas sorteadas (variedade).
 *
 * Nao e spaced repetition academico. E previsivel e facil de depurar.
 */

/** Peso de uma conta que a crianca ainda nunca viu. */
export const NEW_FACT_WEIGHT = 1.5;

/** Quantas perguntas recentes ficam bloqueadas para nao repetir em sequencia. */
export const COOLDOWN_WINDOW = 3;

/** Fatia das perguntas puxadas de tabuadas anteriores ainda fracas. */
export const DEFAULT_REVIEW_RATIO = 0.25;

export interface ReviewContext {
  /** Tabuada da ilha atual. */
  table: number;
  /** Tabuadas ja liberadas, usadas para sortear revisao. */
  unlockedTables: readonly number[];
  stats: FactStats;
  /** Chaves das ultimas perguntas feitas, da mais antiga para a mais recente. */
  recentKeys: readonly FactKey[];
  /** Probabilidade de puxar uma conta de revisao. Padrao 0.25. */
  reviewRatio?: number;
}

/**
 * Peso de uma conta na hora do sorteio. Quanto maior, mais provavel.
 *
 *  - nunca vista .................. 1.5  (conteudo novo, peso normal)
 *  - dominio baixo ................ ate 4
 *  - errou na ultima tentativa .... +2
 *  - dominio alto ................. multiplicado por 0.35
 */
export function factWeight(stats: FactStats, key: FactKey): number {
  const stat = stats[key];
  if (!stat || stat.attempts === 0) {
    return NEW_FACT_WEIGHT;
  }

  const mastery = getMastery(stats, key);
  let weight = 1 + (1 - mastery) * 3;

  if (!stat.lastWasCorrect) {
    weight += 2;
  }
  if (mastery >= MASTERED_THRESHOLD) {
    weight *= 0.35;
  }

  return Math.max(0.1, weight);
}

/** Remove as contas em cooldown, desde que sobre alternativa suficiente. */
export function applyCooldown(
  facts: readonly MultiplicationFact[],
  recentKeys: readonly FactKey[],
): MultiplicationFact[] {
  if (facts.length <= 1) {
    return [...facts];
  }
  // Nunca bloqueia tanto a ponto de esvaziar o conjunto.
  const window = Math.min(COOLDOWN_WINDOW, facts.length - 1);
  const blocked = new Set(recentKeys.slice(-window));
  const allowed = facts.filter((fact) => !blocked.has(factKey(fact)));
  return allowed.length > 0 ? allowed : [...facts];
}

/** Contas de tabuadas anteriores que continuam fracas. */
export function pendingReviewFacts(context: ReviewContext): MultiplicationFact[] {
  const previous = context.unlockedTables.filter((table) => table !== context.table);
  return factsForTables(previous).filter((fact) => isStruggling(context.stats, factKey(fact)));
}

/**
 * Sorteia a proxima multiplicacao a ser perguntada.
 * Mistura a tabuada da ilha atual com revisao das anteriores.
 */
export function selectNextFact(rng: Rng, context: ReviewContext): MultiplicationFact {
  const reviewRatio = context.reviewRatio ?? DEFAULT_REVIEW_RATIO;
  const reviewPool = pendingReviewFacts(context);
  const useReview = reviewPool.length > 0 && rng.next() < reviewRatio;

  const basePool = useReview ? reviewPool : factsForTable(context.table);
  const pool = applyCooldown(basePool, context.recentKeys);
  const weights = pool.map((fact) => factWeight(context.stats, factKey(fact)));

  return weightedPick(rng, pool, weights);
}

/**
 * Gera a lista de chaves recentes atualizada, mantendo apenas a janela util.
 * Fica aqui para que a regra de cooldown viva num lugar so.
 */
export function pushRecentKey(recentKeys: readonly FactKey[], key: FactKey): FactKey[] {
  return [...recentKeys, key].slice(-COOLDOWN_WINDOW);
}
