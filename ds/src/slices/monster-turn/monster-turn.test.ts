import { describe, expect, it } from "vitest";
import { monsterAttackDamage, takeMonsterTurn } from "./monster-turn";
import { SLIME } from "../battle/monsters";

describe("monsterAttackDamage", () => {
  it("retorna o dano base informado", () => {
    expect(monsterAttackDamage(5)).toBe(5);
  });

  it("nunca causa dano negativo", () => {
    expect(monsterAttackDamage(-2)).toBe(0);
  });
});

describe("takeMonsterTurn", () => {
  it("reduz o HP do herói pelo dano do monstro", () => {
    expect(takeMonsterTurn(30, SLIME)).toBe(30 - SLIME.damage);
  });

  it("nunca deixa o HP do herói abaixo de 0", () => {
    expect(takeMonsterTurn(3, SLIME)).toBe(0);
    expect(takeMonsterTurn(0, SLIME)).toBe(0);
  });

  it("o slime tem dano base fixado", () => {
    expect(SLIME.damage).toBe(5);
  });
});
