import type { MonsterSpec } from "./battle.types";

/**
 * Catálogo de monstros da jornada (em ordem de dificuldade).
 * O `id` casa com os sprites de src/art/MonsterAvatar.
 */
export const MONSTERS: Record<string, MonsterSpec> = {
  avenger: {
    id: "avenger",
    nameKey: "monster.avenger",
    maxHp: 20,
    damage: 5,
  },
  tiamat: {
    id: "tiamat",
    nameKey: "monster.tiamat",
    maxHp: 26,
    damage: 6,
  },
  "shadow-demon": {
    id: "shadow-demon",
    nameKey: "monster.shadowDemon",
    maxHp: 32,
    damage: 7,
  },
  decay: {
    id: "decay",
    nameKey: "monster.decay",
    maxHp: 38,
    damage: 8,
  },
  keleog: {
    id: "keleog",
    nameKey: "monster.keleog",
    maxHp: 44,
    damage: 9,
  },
  darkling: {
    id: "darkling",
    nameKey: "monster.darkling",
    maxHp: 50,
    damage: 10,
  },
  lizardmen: {
    id: "lizardmen",
    nameKey: "monster.lizardmen",
    maxHp: 56,
    damage: 11,
  },
  bullywugs: {
    id: "bullywugs",
    nameKey: "monster.bullywugs",
    maxHp: 62,
    damage: 12,
  },
  warduke: {
    id: "warduke",
    nameKey: "monster.warduke",
    maxHp: 68,
    damage: 13,
  },
  beholder: {
    id: "beholder",
    nameKey: "monster.beholder",
    maxHp: 80,
    damage: 15,
  },
};

export const AVENGER: MonsterSpec = MONSTERS.avenger;
export const TIAMAT: MonsterSpec = MONSTERS.tiamat;
export const BEHOLDER: MonsterSpec = MONSTERS.beholder;

/** Ordem de aparição dos monstros na jornada (progressão). */
export const MONSTER_SEQUENCE: MonsterSpec[] = [
  MONSTERS.avenger,
  MONSTERS.tiamat,
  MONSTERS["shadow-demon"],
  MONSTERS.decay,
  MONSTERS.keleog,
  MONSTERS.darkling,
  MONSTERS.lizardmen,
  MONSTERS.bullywugs,
  MONSTERS.warduke,
  MONSTERS.beholder,
];
