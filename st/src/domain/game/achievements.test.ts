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

  it("requires five completed visits for the first-day achievement", () => {
    expect(
      evaluateAchievements({ completedVisits: 4, purchasedProducts: 0, chapter: 1 }),
    ).not.toContain("first-day");
    expect(
      evaluateAchievements({ completedVisits: 5, purchasedProducts: 0, chapter: 1 }),
    ).toContain("first-day");
  });

  it("requires at least one purchase for the first-expansion achievement", () => {
    expect(
      evaluateAchievements({ completedVisits: 0, purchasedProducts: 0, chapter: 1 }),
    ).not.toContain("first-expansion");
    expect(
      evaluateAchievements({ completedVisits: 0, purchasedProducts: 1, chapter: 1 }),
    ).toContain("first-expansion");
  });

  it("requires chapter 2 or later for the new-chapter achievement", () => {
    expect(
      evaluateAchievements({ completedVisits: 0, purchasedProducts: 0, chapter: 1 }),
    ).not.toContain("new-chapter");
    expect(
      evaluateAchievements({ completedVisits: 0, purchasedProducts: 0, chapter: 2 }),
    ).toContain("new-chapter");
  });

  it("returns all three achievements when every milestone is met", () => {
    expect(evaluateAchievements({ completedVisits: 5, purchasedProducts: 1, chapter: 2 })).toEqual([
      "first-day",
      "first-expansion",
      "new-chapter",
    ]);
  });

  it("returns an empty list for a fresh store", () => {
    expect(evaluateAchievements({ completedVisits: 0, purchasedProducts: 0, chapter: 1 })).toEqual(
      [],
    );
  });
});
