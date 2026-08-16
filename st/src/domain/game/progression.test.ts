import { describe, expect, it } from "vitest";
import { getChapterForDay } from "./progression";

describe("store progression", () => {
  it("advances chapters through visible day milestones", () => {
    expect(getChapterForDay(1).number).toBe(1);
    expect(getChapterForDay(3).number).toBe(2);
    expect(getChapterForDay(7).number).toBe(3);
  });
});
