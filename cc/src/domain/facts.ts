import type { FactKey, MultiplicationFact } from './types';

/** Menor e maior multiplicador usados em todas as tabuadas. */
export const MIN_MULTIPLIER = 1;
export const MAX_MULTIPLIER = 10;

/** Tabuadas do arquipelago, na ordem de progressao. */
export const TABLES: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const FIRST_TABLE = TABLES[0]!;
export const LAST_TABLE = TABLES[TABLES.length - 1]!;

/** Chave canonica: sempre "a x b" na ordem em que foi apresentada. */
export function factKey(fact: MultiplicationFact): FactKey {
  return `${fact.a}x${fact.b}`;
}

/** Le uma chave "7x3" de volta para um fato. Devolve null se invalida. */
export function parseFactKey(key: FactKey): MultiplicationFact | null {
  const match = /^(\d+)x(\d+)$/.exec(key);
  if (!match) {
    return null;
  }
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return null;
  }
  return { a, b };
}

/** Todos os fatos de uma tabuada: table x 1 ate table x 10. */
export function factsForTable(table: number): MultiplicationFact[] {
  const facts: MultiplicationFact[] = [];
  for (let b = MIN_MULTIPLIER; b <= MAX_MULTIPLIER; b += 1) {
    facts.push({ a: table, b });
  }
  return facts;
}

/** Todos os fatos de um conjunto de tabuadas. */
export function factsForTables(tables: readonly number[]): MultiplicationFact[] {
  return tables.flatMap(factsForTable);
}

export function productOf(fact: MultiplicationFact): number {
  return fact.a * fact.b;
}

/** Numero total de perguntas distintas de uma tabuada. */
export const FACTS_PER_TABLE = MAX_MULTIPLIER - MIN_MULTIPLIER + 1;
