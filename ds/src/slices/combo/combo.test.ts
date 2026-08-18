import { describe, expect, it } from "vitest";
import { nextCombo } from "./combo";

describe("nextCombo", () => {
  it("incrementa o combo em um acerto", () => {
    expect(nextCombo(0, true)).toBe(1);
    expect(nextCombo(2, true)).toBe(3);
  });

  it("zera o combo em um erro", () => {
    expect(nextCombo(5, false)).toBe(0);
    expect(nextCombo(0, false)).toBe(0);
  });
});
