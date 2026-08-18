import { describe, expect, it } from "vitest";
import {
  advanceProgress,
  currentMap,
  currentMapIndex,
  initialProgress,
  isBossEncounter,
  isGameComplete,
  migrateProgress,
  nextMapTable,
  nextMonster,
} from "./progression";
import { MAPS, TOTAL_ENCOUNTERS } from "../maps/maps";

describe("progression", () => {
  it("começa no estágio 0 (inimigo comum do mapa 2)", () => {
    expect(initialProgress()).toEqual({ stage: 0 });
    expect(currentMapIndex(initialProgress())).toBe(0);
    expect(nextMapTable(initialProgress())).toBe(2);
    expect(isBossEncounter(initialProgress())).toBe(false);
  });

  it("cada mapa tem inimigo comum e chefão antes de avançar", () => {
    expect(nextMonster({ stage: 0 })).toEqual(MAPS[0].minion);
    expect(nextMonster({ stage: 1 })).toEqual(MAPS[0].boss);
    expect(isBossEncounter({ stage: 1 })).toBe(true);
    expect(nextMonster({ stage: 2 })).toEqual(MAPS[1].minion);
    expect(isBossEncounter({ stage: 2 })).toBe(false);
  });

  it("percorre os nove mapas na ordem das tabuadas", () => {
    for (let i = 0; i < MAPS.length; i += 1) {
      const progress = { stage: i * 2 };
      expect(currentMap(progress)).toBe(MAPS[i]);
      expect(nextMapTable(progress)).toBe(MAPS[i].table);
    }
  });

  it("monstros e mapas não estouram após o fim da jornada", () => {
    const fim = { stage: 99 };
    expect(currentMap(fim)).toBe(MAPS[MAPS.length - 1]);
    expect(nextMapTable(fim)).toBe(10);
    expect(nextMonster(fim)).toEqual(MAPS[MAPS.length - 1].boss);
  });

  it("advanceProgress avança um encontro e trava no fim", () => {
    expect(advanceProgress({ stage: 0 })).toEqual({ stage: 1 });
    expect(advanceProgress({ stage: TOTAL_ENCOUNTERS - 1 })).toEqual({
      stage: TOTAL_ENCOUNTERS,
    });
    expect(advanceProgress({ stage: TOTAL_ENCOUNTERS })).toEqual({ stage: TOTAL_ENCOUNTERS });
  });

  it("isGameComplete marca o fim da jornada (todos os chefões)", () => {
    expect(isGameComplete({ stage: 0 })).toBe(false);
    expect(isGameComplete({ stage: TOTAL_ENCOUNTERS - 1 })).toBe(false);
    expect(isGameComplete({ stage: TOTAL_ENCOUNTERS })).toBe(true);
  });

  it("migrateProgress aceita um estágio válido", () => {
    expect(migrateProgress({ stage: 1 })).toEqual({ stage: 1 });
  });

  it("migrateProgress rejeita estágio inválido", () => {
    expect(() => migrateProgress(null)).toThrow("progresso inválido");
    expect(() => migrateProgress("texto")).toThrow("progresso inválido");
    expect(() => migrateProgress({ stage: -1 })).toThrow(/estágio/);
    expect(() => migrateProgress({ stage: "x" })).toThrow(/estágio/);
  });
});
