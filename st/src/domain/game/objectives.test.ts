import { describe, expect, it } from "vitest";
import { createDailyObjective } from "./objectives";

describe("optional objectives", () => {
  it("creates deterministic objectives without making them mandatory", () => {
    expect(createDailyObjective(10)).toEqual(createDailyObjective(10));
    expect(createDailyObjective(10).requiredVisits).toBeGreaterThanOrEqual(3);
  });
});
