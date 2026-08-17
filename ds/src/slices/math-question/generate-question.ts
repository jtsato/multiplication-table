import type { MultiplicationFact, Rng } from "./question.types";

/** Tabuadas cobertas pela POC (progressão/adaptive-review podem estreitar). */
export const DEFAULT_TABLES = [2, 3, 4, 5, 6, 7, 8, 9];

export function generateQuestion(tables: number[], rng: Rng): MultiplicationFact {
  const a = pick(tables, rng);
  const b = pick(tables, rng);
  return { a, b, answer: a * b };
}

function pick<T>(items: T[], rng: Rng): T {
  const index = Math.floor(rng() * items.length);
  return items[Math.min(index, items.length - 1)];
}
