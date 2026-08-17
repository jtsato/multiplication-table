import { describe, expect, it } from "vitest";
import { createBattle, battleReducer, hpRatio } from "./battle";
import { SLIME } from "./monsters";
import type { BattleState } from "./battle.types";

describe("createBattle", () => {
  const battle: BattleState = createBattle(SLIME);

  it("começa na fase intro", () => {
    expect(battle.phase).toBe("intro");
  });

  it("herói nasce com HP cheio", () => {
    expect(battle.hero.hp).toBe(battle.hero.maxHp);
    expect(battle.hero.maxHp).toBeGreaterThan(0);
    expect(battle.hero.nameKey).toBe("battle.hero");
  });

  it("monstro nasce com HP cheio e mantém sua especificação", () => {
    expect(battle.monster.hp).toBe(SLIME.maxHp);
    expect(battle.monster.maxHp).toBe(SLIME.maxHp);
    expect(battle.monster.nameKey).toBe("monster.slime");
  });

  it("combo e super ataque começam zerados", () => {
    expect(battle.combo).toBe(0);
    expect(battle.superReady).toBe(false);
  });

  it("começa com registro de batalha vazio", () => {
    expect(battle.log).toEqual([]);
  });
});

describe("battleReducer", () => {
  it("START_BATTLE cria uma batalha nova e íntegra", () => {
    const anterior: BattleState = createBattle(SLIME);
    const novo = battleReducer(anterior, { type: "START_BATTLE", monster: SLIME });

    expect(novo).not.toBe(anterior);
    expect(novo.phase).toBe("intro");
    expect(novo.hero.hp).toBe(novo.hero.maxHp);
    expect(novo.monster.hp).toBe(SLIME.maxHp);
    expect(novo.combo).toBe(0);
    expect(novo.superReady).toBe(false);
  });

  it("ações desconhecidas são ignoradas (estado preservado)", () => {
    const estado: BattleState = createBattle(SLIME);
    expect(battleReducer(estado, { type: "ACÃO_DESCONHECIDA" } as never)).toBe(estado);
  });
});

describe("hpRatio", () => {
  it("calcula a proporção normal de HP", () => {
    expect(hpRatio(10, 20)).toBe(0.5);
  });

  it("nunca fica abaixo de 0", () => {
    expect(hpRatio(-5, 20)).toBe(0);
  });

  it("nunca ultrapassa 1", () => {
    expect(hpRatio(30, 20)).toBe(1);
  });

  it("retorna 0 quando o HP máximo é inválido", () => {
    expect(hpRatio(10, 0)).toBe(0);
    expect(hpRatio(10, -1)).toBe(0);
  });

  it("retorna 1 quando HP é igual ao máximo", () => {
    expect(hpRatio(20, 20)).toBe(1);
  });
});
