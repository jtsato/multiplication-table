import { describe, expect, it } from "vitest";
import { createFact } from "./facts";
import { applyAttempt, createFactProgress } from "./mastery";

describe("math mastery", () => {
  it("rewards an independent correct answer and clamps mastery", () => {
    const initial = createFactProgress(createFact(6, 7));
    const updated = applyAttempt(initial, { outcome: "correct", hintLevel: 0, day: 1 });

    expect(updated.mastery).toBeCloseTo(0.18);
    expect(updated.independentCorrect).toBe(1);
    expect(updated.state).toBe("learning");
  });

  it("gives smaller rewards when the answer needs help", () => {
    const initial = createFactProgress(createFact(6, 7));
    const updated = applyAttempt(initial, { outcome: "correct", hintLevel: 2, day: 1 });

    expect(updated.mastery).toBeCloseTo(0.06);
    expect(updated.supportedCorrect).toBe(1);
  });

  it("requires independent practice across days to become mastered", () => {
    let progress = createFactProgress(createFact(6, 7));
    for (const day of [1, 2, 3, 4, 5, 6]) {
      progress = applyAttempt(progress, { outcome: "correct", hintLevel: 0, day });
    }

    expect(progress.mastery).toBe(1);
    expect(progress.state).toBe("mastered");
  });
});
