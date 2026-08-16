import type { MultiplicationFact } from "./facts";
import type { FactProgress } from "./mastery";
import { seededShuffle } from "./rng";

export function chooseNextFact(progress: FactProgress[], day: number, maxFactor: number, seed: number): MultiplicationFact {
  const eligible = progress.filter(({ fact }) => fact.a <= maxFactor && fact.b <= maxFactor);
  const ordered = [...eligible].sort((left, right) => score(right, day) - score(left, day));
  const bestScore = score(ordered[0], day);
  const ties = ordered.filter((candidate) => score(candidate, day) === bestScore);
  return seededShuffle(ties, seed)[0].fact;
}

function score(progress: FactProgress, day: number): number {
  if (progress.state === "new") return 100;
  if (progress.state === "mastered") return day - (progress.lastSeenDay ?? day) >= 5 ? 70 : 0;
  return 80 - progress.mastery * 30 + (day - (progress.lastSeenDay ?? 0));
}
