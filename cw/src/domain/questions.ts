import { defaultRng, shuffle, type Rng } from './random';
import type { Fact, FactKey, Question } from './types';

export const MIN_FACTOR = 1;
export const MAX_FACTOR = 10;

export function factKey(a: number, b: number): FactKey {
  return `${a}x${b}`;
}

export function parseFactKey(key: FactKey): Fact {
  const [a, b] = key.split('x').map((n) => Number.parseInt(n, 10));
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error(`Chave de multiplicação inválida: ${key}`);
  }
  return { a: a as number, b: b as number };
}

/** Todas as multiplicações de uma tabuada: table × 1..10. */
export function factsForTable(table: number): Fact[] {
  const facts: Fact[] = [];
  for (let b = MIN_FACTOR; b <= MAX_FACTOR; b += 1) facts.push({ a: table, b });
  return facts;
}

/**
 * Distratores plausíveis: erros que uma criança realmente comete.
 * Nunca números absurdos (999) e nunca negativos.
 */
export function buildDistractors(fact: Fact, count: number, rng: Rng = defaultRng): number[] {
  const answer = fact.a * fact.b;
  const candidates: number[] = [
    answer + fact.a, // "andou" uma casa na tabuada
    answer - fact.a,
    answer + fact.b,
    answer - fact.b,
    answer + fact.a + fact.b, // confusão com a soma
    fact.a + fact.b,
    answer + 1,
    answer - 1,
    answer + 2 * fact.a,
    answer - 2 * fact.a,
    answer + 10,
  ];

  const seen = new Set<number>([answer]);
  const valid: number[] = [];
  for (const value of candidates) {
    if (value <= 0 || seen.has(value)) continue;
    // Mantém os distratores dentro de uma vizinhança plausível.
    if (Math.abs(value - answer) > Math.max(answer, 12)) continue;
    seen.add(value);
    valid.push(value);
  }

  const chosen = shuffle(valid, rng).slice(0, count);

  // Rede de segurança: completa com vizinhos caso falte alternativa.
  let offset = 1;
  while (chosen.length < count && offset < 40) {
    for (const value of [answer + offset, answer - offset]) {
      if (chosen.length >= count) break;
      if (value > 0 && !seen.has(value)) {
        seen.add(value);
        chosen.push(value);
      }
    }
    offset += 1;
  }
  return chosen;
}

/** Monta uma questão com alternativas embaralhadas (correta em posição aleatória). */
export function buildQuestion(fact: Fact, optionCount = 3, rng: Rng = defaultRng): Question {
  const answer = fact.a * fact.b;
  const options = shuffle([answer, ...buildDistractors(fact, optionCount - 1, rng)], rng);
  return { fact, answer, options, key: factKey(fact.a, fact.b) };
}

/**
 * Número de alternativas conforme a dificuldade percebida:
 * tabuadas iniciais são mais gentis, as finais exigem mais discriminação.
 */
export function optionCountForTable(table: number): number {
  return table <= 3 ? 3 : 4;
}
