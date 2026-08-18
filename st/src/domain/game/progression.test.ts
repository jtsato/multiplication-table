import { describe, expect, it } from "vitest";
import { getChapterForDay } from "./progression";

describe("store progression", () => {
  it("advances chapters through visible day milestones", () => {
    expect(getChapterForDay(1).number).toBe(1);
    expect(getChapterForDay(3).number).toBe(2);
    expect(getChapterForDay(7).number).toBe(3);
    expect(getChapterForDay(12).number).toBe(4);
  });

  it("falls back to chapter 1 before the first milestone", () => {
    expect(getChapterForDay(0)).toMatchObject({
      number: 1,
      title: "A porta aberta",
      requiredDay: 1,
      visualChange: "balcão novo",
    });
    expect(getChapterForDay(-5).number).toBe(1);
  });

  it("keeps the previous chapter until the next day milestone", () => {
    expect(getChapterForDay(2).number).toBe(1);
    expect(getChapterForDay(6).number).toBe(2);
    expect(getChapterForDay(11).number).toBe(3);
  });

  it("exposes the chapter titles and visual changes", () => {
    expect(getChapterForDay(3).title).toBe("Mais ideias na prateleira");
    expect(getChapterForDay(3).visualChange).toBe("prateleira lateral");
    expect(getChapterForDay(7).title).toBe("A loja ganha espaço");
    expect(getChapterForDay(7).visualChange).toBe("área de exposição");
    expect(getChapterForDay(12).title).toBe("Uma loja cheia de histórias");
    expect(getChapterForDay(12).visualChange).toBe("fachada iluminada");
  });
});
