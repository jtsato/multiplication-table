import { describe, expect, it } from "vitest";
import { canUseSuper, superAttackDamage } from "./super-attack";

describe("canUseSuper", () => {
  it("não libera com combo abaixo do cheio", () => {
    expect(canUseSuper(0)).toBe(false);
    expect(canUseSuper(2)).toBe(false);
  });

  it("libera a partir do combo cheio", () => {
    expect(canUseSuper(3)).toBe(true);
    expect(canUseSuper(5)).toBe(true);
  });
});

describe("superAttackDamage", () => {
  it("escala o dano com o combo acumulado", () => {
    expect(superAttackDamage(6, 3)).toBe(18);
    expect(superAttackDamage(10, 2)).toBe(20);
  });

  it("sem combo não causa dano", () => {
    expect(superAttackDamage(6, 0)).toBe(0);
  });
});
