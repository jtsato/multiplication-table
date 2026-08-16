import type { BiomePalette, SceneKind } from '../domain/world';

/** Grade lógica do cenário. Tudo é desenhado em blocos desta grade. */
export const GRID_W = 24;
export const GRID_H = 14;
export const GROUND_Y = 10;

export interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  /** Blocos com shine recebem um brilho no canto (cristal, luz, vela). */
  shine?: boolean;
}

export interface ScenePlan {
  /** Blocos fixos do cenário (chão, água, rochas). */
  scenery: Block[];
  /** Blocos revelados conforme a construção avança, em ordem de baixo para cima. */
  build: Block[];
  /** Onde o personagem começa e termina (em células da grade). */
  walk: { from: number; to: number };
  /** Cenário com água atravessando o chão. */
  hasGap: boolean;
}

function lighten(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amount);
  const g = Math.min(255, ((n >> 8) & 255) + amount);
  const b = Math.min(255, (n & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function rect(x: number, y: number, w: number, h: number, color: string, shine = false): Block {
  return { x, y, w, h, color, shine };
}

function groundRow(palette: BiomePalette, gap?: [number, number]): Block[] {
  const blocks: Block[] = [];
  for (let x = 0; x < GRID_W; x += 1) {
    if (gap && x >= gap[0] && x <= gap[1]) {
      blocks.push(rect(x, GROUND_Y, 1, GRID_H - GROUND_Y, palette.water));
      continue;
    }
    blocks.push(rect(x, GROUND_Y, 1, 1, palette.ground));
    blocks.push(rect(x, GROUND_Y + 1, 1, GRID_H - GROUND_Y - 1, palette.groundDark));
  }
  return blocks;
}

function tree(x: number, palette: BiomePalette): Block[] {
  return [
    rect(x + 1, GROUND_Y - 2, 1, 2, palette.groundDark),
    rect(x, GROUND_Y - 4, 3, 2, palette.prop),
    rect(x + 1, GROUND_Y - 5, 1, 1, palette.prop),
  ];
}

/** Monta o plano de blocos de uma construção. */
export function createScenePlan(kind: SceneKind, palette: BiomePalette): ScenePlan {
  const accent = palette.accent;
  const wood = palette.groundDark;
  const stone = lighten(palette.ground, -10);

  switch (kind) {
    case 'bridge': {
      const build: Block[] = [];
      for (let x = 8; x <= 15; x += 1) build.push(rect(x, GROUND_Y, 1, 1, wood));
      for (let x = 8; x <= 15; x += 2) build.push(rect(x, GROUND_Y - 1, 1, 1, accent));
      return {
        scenery: [...groundRow(palette, [8, 15]), ...tree(2, palette), ...tree(19, palette)],
        build,
        walk: { from: 3, to: 18 },
        hasGap: true,
      };
    }

    case 'tower': {
      const build: Block[] = [];
      for (let row = 0; row < 8; row += 1) {
        const y = GROUND_Y - 1 - row;
        const color = row % 2 === 0 ? stone : lighten(stone, 22);
        for (let x = 10; x <= 13; x += 1) build.push(rect(x, y, 1, 1, color));
      }
      build.push(rect(9, GROUND_Y - 9, 6, 1, accent));
      build.push(rect(11, GROUND_Y - 10, 2, 1, palette.prop, true));
      return {
        scenery: [...groundRow(palette), ...tree(3, palette), ...tree(19, palette)],
        build,
        walk: { from: 4, to: 8 },
        hasGap: false,
      };
    }

    case 'lighthouse': {
      const build: Block[] = [];
      for (let row = 0; row < 6; row += 1) {
        const y = GROUND_Y - 1 - row;
        const color = row % 2 === 0 ? '#FFFFFF' : palette.prop;
        for (let x = 11; x <= 13; x += 1) build.push(rect(x, y, 1, 1, color));
      }
      build.push(rect(10, GROUND_Y - 7, 5, 1, stone));
      build.push(rect(11, GROUND_Y - 8, 3, 1, accent, true));
      build.push(rect(10, GROUND_Y - 9, 5, 1, palette.prop));
      return {
        scenery: [
          ...groundRow(palette, [0, 4]),
          rect(16, GROUND_Y - 1, 2, 1, stone),
          ...tree(19, palette),
        ],
        build,
        walk: { from: 7, to: 10 },
        hasGap: true,
      };
    }

    case 'trees': {
      const build: Block[] = [];
      for (const x of [5, 10, 15, 19]) {
        build.push(rect(x + 1, GROUND_Y - 2, 1, 2, wood));
        build.push(rect(x, GROUND_Y - 4, 3, 2, palette.prop));
        build.push(rect(x + 1, GROUND_Y - 5, 1, 1, lighten(palette.prop, 25), true));
      }
      return {
        scenery: [...groundRow(palette), rect(2, GROUND_Y - 1, 1, 1, stone)],
        walk: { from: 2, to: 17 },
        build,
        hasGap: false,
      };
    }

    case 'boat': {
      const build: Block[] = [];
      for (let x = 8; x <= 15; x += 1) build.push(rect(x, GROUND_Y - 1, 1, 1, wood));
      for (let x = 9; x <= 14; x += 1) build.push(rect(x, GROUND_Y - 2, 1, 1, lighten(wood, 30)));
      build.push(rect(11, GROUND_Y - 6, 1, 4, stone));
      build.push(rect(12, GROUND_Y - 5, 3, 3, accent, true));
      build.push(rect(8, GROUND_Y - 3, 1, 1, palette.prop));
      return {
        scenery: [...groundRow(palette, [6, 17]), ...tree(1, palette), ...tree(20, palette)],
        build,
        walk: { from: 3, to: 5 },
        hasGap: true,
      };
    }

    case 'gate': {
      const build: Block[] = [];
      for (let row = 0; row < 5; row += 1) {
        build.push(rect(8, GROUND_Y - 1 - row, 2, 1, stone));
        build.push(rect(14, GROUND_Y - 1 - row, 2, 1, stone));
      }
      for (let row = 0; row < 4; row += 1) {
        for (let x = 10; x <= 13; x += 1) build.push(rect(x, GROUND_Y - 1 - row, 1, 1, wood));
      }
      build.push(rect(8, GROUND_Y - 6, 8, 1, accent));
      build.push(rect(11, GROUND_Y - 7, 2, 1, palette.prop, true));
      return {
        scenery: [...groundRow(palette), ...tree(2, palette), ...tree(19, palette)],
        build,
        walk: { from: 3, to: 7 },
        hasGap: false,
      };
    }

    case 'windmill': {
      const build: Block[] = [];
      for (let row = 0; row < 5; row += 1) {
        for (let x = 10; x <= 13; x += 1) {
          build.push(rect(x, GROUND_Y - 1 - row, 1, 1, row % 2 ? lighten(stone, 20) : stone));
        }
      }
      build.push(rect(9, GROUND_Y - 6, 6, 1, palette.prop));
      build.push(rect(11, GROUND_Y - 9, 2, 3, accent));
      build.push(rect(8, GROUND_Y - 8, 3, 1, accent, true));
      build.push(rect(13, GROUND_Y - 8, 3, 1, accent, true));
      return {
        scenery: [...groundRow(palette), ...tree(3, palette), ...tree(20, palette)],
        build,
        walk: { from: 4, to: 8 },
        hasGap: false,
      };
    }

    case 'house': {
      const build: Block[] = [];
      for (let row = 0; row < 4; row += 1) {
        for (let x = 9; x <= 15; x += 1) {
          if (row < 2 && (x === 11 || x === 12)) continue; // porta
          build.push(rect(x, GROUND_Y - 1 - row, 1, 1, row === 3 ? lighten(stone, 18) : stone));
        }
      }
      build.push(rect(13, GROUND_Y - 3, 1, 1, accent, true)); // janela
      build.push(rect(9, GROUND_Y - 5, 7, 1, palette.prop));
      build.push(rect(10, GROUND_Y - 6, 5, 1, palette.prop));
      build.push(rect(11, GROUND_Y - 7, 3, 1, lighten(palette.prop, 20)));
      return {
        scenery: [...groundRow(palette), ...tree(3, palette), ...tree(19, palette)],
        build,
        walk: { from: 4, to: 8 },
        hasGap: false,
      };
    }

    case 'fence':
    default: {
      const build: Block[] = [];
      for (let x = 5; x <= 19; x += 3) {
        build.push(rect(x, GROUND_Y - 3, 1, 3, wood));
      }
      for (let x = 5; x <= 19; x += 1) {
        build.push(rect(x, GROUND_Y - 3, 1, 1, lighten(wood, 30)));
      }
      for (let x = 5; x <= 19; x += 1) {
        build.push(rect(x, GROUND_Y - 1, 1, 1, lighten(wood, 30)));
      }
      build.push(rect(11, GROUND_Y - 5, 3, 2, accent, true));
      return {
        scenery: [...groundRow(palette), ...tree(1, palette), ...tree(21, palette)],
        build,
        walk: { from: 2, to: 4 },
        hasGap: false,
      };
    }
  }
}

/** Quantos blocos ficam visíveis para um dado avanço da construção (0..1). */
export function visibleBlockCount(plan: ScenePlan, progress: number): number {
  const ratio = Math.max(0, Math.min(1, progress));
  return Math.round(plan.build.length * ratio);
}
