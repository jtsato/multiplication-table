import { describe, expect, it } from "vitest";
import { evaluateAchievements } from "./achievements";

describe("store achievements", () => {
  it("rewards shop milestones instead of perfect math", () => {
    expect(evaluateAchievements({ completedVisits: 5, purchasedProducts: 1, chapter: 1 })).toEqual([
      "first-day",
      "first-expansion",
    ]);
    expect(
      evaluateAchievements({ completedVisits: 5, purchasedProducts: 0, chapter: 1 }),
    ).not.toContain("perfect-day");
  });
});
