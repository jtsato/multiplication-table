import type { MonsterSpec } from "./battle.types";

/** Catálogo de monstros. A progressão usa MONSTER_SEQUENCE. */
export const MONSTERS: Record<string, MonsterSpec> = {
  slime: {
    id: "slime",
    nameKey: "monster.slime",
    maxHp: 20,
    damage: 5,
  },
  dragon: {
    id: "dragon",
    nameKey: "monster.dragon",
    maxHp: 30,
    damage: 7,
  },
  golem: {
    id: "golem",
    nameKey: "monster.golem",
    maxHp: 40,
    damage: 8,
  },
};

export const SLIME: MonsterSpec = MONSTERS.slime;
export const DRAGON: MonsterSpec = MONSTERS.dragon;
export const GOLEM: MonsterSpec = MONSTERS.golem;

/** Ordem de aparição dos monstros na jornada (progressão). */
export const MONSTER_SEQUENCE: MonsterSpec[] = [SLIME, DRAGON, GOLEM];
