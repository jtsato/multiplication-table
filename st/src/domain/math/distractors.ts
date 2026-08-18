import type { MultiplicationFact } from "./facts";
import { seededShuffle } from "./rng";

export type DistractorStrategy =
  | "near_fact"
  | "square_fact"
  | "adjacent_multiplier"
  | "addition_like"
  | "quantity_price_confusion"
  | "fallback";

export type Alternative = {
  value: number;
  isCorrect: boolean;
  strategy: DistractorStrategy;
};

type Candidate = Omit<Alternative, "isCorrect">;

export function generateAlternatives(fact: MultiplicationFact, seed: number): Alternative[] {
  const candidates: Candidate[] = [
    { value: fact.a * fact.a, strategy: "square_fact" },
    { value: fact.b * fact.b, strategy: "square_fact" },
    { value: (fact.a - 1) * fact.b, strategy: "near_fact" },
    { value: fact.a * (fact.b - 1), strategy: "adjacent_multiplier" },
    { value: fact.a + fact.b, strategy: "addition_like" },
    { value: fact.a, strategy: "quantity_price_confusion" },
    { value: fact.b, strategy: "quantity_price_confusion" },
  ];

  const unique = candidates.filter(
    (candidate, index, all) =>
      candidate.value > 0 &&
      candidate.value !== fact.answer &&
      all.findIndex((other) => other.value === candidate.value) === index,
  );
  const selected = unique.slice(0, 2);
  let fallback = 1;
  while (selected.length < 2) {
    if (fallback !== fact.answer && !selected.some((candidate) => candidate.value === fallback)) {
      selected.push({ value: fallback, strategy: "fallback" });
    }
    fallback += 1;
  }

  return seededShuffle(
    [
      { value: fact.answer, isCorrect: true, strategy: "fallback" as const },
      ...selected.map((candidate) => ({ ...candidate, isCorrect: false })),
    ],
    seed,
  );
}
