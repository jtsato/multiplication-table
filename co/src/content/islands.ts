import type { TableNumber } from '../domain/types';

export type Biome =
  'meadow' | 'forest' | 'mountain' | 'beach' | 'magic' | 'cave' | 'ice' | 'volcano' | 'city';
export type Construction =
  'bridge' | 'grove' | 'tower' | 'lighthouse' | 'tree' | 'gate' | 'iceBeacon' | 'path' | 'city';

export interface IslandDefinition {
  table: TableNumber;
  biome: Biome;
  construction: Construction;
  palette: { sky: string; land: string; accent: string; dark: string };
}

export const ISLANDS: IslandDefinition[] = [
  {
    table: 2,
    biome: 'meadow',
    construction: 'bridge',
    palette: { sky: '#79d8ff', land: '#6fd05e', accent: '#ffcc4d', dark: '#3f7d4b' },
  },
  {
    table: 3,
    biome: 'forest',
    construction: 'grove',
    palette: { sky: '#79d7c7', land: '#3fa85b', accent: '#f4d35e', dark: '#245c45' },
  },
  {
    table: 4,
    biome: 'mountain',
    construction: 'tower',
    palette: { sky: '#a6bfff', land: '#8794a8', accent: '#8ef0ff', dark: '#4d5477' },
  },
  {
    table: 5,
    biome: 'beach',
    construction: 'lighthouse',
    palette: { sky: '#63d7ff', land: '#f7ce72', accent: '#ff6b6b', dark: '#28789c' },
  },
  {
    table: 6,
    biome: 'magic',
    construction: 'tree',
    palette: { sky: '#9e83ff', land: '#48b76b', accent: '#ff82c8', dark: '#563f91' },
  },
  {
    table: 7,
    biome: 'cave',
    construction: 'gate',
    palette: { sky: '#545075', land: '#68617e', accent: '#66f2c2', dark: '#302c45' },
  },
  {
    table: 8,
    biome: 'ice',
    construction: 'iceBeacon',
    palette: { sky: '#bdeeff', land: '#e9fbff', accent: '#5ba9ff', dark: '#5575a0' },
  },
  {
    table: 9,
    biome: 'volcano',
    construction: 'path',
    palette: { sky: '#6f455c', land: '#4f3a45', accent: '#ff7448', dark: '#2c2630' },
  },
  {
    table: 10,
    biome: 'city',
    construction: 'city',
    palette: { sky: '#779bff', land: '#72d987', accent: '#ffd84d', dark: '#514a88' },
  },
];

export function getIsland(table: TableNumber): IslandDefinition {
  const island = ISLANDS.find((item) => item.table === table);
  if (!island) throw new Error(`Unknown table: ${table}`);
  return island;
}
