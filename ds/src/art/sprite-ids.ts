/**
 * Identificadores dos sprites de monstro (src/art/MonsterAvatar).
 * Separados do componente para o fast refresh funcionar.
 */
export const MONSTER_SPRITE_IDS = [
  "avenger",
  "tiamat",
  "shadow-demon",
  "decay",
  "keleog",
  "darkling",
  "lizardmen",
  "bullywugs",
  "warduke",
  "beholder",
] as const;

export type MonsterSpriteId = (typeof MONSTER_SPRITE_IDS)[number];
