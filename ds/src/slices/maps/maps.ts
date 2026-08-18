import type { MessageKey } from "../../shared/i18n/i18n";
import type { MonsterSpec } from "../battle/battle.types";
import type { MonsterSpriteId } from "../../art/sprite-ids";

/** Temas visuais dos mapas 2D (inspiração 32 bits dos anos 90). */
export const MAP_THEME_IDS = [
  "meadow",
  "desert",
  "forest",
  "cave",
  "ice",
  "volcano",
  "sky",
  "castle",
  "void",
] as const;
export type MapThemeId = (typeof MAP_THEME_IDS)[number];

export interface MapSpec {
  /** Tabuada do mapa (2 a 10). */
  table: number;
  theme: MapThemeId;
  nameKey: MessageKey;
  /** Inimigo comum do mapa. */
  minion: MonsterSpec;
  /** Chefão do mapa: usa as multiplicações mais difíceis (?x6 a ?x9). */
  boss: MonsterSpec;
}

function encounter(
  id: MonsterSpriteId,
  nameKey: MessageKey,
  maxHp: number,
  damage: number,
): MonsterSpec {
  return { id, nameKey, maxHp, damage };
}

/** Um mapa para cada tabuada, do 2 ao 10. */
export const MAPS: MapSpec[] = [
  {
    table: 2,
    theme: "meadow",
    nameKey: "map.meadow",
    minion: encounter("avenger", "monster.avenger", 20, 5),
    boss: encounter("tiamat", "monster.tiamat", 26, 6),
  },
  {
    table: 3,
    theme: "desert",
    nameKey: "map.desert",
    minion: encounter("shadow-demon", "monster.shadowDemon", 18, 4),
    boss: encounter("decay", "monster.decay", 28, 5),
  },
  {
    table: 4,
    theme: "forest",
    nameKey: "map.forest",
    minion: encounter("keleog", "monster.keleog", 22, 5),
    boss: encounter("darkling", "monster.darkling", 34, 6),
  },
  {
    table: 5,
    theme: "cave",
    nameKey: "map.cave",
    minion: encounter("lizardmen", "monster.lizardmen", 26, 6),
    boss: encounter("bullywugs", "monster.bullywugs", 40, 7),
  },
  {
    table: 6,
    theme: "ice",
    nameKey: "map.ice",
    minion: encounter("warduke", "monster.warduke", 30, 7),
    boss: encounter("beholder", "monster.beholder", 48, 8),
  },
  {
    table: 7,
    theme: "volcano",
    nameKey: "map.volcano",
    minion: encounter("avenger", "monster.avenger", 34, 8),
    boss: encounter("tiamat", "monster.tiamat", 56, 9),
  },
  {
    table: 8,
    theme: "sky",
    nameKey: "map.sky",
    minion: encounter("shadow-demon", "monster.shadowDemon", 38, 9),
    boss: encounter("decay", "monster.decay", 64, 10),
  },
  {
    table: 9,
    theme: "castle",
    nameKey: "map.castle",
    minion: encounter("keleog", "monster.keleog", 42, 10),
    boss: encounter("darkling", "monster.darkling", 72, 12),
  },
  {
    table: 10,
    theme: "void",
    nameKey: "map.void",
    minion: encounter("lizardmen", "monster.lizardmen", 46, 11),
    boss: encounter("beholder", "monster.beholder", 90, 14),
  },
];

/** Cada mapa tem um inimigo comum e um chefão. */
export const ENCOUNTERS_PER_MAP = 2;
export const TOTAL_ENCOUNTERS = MAPS.length * ENCOUNTERS_PER_MAP;
