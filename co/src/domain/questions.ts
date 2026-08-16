import type { FactMastery, Question, TableNumber } from './types';

type RandomSource = () => number;

function shuffled<T>(items: T[], random: RandomSource): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function generateQuestion(
  table: TableNumber,
  factor: number,
  random: RandomSource = Math.random,
): Question {
  const answer = table * factor;
  const candidates = [
    answer,
    answer - table,
    answer + table,
    answer - factor,
    answer + factor,
    answer - 2 * table,
    answer + 2 * table,
  ].filter((value) => value > 0 && Math.abs(value - answer) <= table * 2);
  const unique = [...new Set(candidates)];
  let offset = 1;
  while (unique.length < 4) {
    const value = answer + offset;
    if (!unique.includes(value)) unique.push(value);
    offset += 1;
  }
  return {
    key: `${table}x${factor}`,
    left: table,
    right: factor,
    answer,
    options: shuffled(unique.slice(0, 4), random),
  };
}

export function getReviewWeight(fact: FactMastery | undefined, now = Date.now()): number {
  if (!fact) return 2;
  const lowMasteryBoost = (1 - fact.masteryScore) * 5;
  const age = now - Date.parse(fact.lastSeenAt);
  const isRecent = Number.isFinite(age) && age >= 0 && age <= 14 * 24 * 60 * 60 * 1000;
  const errorBoost = isRecent && fact.masteryScore < 0.85 ? Math.min(3, fact.incorrect * 0.35) : 0;
  return Math.max(0.35, 0.5 + lowMasteryBoost + errorBoost);
}

export function selectAdaptiveFactor(
  table: TableNumber,
  mastery: Record<string, FactMastery>,
  previousKey: string | null,
  random: RandomSource = Math.random,
): number {
  let candidates = Array.from({ length: 10 }, (_, index) => index + 1);
  if (candidates.length > 1 && previousKey) {
    candidates = candidates.filter((factor) => `${table}x${factor}` !== previousKey);
  }
  const weighted = candidates.map((factor) => ({
    factor,
    weight: getReviewWeight(mastery[`${table}x${factor}`]),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.factor;
  }
  return weighted.at(-1)?.factor ?? 1;
}

export function selectQuestionFact(
  activeTable: TableNumber,
  mastery: Record<string, FactMastery>,
  completedTables: TableNumber[],
  includeReview: boolean,
  previousKey: string | null,
  random: RandomSource = Math.random,
): { table: TableNumber; factor: number } {
  if (includeReview) {
    const reviewFacts = Object.entries(mastery)
      .map(([key, fact]) => {
        const match = key.match(/^(\d+)x(\d+)$/);
        return match
          ? { key, table: Number(match[1]) as TableNumber, factor: Number(match[2]), fact }
          : null;
      })
      .filter(
        (item): item is NonNullable<typeof item> =>
          item !== null &&
          completedTables.includes(item.table) &&
          item.fact.masteryScore < 0.75 &&
          item.key !== previousKey,
      );
    if (reviewFacts.length > 0) {
      const total = reviewFacts.reduce((sum, item) => sum + getReviewWeight(item.fact), 0);
      let cursor = random() * total;
      for (const item of reviewFacts) {
        cursor -= getReviewWeight(item.fact);
        if (cursor <= 0) return { table: item.table, factor: item.factor };
      }
    }
  }
  return {
    table: activeTable,
    factor: selectAdaptiveFactor(activeTable, mastery, previousKey, random),
  };
}
