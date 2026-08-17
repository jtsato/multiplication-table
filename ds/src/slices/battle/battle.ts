import type { BattleAction, BattleState, MonsterSpec } from "./battle.types";
import { HERO_BASE_DAMAGE, playerAttackDamage } from "../player-attack/player-attack";
import { monsterAttackDamage, takeMonsterTurn } from "../monster-turn/monster-turn";
import { nextCombo } from "../combo/combo";
import { canUseSuper, superAttackDamage } from "../super-attack/super-attack";

export const HERO_MAX_HP = 30;

/** Estado inicial de uma batalha contra o monstro dado. */
export function createBattle(monster: MonsterSpec): BattleState {
  return {
    phase: "intro",
    hero: { nameKey: "battle.hero", maxHp: HERO_MAX_HP, hp: HERO_MAX_HP },
    monster: { ...monster, hp: monster.maxHp },
    question: null,
    alternatives: [],
    combo: 0,
    superReady: false,
    log: [],
  };
}

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case "START_BATTLE":
      return createBattle(action.monster);
    case "BEGIN_QUESTION":
      return {
        ...state,
        phase: "question",
        question: action.question,
        alternatives: action.alternatives,
      };
    case "ANSWER": {
      if (state.phase !== "question" || !state.question) return state;
      const { question } = state;
      if (action.value === question.answer) {
        const damage = playerAttackDamage(HERO_BASE_DAMAGE);
        const hp = Math.max(0, Math.min(state.monster.maxHp, state.monster.hp - damage));
        const combo = nextCombo(state.combo, true);
        return {
          ...state,
          monster: { ...state.monster, hp },
          combo,
          superReady: canUseSuper(combo),
          phase: hp === 0 ? "victory" : "hero-turn",
          log: [...state.log, { key: "battle.correct", params: { damage } }],
        };
      }
      const damage = monsterAttackDamage(state.monster.damage);
      const heroHp = takeMonsterTurn(state.hero.hp, state.monster);
      return {
        ...state,
        hero: { ...state.hero, hp: heroHp },
        combo: 0, // erro sempre zera a sequência
        superReady: false, // erro sempre remove o super ataque
        phase: heroHp === 0 ? "defeat" : "monster-turn",
        log: [
          ...state.log,
          {
            key: "battle.almost",
            params: { a: question.a, b: question.b, answer: question.answer, damage },
          },
        ],
      };
    }
    case "USE_SUPER_ATTACK": {
      if (!state.superReady || state.phase !== "question") return state;
      const damage = superAttackDamage(HERO_BASE_DAMAGE, state.combo);
      const hp = Math.max(0, Math.min(state.monster.maxHp, state.monster.hp - damage));
      return {
        ...state,
        monster: { ...state.monster, hp },
        combo: 0, // o super consome toda a sequência
        superReady: false,
        phase: hp === 0 ? "victory" : "hero-turn",
        log: [...state.log, { key: "battle.super", params: { damage } }],
      };
    }
    default:
      return state;
  }
}

/** Proporção de HP (0..1), usada pelas barras do HUD. */
export function hpRatio(hp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return Math.min(1, Math.max(0, hp / maxHp));
}
