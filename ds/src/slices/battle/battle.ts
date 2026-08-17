import type { BattleAction, BattleState, MonsterSpec } from "./battle.types";

export const HERO_MAX_HP = 30;

/** Estado inicial de uma batalha contra o monstro dado. */
export function createBattle(monster: MonsterSpec): BattleState {
  return {
    phase: "intro",
    hero: { nameKey: "battle.hero", maxHp: HERO_MAX_HP, hp: HERO_MAX_HP },
    monster: { ...monster, hp: monster.maxHp },
    combo: 0,
    superReady: false,
    log: [],
  };
}

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case "START_BATTLE":
      return createBattle(action.monster);
    default:
      return state;
  }
}

/** Proporção de HP (0..1), usada pelas barras do HUD. */
export function hpRatio(hp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return Math.min(1, Math.max(0, hp / maxHp));
}
