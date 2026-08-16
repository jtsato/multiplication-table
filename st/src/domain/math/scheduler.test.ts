import { describe, expect, it } from "vitest";
import { createFact } from "./facts";
import { chooseNextFact } from "./scheduler";
import { createFactProgress } from "./mastery";

describe("fact scheduler", () => {
  it("prefers a new fact before a recently mastered fact", () => {
    const newFact = createFactProgress(createFact(2, 5));
    const mastered = {
      ...createFactProgress(createFact(9, 9)),
      mastery: 1,
      state: "mastered" as const,
      independentCorrect: 3,
      independentDays: [1, 2, 3],
      lastSeenDay: 3,
    };

    expect(chooseNextFact([mastered, newFact], 3, 10, 7)).toEqual(newFact.fact);
  });

  it("returns a deterministic fact for a seeded tie", () => {
    const progress = [createFactProgress(createFact(2, 5)), createFactProgress(createFact(3, 4))];

    expect(chooseNextFact(progress, 1, 99, 12)).toEqual(chooseNextFact(progress, 1, 99, 12));
  });
});
