/**
 * Catálogo do mundo: ilhas (uma por tabuada), biomas e missões.
 * Adicionar uma tabuada nova = adicionar uma entrada em ISLANDS.
 */

export type SceneKind =
  | 'bridge'
  | 'tower'
  | 'lighthouse'
  | 'trees'
  | 'boat'
  | 'gate'
  | 'windmill'
  | 'house'
  | 'fence';

export interface BiomePalette {
  /** Céu de cima e de baixo (gradiente). */
  skyTop: string;
  skyBottom: string;
  ground: string;
  groundDark: string;
  water: string;
  accent: string;
  prop: string;
}

export interface MissionDef {
  id: string;
  /** Chave i18n do título da missão. */
  titleKey: string;
  /** Chave i18n do briefing (fala do mascote). */
  briefKey: string;
  scene: SceneKind;
  questionCount: number;
  /** Missão final da ilha (desafio maior). */
  isFinal: boolean;
}

export interface IslandDef {
  /** Tabuada correspondente (2..10). */
  table: number;
  nameKey: string;
  biomeKey: string;
  palette: BiomePalette;
  missions: MissionDef[];
  /** Posição no mapa do arquipélago, em % do viewBox 1000x600. */
  map: { x: number; y: number };
}

function mission(
  id: string,
  scene: SceneKind,
  questionCount: number,
  isFinal = false,
): MissionDef {
  return {
    id,
    scene,
    questionCount,
    isFinal,
    titleKey: `missions.${scene}.title`,
    briefKey: `missions.${scene}.brief`,
  };
}

/** Três missões normais + um desafio final por ilha. */
function missionsFor(table: number, kinds: [SceneKind, SceneKind, SceneKind, SceneKind]): MissionDef[] {
  return [
    mission(`t${table}-m1`, kinds[0], 5),
    mission(`t${table}-m2`, kinds[1], 6),
    mission(`t${table}-m3`, kinds[2], 6),
    mission(`t${table}-final`, kinds[3], 8, true),
  ];
}

export const ISLANDS: IslandDef[] = [
  {
    table: 2,
    nameKey: 'islands.2.name',
    biomeKey: 'islands.2.biome',
    palette: {
      skyTop: '#7FD8FF',
      skyBottom: '#D9F5FF',
      ground: '#5BD07A',
      groundDark: '#37A45A',
      water: '#3FA9F5',
      accent: '#FFC53D',
      prop: '#FF6B6B',
    },
    missions: missionsFor(2, ['bridge', 'trees', 'house', 'tower']),
    map: { x: 130, y: 420 },
  },
  {
    table: 3,
    nameKey: 'islands.3.name',
    biomeKey: 'islands.3.biome',
    palette: {
      skyTop: '#8FE3C2',
      skyBottom: '#E3FBF0',
      ground: '#49B96B',
      groundDark: '#2E8049',
      water: '#2FB3C9',
      accent: '#FFE066',
      prop: '#3F8F5F',
    },
    missions: missionsFor(3, ['trees', 'bridge', 'fence', 'windmill']),
    map: { x: 275, y: 315 },
  },
  {
    table: 4,
    nameKey: 'islands.4.name',
    biomeKey: 'islands.4.biome',
    palette: {
      skyTop: '#A9C8FF',
      skyBottom: '#E8F0FF',
      ground: '#8E9BB5',
      groundDark: '#5D6880',
      water: '#4C7FE0',
      accent: '#7BE3FF',
      prop: '#B58CFF',
    },
    missions: missionsFor(4, ['gate', 'fence', 'house', 'tower']),
    map: { x: 415, y: 200 },
  },
  {
    table: 5,
    nameKey: 'islands.5.name',
    biomeKey: 'islands.5.biome',
    palette: {
      skyTop: '#FFD59E',
      skyBottom: '#FFF3DC',
      ground: '#FFE1A8',
      groundDark: '#E0B96F',
      water: '#31C3E8',
      accent: '#FF8A5B',
      prop: '#FF6B6B',
    },
    missions: missionsFor(5, ['boat', 'bridge', 'fence', 'lighthouse']),
    map: { x: 560, y: 320 },
  },
  {
    table: 6,
    nameKey: 'islands.6.name',
    biomeKey: 'islands.6.biome',
    palette: {
      skyTop: '#B79BFF',
      skyBottom: '#EDE4FF',
      ground: '#7B5CC4',
      groundDark: '#553B92',
      water: '#8E7BFF',
      accent: '#7DFFD1',
      prop: '#FF8BE0',
    },
    missions: missionsFor(6, ['trees', 'gate', 'house', 'tower']),
    map: { x: 690, y: 185 },
  },
  {
    table: 7,
    nameKey: 'islands.7.name',
    biomeKey: 'islands.7.biome',
    palette: {
      skyTop: '#4A4468',
      skyBottom: '#8C7FB5',
      ground: '#6B5F86',
      groundDark: '#453C5C',
      water: '#3FB6C9',
      accent: '#FFD166',
      prop: '#59E3C8',
    },
    missions: missionsFor(7, ['gate', 'bridge', 'tower', 'lighthouse']),
    map: { x: 810, y: 330 },
  },
  {
    table: 8,
    nameKey: 'islands.8.name',
    biomeKey: 'islands.8.biome',
    palette: {
      skyTop: '#BEE9FF',
      skyBottom: '#F2FBFF',
      ground: '#DCF1FF',
      groundDark: '#9EC7E0',
      water: '#5BB8E8',
      accent: '#7FE3FF',
      prop: '#6FA8DC',
    },
    missions: missionsFor(8, ['house', 'fence', 'bridge', 'tower']),
    map: { x: 700, y: 460 },
  },
  {
    table: 9,
    nameKey: 'islands.9.name',
    biomeKey: 'islands.9.biome',
    palette: {
      skyTop: '#FF9A6B',
      skyBottom: '#FFD9B0',
      ground: '#6B4238',
      groundDark: '#452A24',
      water: '#FF6B3D',
      accent: '#FFD166',
      prop: '#FF4E3A',
    },
    missions: missionsFor(9, ['gate', 'bridge', 'windmill', 'tower']),
    map: { x: 520, y: 500 },
  },
  {
    table: 10,
    nameKey: 'islands.10.name',
    biomeKey: 'islands.10.biome',
    palette: {
      skyTop: '#FFC1E3',
      skyBottom: '#FFF0F8',
      ground: '#8FD86F',
      groundDark: '#5FA84A',
      water: '#4FC3F7',
      accent: '#FFD93D',
      prop: '#B085FF',
    },
    missions: missionsFor(10, ['house', 'windmill', 'boat', 'tower']),
    map: { x: 340, y: 520 },
  },
];

export const TABLE_ORDER: number[] = ISLANDS.map((i) => i.table);
export const FIRST_TABLE = TABLE_ORDER[0] as number;

export function getIsland(table: number): IslandDef {
  const found = ISLANDS.find((i) => i.table === table);
  if (!found) throw new Error(`Ilha inexistente para a tabuada ${table}`);
  return found;
}

export function getMission(table: number, missionId: string): MissionDef {
  const found = getIsland(table).missions.find((m) => m.id === missionId);
  if (!found) throw new Error(`Missão ${missionId} inexistente na tabuada ${table}`);
  return found;
}

export function nextTable(table: number): number | null {
  const idx = TABLE_ORDER.indexOf(table);
  if (idx < 0 || idx === TABLE_ORDER.length - 1) return null;
  return TABLE_ORDER[idx + 1] as number;
}
