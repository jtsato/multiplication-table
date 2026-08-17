import { describe, expect, it } from "vitest";
import { HERO_BASE_DAMAGE, playerAttackDamage } from "./player-attack";

describe("playerAttackDamage", () => {
  it("retorna o dano base informado", () => {
    expect(playerAttackDamage(6)).toBe(6);
  });

  it("nunca causa dano negativo", () => {
    expect(playerAttackDamage(-3)).toBe(0);
  });

  it("retorna zero para dano nulo", () => {
    expect(playerAttackDamage(0)).toBe(0);
  });

  it("o dano base do herói é fixado", () => {
    expect(HERO_BASE_DAMAGE).toBe(6);
  });
});
