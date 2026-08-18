import { describe, expect, it } from "vitest";
import { createFact } from "./facts";
import { getHint } from "./hints";

describe("progressive hints", () => {
  const fact = createFact(6, 7);

  it("starts with a contextual reminder", () => {
    expect(getHint(fact, 1)).toEqual({
      level: 1,
      text: "Confira a quantidade e o preço de cada item.",
    });
  });

  it("shows concrete items after the second mistake", () => {
    expect(getHint(fact, 2)).toEqual({ level: 2, text: "6 produtos · R$ 7 cada" });
  });

  it("returns no hint before the first mistake", () => {
    expect(getHint(fact, 0)).toEqual({ level: 0, text: "" });
  });

  it("clamps the error count to the hint range", () => {
    expect(getHint(fact, -3)).toEqual({ level: 0, text: "" });
    expect(getHint(fact, 2.9)).toEqual({ level: 2, text: "6 produtos · R$ 7 cada" });
    expect(getHint(fact, 99)).toEqual({ level: 4, text: "6 × 7 = 42" });
  });

  it("shows repeated addition and the complete relation", () => {
    expect(getHint(fact, 3)).toEqual({ level: 3, text: "7 + 7 + 7 + 7 + 7 + 7" });
    expect(getHint(fact, 4)).toEqual({ level: 4, text: "6 × 7 = 42" });
  });
});
