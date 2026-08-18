import { describe, expect, it } from "vitest";
import { monsterAttackDamage, takeMonsterTurn } from "./monster-turn";
import { AVENGER } from "../battle/monsters";

describe("monsterAttackDamage", () => {
  it("retorna o dano base informado", () => {
    expect(monsterAttackDamage(5)).toBe(5);
  });

  it("nunca causa dano negativo", () => {
    expect(monsterAttackDamage(-2)).toBe(0);
  });
});

describe("takeMonsterTurn", () => {
  it("cada erro custa 1 ponto de tolerância", () => {
    expect(takeMonsterTurn(3, AVENGER)).toBe(2);
    expect(takeMonsterTurn(2, AVENGER)).toBe(1);
  });

  it("o terceiro erro zera o HP do herói", () => {
    expect(takeMonsterTurn(1, AVENGER)).toBe(0);
  });

  it("nunca deixa o HP do herói abaixo de 0", () => {
    expect(takeMonsterTurn(0, AVENGER)).toBe(0);
  });

  it("o dano do monstro continua existindo para o feedback", () => {
    expect(AVENGER.damage).toBe(5);
  });
});
