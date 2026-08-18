import { describe, expect, it } from "vitest";
import { XP_BASE, XP_MULTIPLIER_MAX, XP_MULTIPLIER_STEP, xpMultiplier, xpReward } from "./xp";

describe("xpMultiplier", () => {
  it("começa em ×1 no primeiro acerto", () => {
    expect(xpMultiplier(1)).toBe(1);
  });

  it("cresce 0,5 a cada acerto consecutivo", () => {
    expect(xpMultiplier(2)).toBe(1.5);
    expect(xpMultiplier(3)).toBe(2);
    expect(xpMultiplier(4)).toBe(2.5);
  });

  it("respeita o teto configurado", () => {
    expect(XP_MULTIPLIER_MAX).toBe(3);
    expect(xpMultiplier(5)).toBe(3);
    expect(xpMultiplier(99)).toBe(3);
  });

  it("combo zerado não quebra (retorna ×1)", () => {
    expect(xpMultiplier(0)).toBe(1);
  });
});

describe("xpReward", () => {
  it("concede XP base no primeiro acerto", () => {
    expect(XP_BASE).toBe(10);
    expect(xpReward(1)).toBe(10);
  });

  it("arredonda o XP com multiplicador", () => {
    expect(xpReward(2)).toBe(15);
    expect(xpReward(3)).toBe(20);
    expect(xpReward(5)).toBe(30);
  });

  it("constantes de passo e teto são coerentes", () => {
    expect(XP_MULTIPLIER_STEP).toBe(0.5);
    expect(XP_MULTIPLIER_MAX).toBeGreaterThan(1);
  });
});
