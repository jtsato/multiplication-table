import type { Rng } from '../../shared/rng';

export const SMALL_REVIEW = 2;

const REVIEW_INTERVALS = [2, 4, 8, 16, 32, 64] as const;

export type MasteryLevel = 'new' | 'learning' | 'review' | 'mastered';

export interface FactProgress {
  key: string;
  correct: number;
  wrong: number;
  streak: number;
  lastSeen: number | null;
  dueAt: number;
}

export type FactProgressMap = Record<string, FactProgress>;

export function createFactProgress(key: string): FactProgress {
  return { key, correct: 0, wrong: 0, streak: 0, lastSeen: null, dueAt: 0 };
}

export function reviewInterval(streak: number): number {
  const index = Math.max(0, Math.floor(streak) - 1);
  return REVIEW_INTERVALS[Math.min(index, REVIEW_INTERVALS.length - 1)];
}

export function recordAnswer(progress: FactProgress, correct: boolean, at: number): FactProgress {
  const safeAt = Math.max(0, Math.floor(at));
  if (correct) {
    const streak = progress.streak + 1;
    return {
      ...progress,
      correct: progress.correct + 1,
      streak,
      lastSeen: safeAt,
      dueAt: safeAt + reviewInterval(streak),
    };
  }

  return {
    ...progress,
    wrong: progress.wrong + 1,
    streak: 0,
    lastSeen: safeAt,
    dueAt: safeAt + SMALL_REVIEW,
  };
}

function tableDifficulty(key: string): number {
  const factors = key.split('x').map(Number);
  const multiplier = Math.max(...factors);
  if (multiplier === 1 || multiplier === 2 || multiplier === 5 || multiplier === 10) return 1;
  if (multiplier === 3 || multiplier === 4) return 2;
  return 3;
}

export function masteryLevel(progress: FactProgress): MasteryLevel {
  if (progress.correct === 0 && progress.wrong === 0) return 'new';
  if (progress.streak >= 4 && progress.correct >= 4) return 'mastered';
  if (progress.streak === 0 && progress.wrong > 0) return 'review';
  return 'learning';
}

export function factPriority(progress: FactProgress, now = 0): number {
  const level = masteryLevel(progress);
  const levelWeight = level === 'mastered' ? 0 : level === 'review' ? 5 : level === 'new' ? 4 : 2;
  const errorWeight = progress.wrong * 5;
  const dueWeight = progress.dueAt > 0 && progress.dueAt <= now ? 100 : 0;
  const maintenanceWeight = level === 'mastered' ? 1 : 0;
  return tableDifficulty(progress.key) + levelWeight + errorWeight + dueWeight + maintenanceWeight;
}

function weightedPick(items: readonly FactProgress[], now: number, rng: Rng): FactProgress {
  if (items.length === 1) return items[0];
  const weights = items.map((item) => Math.max(1, factPriority(item, now)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    cursor -= weights[index];
    if (cursor < 0) return items[index];
  }
  return items[items.length - 1];
}

export function buildFactCandidates(
  tables: readonly number[],
  progress: FactProgressMap,
  factors: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
): FactProgress[] {
  return tables.flatMap((table) =>
    factors.map((factor) => {
      const menor = Math.min(table, factor);
      const maior = Math.max(table, factor);
      const key = `${menor}x${maior}`;
      return progress[key] ?? createFactProgress(key);
    }),
  );
}

export function selectNextFact(
  candidates: readonly FactProgress[],
  now: number,
  rng: Rng,
  lastKey?: string,
): FactProgress {
  if (candidates.length === 0) throw new Error('selectNextFact() exige candidatos');

  const withoutImmediateRepeat =
    candidates.length > 1 ? candidates.filter((candidate) => candidate.key !== lastKey) : [...candidates];
  const available = withoutImmediateRepeat.length > 0 ? withoutImmediateRepeat : [...candidates];
  const due = available.filter((candidate) => candidate.dueAt > 0 && candidate.dueAt <= now);
  return weightedPick(due.length > 0 ? due : available, now, rng);
}

function validFactKey(key: string): boolean {
  return /^\d{1,2}x\d{1,2}$/.test(key);
}

export function isValidFactKey(key: string): boolean {
  return validFactKey(key);
}

export function migrateToProgress(
  knownFacts: readonly string[],
  factCounts: Readonly<Record<string, number>>,
): FactProgressMap {
  const keys = new Set([...knownFacts, ...Object.keys(factCounts)]);
  const progress: FactProgressMap = {};

  for (const key of keys) {
    if (!validFactKey(key)) continue;
    const count = Math.max(0, Math.floor(factCounts[key] ?? 0));
    const correct = Math.max(knownFacts.includes(key) ? 1 : 0, count);
    progress[key] = { ...createFactProgress(key), correct };
  }

  return progress;
}

export function factProgressToKnownFacts(progress: FactProgressMap): string[] {
  return Object.values(progress)
    .filter((fact) => fact.correct > 0)
    .map((fact) => fact.key);
}

export function factProgressToCounts(progress: FactProgressMap): Record<string, number> {
  return Object.fromEntries(
    Object.values(progress)
      .filter((fact) => fact.correct > 0)
      .map((fact) => [fact.key, fact.correct]),
  );
}
