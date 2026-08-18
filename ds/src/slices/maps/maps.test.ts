import { describe, expect, it } from "vitest";
import { ENCOUNTERS_PER_MAP, MAPS, TOTAL_ENCOUNTERS } from "./maps";

describe("maps", () => {
  it("tem um mapa para cada tabuada do 2 ao 10", () => {
    expect(MAPS.map((map) => map.table)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("todos os mapas têm tema, nome, inimigo comum e chefão", () => {
    for (const map of MAPS) {
      expect(map.theme).toBeTruthy();
      expect(map.nameKey).toMatch(/^map\./);
      expect(map.minion.maxHp).toBeGreaterThan(0);
      expect(map.boss.maxHp).toBeGreaterThan(map.minion.maxHp);
      expect(map.boss.damage).toBeGreaterThanOrEqual(map.minion.damage);
    }
  });

  it("os chefões ficam mais fortes conforme a jornada avança", () => {
    const bossHps = MAPS.map((map) => map.boss.maxHp);
    expect([...bossHps].sort((a, b) => a - b)).toEqual(bossHps);
  });

  it("cada mapa tem exatamente dois encontros (inimigo comum + chefão)", () => {
    expect(ENCOUNTERS_PER_MAP).toBe(2);
    expect(TOTAL_ENCOUNTERS).toBe(MAPS.length * 2);
  });
});
