import type { MultiplicationFact } from "./facts";

export type FactState = "new" | "learning" | "consolidating" | "mastered";

export type FactProgress = {
  fact: MultiplicationFact;
  attempts: number;
  independentCorrect: number;
  supportedCorrect: number;
  mastery: number;
  lastSeenDay?: number;
  lastHintDepth?: number;
  independentDays: number[];
  state: FactState;
};

export type Attempt = {
  outcome: "correct" | "incorrect";
  hintLevel: number;
  day: number;
};

const INDEPENDENT_REWARD = 0.18;
const SUPPORTED_REWARDS: Record<number, number> = { 1: 0.1, 2: 0.06, 3: 0.03 };

export function createFactProgress(fact: MultiplicationFact): FactProgress {
  return {
    fact,
    attempts: 0,
    independentCorrect: 0,
    supportedCorrect: 0,
    mastery: 0,
    independentDays: [],
    state: "new",
  };
}

export function applyAttempt(progress: FactProgress, attempt: Attempt): FactProgress {
  const independent = attempt.outcome === "correct" && attempt.hintLevel === 0;
  const supported = attempt.outcome === "correct" && attempt.hintLevel > 0;
  const change =
    attempt.outcome === "incorrect"
      ? -0.03
      : attempt.hintLevel === 0
        ? INDEPENDENT_REWARD
        : (SUPPORTED_REWARDS[attempt.hintLevel] ?? 0);
  const independentDays =
    independent && !progress.independentDays.includes(attempt.day)
      ? [...progress.independentDays, attempt.day]
      : progress.independentDays;
  const nextMastery = Math.max(0, Math.min(1, progress.mastery + change));

  return {
    ...progress,
    attempts: progress.attempts + 1,
    independentCorrect: progress.independentCorrect + (independent ? 1 : 0),
    supportedCorrect: progress.supportedCorrect + (supported ? 1 : 0),
    mastery: nextMastery,
    lastSeenDay: attempt.day,
    lastHintDepth: attempt.hintLevel,
    independentDays,
    state: deriveState(
      nextMastery,
      progress.independentCorrect + (independent ? 1 : 0),
      independentDays,
    ),
  };
}

function deriveState(
  mastery: number,
  independentCorrect: number,
  independentDays: number[],
): FactState {
  if (mastery >= 0.75 && independentCorrect >= 3 && independentDays.length >= 2) return "mastered";
  if (mastery >= 0.45) return "consolidating";
  if (mastery > 0) return "learning";
  return "new";
}
