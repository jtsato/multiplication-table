import type { MonsterSpec } from "./battle.types";

/** Catálogo de monstros. A progressão (Slice 8) amplia este acervo. */
export const MONSTERS: Record<string, MonsterSpec> = {
  slime: {
    id: "slime",
    nameKey: "monster.slime",
    maxHp: 20,
  },
};

export const SLIME: MonsterSpec = MONSTERS.slime;
