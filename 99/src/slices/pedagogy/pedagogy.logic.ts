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

export interface MentorFocus {
  key: string;
  table: number;
  factor: number;
  answer: number;
  level: MasteryLevel;
  correct: number;
  wrong: number;
  streak: number;
  dueAt: number;
}

export interface MentorAdvice {
  totalFacts: number;
  seenFacts: number;
  masteredFacts: number;
  focus: MentorFocus;
}

function factorFromKey(key: string, table: number): number {
  const [first, second] = key.split('x').map(Number);
  return first === table ? second : first;
}

function tableFromKey(key: string, tables: readonly number[]): number {
  const factors = key.split('x').map(Number);
  return tables.find((table) => factors.includes(table)) ?? tables[0]!;
}

export function mentorAdvice(
  tables: readonly number[],
  progress: FactProgressMap,
  now = 0,
): MentorAdvice {
  if (tables.length === 0) throw new Error('mentorAdvice() exige ao menos uma tabuada');
  const candidates = buildFactCandidates(tables, progress);

  const ordered = [...candidates].sort((a, b) => {
    const priority = factPriority(b, now) - factPriority(a, now);
    if (priority !== 0) return priority;

    const factorOrder =
      factorFromKey(a.key, tableFromKey(a.key, tables)) -
      factorFromKey(b.key, tableFromKey(b.key, tables));
    if (factorOrder !== 0) return factorOrder;
    return a.key.localeCompare(b.key);
  });
  const chosen = ordered[0]!;
  const table = tableFromKey(chosen.key, tables);
  const factor = factorFromKey(chosen.key, table);

  return {
    totalFacts: candidates.length,
    seenFacts: candidates.filter((candidate) => candidate.correct > 0 || candidate.wrong > 0).length,
    masteredFacts: candidates.filter((candidate) => masteryLevel(candidate) === 'mastered').length,
    focus: {
      key: chosen.key,
      table,
      factor,
      answer: table * factor,
      level: masteryLevel(chosen),
      correct: chosen.correct,
      wrong: chosen.wrong,
      streak: chosen.streak,
      dueAt: chosen.dueAt,
    },
  };
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

export function factFactorForTable(
  table: number,
  progress: FactProgressMap,
  now: number,
  rng: Rng,
  lastKey?: string,
  preferredFactor?: number,
): number {
  const candidates = buildFactCandidates([table], progress);
  const preferred = preferredFactor !== undefined && preferredFactor >= 1 && preferredFactor <= 10;
  const preferredKey = preferred
    ? `${Math.min(table, preferredFactor)}x${Math.max(table, preferredFactor)}`
    : null;
  const hasDue = candidates.some((candidate) => candidate.dueAt > 0 && candidate.dueAt <= now);

  if (preferred && !hasDue && preferredKey !== lastKey) return preferredFactor;

  const selected = selectNextFact(candidates, now, rng, lastKey);
  const factors = selected.key.split('x').map(Number);
  return factors[factors[0] === table ? 1 : 0];
}

export function buildFactCandidates(
  tables: readonly number[],
  progress: FactProgressMap,
  factors: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
): FactProgress[] {
  const candidates = new Map<string, FactProgress>();

  for (const table of tables) {
    for (const factor of factors) {
      const menor = Math.min(table, factor);
      const maior = Math.max(table, factor);
      const key = `${menor}x${maior}`;
      if (!candidates.has(key)) candidates.set(key, progress[key] ?? createFactProgress(key));
    }
  }

  return [...candidates.values()];
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
