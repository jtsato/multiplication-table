import type { BiomePalette } from '../domain/islands';
import type { SceneType } from '../domain/missions';

/**
 * Construcoes feitas de blocos.
 *
 * Cada cena e uma LISTA ORDENADA de blocos. O progresso da missao (0..1)
 * decide quantos blocos ja apareceram: acertar uma pergunta revela o proximo
 * pedaco da construcao. Nenhuma imagem, nenhum asset externo - so retangulos
 * posicionados numa grade, desenhados como SVG.
 *
 * Grade: coluna 0 na esquerda, linha 0 no chao, linhas crescem para cima.
 */

export const UNIT = 12;
export const SCENE_WIDTH = 360;
export const SCENE_HEIGHT = 216;
/** Linha do chao dentro do viewBox da cena. */
export const GROUND_Y = 168;

export interface SceneBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  /** Blocos que brilham (lampada do farol, ponta do cristal). */
  glow?: boolean;
}

type GridBlock = { col: number; row: number; color: string; glow?: boolean };

function toSceneBlock(block: GridBlock): SceneBlock {
  return {
    x: block.col * UNIT,
    y: GROUND_Y - (block.row + 1) * UNIT,
    w: UNIT,
    h: UNIT,
    color: block.color,
    ...(block.glow ? { glow: true } : {}),
  };
}

/** Retangulo cheio de blocos, montado de baixo para cima. */
function fill(
  cols: [number, number],
  rows: [number, number],
  color: (col: number, row: number) => string,
): GridBlock[] {
  const blocks: GridBlock[] = [];
  for (let row = rows[0]; row <= rows[1]; row += 1) {
    for (let col = cols[0]; col <= cols[1]; col += 1) {
      blocks.push({ col, row, color: color(col, row) });
    }
  }
  return blocks;
}

/** Alterna duas cores em xadrez, o que da textura sem precisar de imagem. */
function checker(a: string, b: string) {
  return (col: number, row: number) => ((col + row) % 2 === 0 ? a : b);
}

function bridgeBlocks(palette: BiomePalette): GridBlock[] {
  const deck = fill([8, 21], [0, 0], checker(palette.block, palette.blockDark));
  const rails: GridBlock[] = [8, 12, 17, 21].map((col) => ({
    col,
    row: 1,
    color: palette.blockLight,
  }));
  return [...deck, ...rails];
}

function towerBlocks(palette: BiomePalette): GridBlock[] {
  const body = fill([13, 16], [0, 3], checker(palette.block, palette.blockDark));
  const roof = fill([14, 15], [4, 4], () => palette.accent);
  return [...body, ...roof];
}

function lighthouseBlocks(palette: BiomePalette): GridBlock[] {
  const base = fill([13, 16], [0, 1], checker(palette.block, palette.blockDark));
  const body = fill([14, 15], [2, 4], checker(palette.blockLight, palette.block));
  const lamp = fill([14, 15], [5, 5], () => palette.accentSoft).map((block) => ({
    ...block,
    glow: true,
  }));
  const roof = fill([14, 15], [6, 6], () => palette.accent);
  return [...base, ...body, ...lamp, ...roof];
}

function treesBlocks(palette: BiomePalette): GridBlock[] {
  const blocks: GridBlock[] = [];
  for (const col of [5, 14, 23]) {
    blocks.push({ col, row: 0, color: palette.blockDark });
    blocks.push({ col, row: 1, color: palette.blockDark });
    blocks.push({ col: col - 1, row: 2, color: palette.groundTop });
    blocks.push({ col, row: 2, color: palette.groundTop });
    blocks.push({ col: col + 1, row: 2, color: palette.groundTop });
    blocks.push({ col, row: 3, color: palette.accentSoft });
  }
  return blocks;
}

function houseBlocks(palette: BiomePalette): GridBlock[] {
  const walls = fill([12, 17], [0, 1], checker(palette.block, palette.blockLight));
  const roof = fill([13, 16], [2, 2], () => palette.accent);
  const chimney: GridBlock[] = [{ col: 16, row: 3, color: palette.blockDark }];
  return [...walls, ...roof, ...chimney];
}

function gateBlocks(palette: BiomePalette): GridBlock[] {
  const pillars: GridBlock[] = [];
  for (let row = 0; row <= 4; row += 1) {
    pillars.push({ col: 11, row, color: row % 2 === 0 ? palette.block : palette.blockDark });
    pillars.push({ col: 18, row, color: row % 2 === 0 ? palette.blockDark : palette.block });
  }
  const arch = fill([11, 18], [5, 5], () => palette.blockLight);
  return [...pillars, ...arch];
}

function boatBlocks(palette: BiomePalette): GridBlock[] {
  const hull = fill([10, 19], [0, 0], checker(palette.block, palette.blockDark));
  const mast: GridBlock[] = [1, 2, 3].map((row) => ({ col: 14, row, color: palette.blockDark }));
  const sail: GridBlock[] = [
    { col: 15, row: 1, color: palette.accentSoft },
    { col: 15, row: 2, color: palette.accentSoft },
    { col: 15, row: 3, color: palette.accentSoft },
    { col: 16, row: 2, color: palette.accent },
  ];
  return [...hull, ...mast, ...sail];
}

function fenceBlocks(palette: BiomePalette): GridBlock[] {
  const blocks: GridBlock[] = [];
  const posts = [8, 12, 16, 20, 24];
  for (const col of posts) {
    blocks.push({ col, row: 0, color: palette.blockDark });
    blocks.push({ col, row: 1, color: palette.block });
  }
  for (const col of [10, 14, 18, 22]) {
    blocks.push({ col, row: 1, color: palette.blockLight });
  }
  return blocks;
}

function windmillBlocks(palette: BiomePalette): GridBlock[] {
  const tower = fill([14, 16], [0, 2], checker(palette.block, palette.blockDark));
  const neck: GridBlock[] = [{ col: 15, row: 3, color: palette.blockLight }];
  const hub: GridBlock[] = [{ col: 15, row: 4, color: palette.accent }];
  const blades: GridBlock[] = [
    { col: 14, row: 4, color: palette.accentSoft },
    { col: 13, row: 4, color: palette.accentSoft },
    { col: 16, row: 4, color: palette.accentSoft },
    { col: 17, row: 4, color: palette.accentSoft },
    { col: 15, row: 5, color: palette.accentSoft },
    { col: 15, row: 6, color: palette.accentSoft },
  ];
  return [...tower, ...neck, ...hub, ...blades];
}

function crystalBlocks(palette: BiomePalette): GridBlock[] {
  const blocks: GridBlock[] = [
    ...fill([12, 18], [0, 0], checker(palette.block, palette.blockDark)),
    ...fill([13, 17], [1, 1], checker(palette.blockLight, palette.block)),
    ...fill([14, 16], [2, 2], () => palette.blockLight),
    { col: 15, row: 3, color: palette.accent, glow: true },
    { col: 11, row: 2, color: palette.accentSoft, glow: true },
    { col: 19, row: 2, color: palette.accentSoft, glow: true },
  ];
  return blocks;
}

const BUILDERS: Record<SceneType, (palette: BiomePalette) => GridBlock[]> = {
  bridge: bridgeBlocks,
  tower: towerBlocks,
  lighthouse: lighthouseBlocks,
  trees: treesBlocks,
  house: houseBlocks,
  gate: gateBlocks,
  boat: boatBlocks,
  fence: fenceBlocks,
  windmill: windmillBlocks,
  crystal: crystalBlocks,
};

/** Blocos da construcao, na ordem em que devem aparecer. */
export function buildSceneBlocks(scene: SceneType, palette: BiomePalette): SceneBlock[] {
  return BUILDERS[scene](palette).map(toSceneBlock);
}

/** Cenas construidas sobre agua ganham um rio/mar no cenario de fundo. */
export function sceneHasWater(scene: SceneType): boolean {
  return scene === 'bridge' || scene === 'boat';
}

/** Quantos blocos ja devem estar visiveis para um progresso 0..1. */
export function visibleBlockCount(total: number, progress: number): number {
  if (progress <= 0) {
    return 0;
  }
  if (progress >= 1) {
    return total;
  }
  return Math.round(total * progress);
}
