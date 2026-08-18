import type { Rng } from "../math-question/question.types";
import type { MultiplicationFact } from "../math-question/question.types";

/** Histórico por fato (multiplicação) para o reforço adaptativo. */
export interface FactStats {
  a: number;
  b: number;
  attempts: number;
  errors: number;
  /** Contador da pergunta em que o fato foi visto pela última vez. */
  lastSeenAt: number;
}

/** Peso de um fato que ainda não apareceu (frescor máximo). */
const BASE_WEIGHT = 1;
const ERROR_WEIGHT = 3;
const MAX_FRESHNESS = 8;

/** Registra a última vez que o fato foi exibido. */
export function markSeen(
  prev: FactStats | undefined,
  fact: MultiplicationFact,
  now: number,
): FactStats {
  return {
    a: fact.a,
    b: fact.b,
    attempts: prev?.attempts ?? 0,
    errors: prev?.errors ?? 0,
    lastSeenAt: now,
  };
}

/** Registra o desfecho de uma tentativa (acerto ou erro). */
export function recordAnswer(stats: FactStats, correct: boolean): FactStats {
  return {
    ...stats,
    attempts: stats.attempts + 1,
    errors: stats.errors + (correct ? 0 : 1),
  };
}

/**
 * Peso de seleção: erros pesam mais; fatos há muito tempo sem aparecer
 * (ou nunca vistos) também têm prioridade (frescor).
 */
export function factWeight(stats: FactStats, now: number): number {
  const errors = stats.errors * ERROR_WEIGHT;
  const freshness = Math.min(Math.max(now - stats.lastSeenAt, 0), MAX_FRESHNESS);
  return BASE_WEIGHT + errors + freshness;
}

/** Sorteio ponderado de um fato entre os candidatos. */
export function pickFact(facts: FactStats[], rng: Rng, now: number): MultiplicationFact {
  const total = facts.reduce((sum, f) => sum + factWeight(f, now), 0);
  let roll = rng() * total;
  for (const f of facts) {
    roll -= factWeight(f, now);
    if (roll <= 0) {
      return { a: f.a, b: f.b, answer: f.a * f.b };
    }
  }
  const last = facts[facts.length - 1];
  return { a: last.a, b: last.b, answer: last.a * last.b };
}

/** Fatores desordenados (a ≤ b) dentro das tabuadas disponíveis. */
export function factsInTables(tables: number[]): FactStats[] {
  const pairs: FactStats[] = [];
  for (const a of tables) {
    for (const b of tables) {
      if (a <= b) {
        pairs.push({ a, b, attempts: 0, errors: 0, lastSeenAt: 0 });
      }
    }
  }
  return pairs;
}

/** Multiplicadores usados pelo chefão de cada mapa (as mais difíceis). */
export const BOSS_MULTIPLIERS = [6, 7, 8, 9];

/** Fatores cobertos pelas tabuadas da aventura (2 a 10). */
export const TABLE_FACTORS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Par canônico (a ≤ b) de uma tabuada com um multiplicador. */
function tablePair(table: number, multiplier: number): FactStats {
  const a = Math.min(table, multiplier);
  const b = Math.max(table, multiplier);
  return { a, b, attempts: 0, errors: 0, lastSeenAt: 0 };
}

/**
 * Pool de fatos de uma tabuada específica.
 * `hardOnly` restringe aos multiplicadores do chefão (?x6 a ?x9).
 */
export function factsForTable(table: number, hardOnly = false): FactStats[] {
  const multipliers = hardOnly ? BOSS_MULTIPLIERS : TABLE_FACTORS;
  return multipliers.map((multiplier) => tablePair(table, multiplier));
}

/**
 * Próxima pergunta focada em uma tabuada (mapa atual).
 * No modo chefão, só entram os fatos ?x6 a ?x9.
 */
export function pickNextFactForTable(
  table: number,
  facts: FactStats[],
  rng: Rng,
  now: number,
  hardOnly = false,
): MultiplicationFact {
  const pool = factsForTable(table, hardOnly).map((candidate) => {
    const seen = facts.find((f) => f.a === candidate.a && f.b === candidate.b);
    return seen ?? candidate;
  });
  return pickFact(pool, rng, now);
}

/** Substitui ou adiciona um fato na lista (imutável). */
export function upsertFact(facts: FactStats[], stats: FactStats): FactStats[] {
  const index = facts.findIndex((f) => f.a === stats.a && f.b === stats.b);
  return index === -1 ? [...facts, stats] : facts.map((f, i) => (i === index ? stats : f));
}

/**
 * Próxima pergunta: mescla o histórico (stats) com o pool completo das
 * tabuadas — fatos novos entram com peso de frescor, difíceis com peso de erro.
 */
export function pickNextFact(
  tables: number[],
  facts: FactStats[],
  rng: Rng,
  now: number,
): MultiplicationFact {
  const pool = factsInTables(tables).map((candidate) => {
    const seen = facts.find((f) => f.a === candidate.a && f.b === candidate.b);
    return seen ?? candidate;
  });
  return pickFact(pool, rng, now);
}
