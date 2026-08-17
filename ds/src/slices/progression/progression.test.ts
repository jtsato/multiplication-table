import { describe, expect, it } from "vitest";
import {
  advanceProgress,
  initialProgress,
  isGameComplete,
  migrateProgress,
  nextMonster,
  nextTables,
} from "./progression";
import { MONSTER_SEQUENCE, SLIME, DRAGON, GOLEM } from "../battle/monsters";

describe("progression", () => {
  it("começa no estágio 0", () => {
    expect(initialProgress()).toEqual({ stage: 0 });
  });

  it("cada estágio tem seu monstro na sequência", () => {
    expect(MONSTER_SEQUENCE).toEqual([SLIME, DRAGON, GOLEM]);
    expect(nextMonster(initialProgress())).toBe(SLIME);
    expect(nextMonster({ stage: 1 })).toBe(DRAGON);
    expect(nextMonster({ stage: 2 })).toBe(GOLEM);
  });

  it("a sequência de tabuadas desbloqueia progressivamente", () => {
    expect(nextTables({ stage: 0 })).toEqual([2, 3, 4]);
    expect(nextTables({ stage: 1 })).toEqual([2, 3, 4, 5, 6]);
    expect(nextTables({ stage: 2 })).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("monstros e tabuadas não estouram após o fim da sequência", () => {
    expect(nextMonster({ stage: 99 })).toBe(GOLEM);
    expect(nextTables({ stage: 99 })).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("advanceProgress avança um estágio e trava no fim", () => {
    expect(advanceProgress({ stage: 0 })).toEqual({ stage: 1 });
    expect(advanceProgress({ stage: 2 })).toEqual({ stage: 3 });
  });

  it("isGameComplete marca o fim da sequência", () => {
    expect(isGameComplete({ stage: 0 })).toBe(false);
    expect(isGameComplete({ stage: 2 })).toBe(false);
    expect(isGameComplete({ stage: 3 })).toBe(true);
  });

  it("migrateProgress aceita um estágio válido", () => {
    expect(migrateProgress({ stage: 1 })).toEqual({ stage: 1 });
  });

  it("migrateProgress rejeita estágio inválido", () => {
    expect(() => migrateProgress(null)).toThrow(/progresso/);
    expect(() => migrateProgress("texto")).toThrow(/progresso/);
    expect(() => migrateProgress({ stage: -1 })).toThrow(/estágio/);
    expect(() => migrateProgress({ stage: "x" })).toThrow(/estágio/);
  });
});
