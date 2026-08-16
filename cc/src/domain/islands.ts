import { TABLES } from './facts';

/**
 * Definicao das ilhas do arquipelago.
 *
 * Cada tabuada e uma ilha com bioma proprio. As cores vivem aqui (e nao no
 * CSS) porque o mesmo conjunto alimenta tres lugares: o mapa, o cenario da
 * fase e as construcoes de blocos.
 */

export type BiomeId =
  | 'fields'
  | 'forest'
  | 'mountains'
  | 'beach'
  | 'magicForest'
  | 'caves'
  | 'ice'
  | 'volcano'
  | 'city';

/** Enfeites de bloco espalhados pelo cenario de cada bioma. */
export type DecorKind = 'tree' | 'flower' | 'pine' | 'crystal' | 'rock' | 'mushroom' | 'lamp';

export interface BiomePalette {
  skyTop: string;
  skyBottom: string;
  /** Camada de grama/areia/neve no topo do solo. */
  groundTop: string;
  groundMid: string;
  groundDeep: string;
  water: string;
  waterDeep: string;
  /** Cores das construcoes feitas com os acertos. */
  block: string;
  blockLight: string;
  blockDark: string;
  accent: string;
  accentSoft: string;
}

export interface IslandDefinition {
  table: number;
  biome: BiomeId;
  palette: BiomePalette;
  decor: readonly DecorKind[];
  /** Posicao no mapa do arquipelago, em coordenadas do viewBox 1000x600. */
  mapPosition: { x: number; y: number };
  /** Ilhas iniciais usam 3 alternativas; o resto usa 4. */
  optionCount: number;
}

const PALETTES: Record<BiomeId, BiomePalette> = {
  fields: {
    skyTop: '#5cc6ff',
    skyBottom: '#c9f0ff',
    groundTop: '#6ecb56',
    groundMid: '#4da33d',
    groundDeep: '#8a5a34',
    water: '#3fb8e8',
    waterDeep: '#1f7fb5',
    block: '#f0a04b',
    blockLight: '#ffc26f',
    blockDark: '#b56a2a',
    accent: '#ff5d8f',
    accentSoft: '#ffd23f',
  },
  forest: {
    skyTop: '#4fb6e8',
    skyBottom: '#d3f2e2',
    groundTop: '#3fa860',
    groundMid: '#2c7a45',
    groundDeep: '#6b4a2f',
    water: '#38c3d6',
    waterDeep: '#1c7f92',
    block: '#a4703f',
    blockLight: '#c78f57',
    blockDark: '#6f4a26',
    accent: '#ffd23f',
    accentSoft: '#9be870',
  },
  mountains: {
    skyTop: '#7b8cff',
    skyBottom: '#d9e2ff',
    groundTop: '#9aa4c8',
    groundMid: '#6a7397',
    groundDeep: '#464d6b',
    water: '#5ec8f0',
    waterDeep: '#2a86ad',
    block: '#8fd8ff',
    blockLight: '#c4ecff',
    blockDark: '#4f9dc4',
    accent: '#c86bff',
    accentSoft: '#7ef0e0',
  },
  beach: {
    skyTop: '#42c7f5',
    skyBottom: '#ffeec2',
    groundTop: '#ffe1a8',
    groundMid: '#e5bf76',
    groundDeep: '#b48b4a',
    water: '#22b8e6',
    waterDeep: '#0f7fae',
    block: '#ff8f5e',
    blockLight: '#ffb98d',
    blockDark: '#c25a2f',
    accent: '#ff4f6d',
    accentSoft: '#ffe066',
  },
  magicForest: {
    skyTop: '#8b5cf6',
    skyBottom: '#f3d7ff',
    groundTop: '#7bd88f',
    groundMid: '#4aa06a',
    groundDeep: '#5b3a7a',
    water: '#b06bff',
    waterDeep: '#7038c4',
    block: '#d78bff',
    blockLight: '#efc0ff',
    blockDark: '#8e46c9',
    accent: '#ffe14d',
    accentSoft: '#65f0c8',
  },
  caves: {
    skyTop: '#2f2a52',
    skyBottom: '#5b4a86',
    groundTop: '#7a6a52',
    groundMid: '#544733',
    groundDeep: '#332a20',
    water: '#4ad6c0',
    waterDeep: '#1f8f80',
    block: '#ffb340',
    blockLight: '#ffd88a',
    blockDark: '#c07a1c',
    accent: '#6be3ff',
    accentSoft: '#ff7ac9',
  },
  ice: {
    skyTop: '#59b8ff',
    skyBottom: '#e9fbff',
    groundTop: '#f2fbff',
    groundMid: '#bfe4f5',
    groundDeep: '#7fb3ce',
    water: '#38c9ff',
    waterDeep: '#1b7fae',
    block: '#9fe8ff',
    blockLight: '#dcf7ff',
    blockDark: '#5aa9c9',
    accent: '#5f7bff',
    accentSoft: '#ffffff',
  },
  volcano: {
    skyTop: '#4a2140',
    skyBottom: '#ff8a4c',
    groundTop: '#6b4038',
    groundMid: '#4a2a26',
    groundDeep: '#2c1917',
    water: '#ff6b35',
    waterDeep: '#c93b12',
    block: '#ff9b3d',
    blockLight: '#ffcb6b',
    blockDark: '#b8531a',
    accent: '#ffe14d',
    accentSoft: '#ff5252',
  },
  city: {
    skyTop: '#3aa0ff',
    skyBottom: '#ffe9b8',
    groundTop: '#7ad471',
    groundMid: '#4ea347',
    groundDeep: '#8a6b45',
    water: '#2fb6e8',
    waterDeep: '#12789f',
    block: '#ffd23f',
    blockLight: '#ffeba3',
    blockDark: '#d19a12',
    accent: '#ff5d8f',
    accentSoft: '#8ce0ff',
  },
};

const BIOME_BY_TABLE: Record<number, BiomeId> = {
  2: 'fields',
  3: 'forest',
  4: 'mountains',
  5: 'beach',
  6: 'magicForest',
  7: 'caves',
  8: 'ice',
  9: 'volcano',
  10: 'city',
};

const DECOR_BY_BIOME: Record<BiomeId, readonly DecorKind[]> = {
  fields: ['tree', 'flower', 'flower'],
  forest: ['pine', 'tree', 'mushroom'],
  mountains: ['rock', 'crystal', 'pine'],
  beach: ['rock', 'flower', 'tree'],
  magicForest: ['mushroom', 'crystal', 'pine'],
  caves: ['crystal', 'rock', 'lamp'],
  ice: ['pine', 'crystal', 'rock'],
  volcano: ['rock', 'crystal', 'lamp'],
  city: ['tree', 'lamp', 'flower'],
};

/** Trajeto em S do arquipelago, no viewBox 1000x600 do mapa. */
const MAP_POSITIONS: Record<number, { x: number; y: number }> = {
  2: { x: 120, y: 430 },
  3: { x: 300, y: 470 },
  4: { x: 470, y: 390 },
  5: { x: 640, y: 460 },
  6: { x: 820, y: 400 },
  7: { x: 830, y: 220 },
  8: { x: 640, y: 165 },
  9: { x: 430, y: 200 },
  10: { x: 200, y: 165 },
};

export const ISLANDS: readonly IslandDefinition[] = TABLES.map((table) => {
  const biome = BIOME_BY_TABLE[table] ?? 'fields';
  return {
    table,
    biome,
    palette: PALETTES[biome],
    decor: DECOR_BY_BIOME[biome],
    mapPosition: MAP_POSITIONS[table] ?? { x: 500, y: 300 },
    // A primeira ilha e o tutorial: menos alternativas, menos carga cognitiva.
    optionCount: table === 2 ? 3 : 4,
  };
});

export function getIsland(table: number): IslandDefinition {
  const island = ISLANDS.find((candidate) => candidate.table === table);
  if (!island) {
    throw new Error(`Ilha inexistente para a tabuada ${table}`);
  }
  return island;
}

export function getPalette(table: number): BiomePalette {
  return getIsland(table).palette;
}
