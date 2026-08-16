import type { AvatarConfig } from '../domain/types';

/**
 * Personagem desenhado com quadrados. Todas as opções são cosméticas e
 * disponíveis para qualquer base — nada aqui muda dificuldade ou conteúdo.
 */

export interface ColorOption {
  id: string;
  color: string;
}

export const SKIN_OPTIONS: ColorOption[] = [
  { id: 'skin1', color: '#F7D3B0' },
  { id: 'skin2', color: '#E0A97B' },
  { id: 'skin3', color: '#A9714B' },
  { id: 'skin4', color: '#6E4531' },
];

export const HAIR_OPTIONS: ColorOption[] = [
  { id: 'hair1', color: '#3A2B22' },
  { id: 'hair2', color: '#B5651D' },
  { id: 'hair3', color: '#F2C14E' },
  { id: 'hair4', color: '#7B5CC4' },
  { id: 'hair5', color: '#3FC5F0' },
];

export const OUTFIT_OPTIONS: ColorOption[] = [
  { id: 'outfit1', color: '#FF6B6B' },
  { id: 'outfit2', color: '#3FC5F0' },
  { id: 'outfit3', color: '#5BD07A' },
  { id: 'outfit4', color: '#FFC53D' },
  { id: 'outfit5', color: '#B085FF' },
];

export const ACCESSORY_OPTIONS = ['none', 'cap', 'crown', 'band', 'goggles'] as const;
export type AccessoryId = (typeof ACCESSORY_OPTIONS)[number];

export const ACCESSORY_LABEL_KEYS: Record<AccessoryId, string> = {
  none: 'character.accessoryNone',
  cap: 'character.accessoryCap',
  crown: 'character.accessoryCrown',
  band: 'character.accessoryBand',
  goggles: 'character.accessoryGoggles',
};

export function createDefaultAvatar(): AvatarConfig {
  return {
    base: 'sprout',
    skinId: 'skin1',
    hairId: 'hair1',
    outfitId: 'outfit1',
    accessoryId: 'none',
  };
}

function colorOf(options: ColorOption[], id: string): string {
  return options.find((o) => o.id === id)?.color ?? (options[0] as ColorOption).color;
}

export interface AvatarColors {
  skin: string;
  hair: string;
  outfit: string;
  accessory: string;
}

export function avatarColors(avatar: AvatarConfig): AvatarColors {
  return {
    skin: colorOf(SKIN_OPTIONS, avatar.skinId),
    hair: colorOf(HAIR_OPTIONS, avatar.hairId),
    outfit: colorOf(OUTFIT_OPTIONS, avatar.outfitId),
    accessory: '#FFD93D',
  };
}

/**
 * Desenha o personagem numa grade 8x10 escalada para `size`.
 * `x`,`y` = canto superior esquerdo em pixels.
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  avatar: AvatarConfig,
  x: number,
  y: number,
  size: number,
): void {
  const c = avatarColors(avatar);
  const u = size / 8; // unidade de bloco
  const px = (bx: number, by: number, bw: number, bh: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + bx * u, y + by * u, bw * u, bh * u);
  };

  // Corpo
  px(2, 4, 4, 3, c.outfit);
  // Braços
  px(1, 4, 1, 2, c.skin);
  px(6, 4, 1, 2, c.skin);
  // Pernas
  px(2, 7, 1.5, 2, '#2E4374');
  px(4.5, 7, 1.5, 2, '#2E4374');
  // Cabeça
  px(2, 1, 4, 3, c.skin);
  // Cabelo: as duas bases diferem só no corte, ambas usam qualquer cor
  if (avatar.base === 'sprout') {
    px(2, 0.6, 4, 1, c.hair);
    px(1.6, 1, 0.6, 2.4, c.hair);
    px(6, 1, 0.6, 2.4, c.hair);
  } else {
    px(2, 0.6, 4, 1.2, c.hair);
  }
  // Olhos e sorriso
  px(3, 2.2, 0.7, 0.7, '#25324F');
  px(4.6, 2.2, 0.7, 0.7, '#25324F');
  px(3.4, 3.1, 1.4, 0.4, '#C6486B');

  // Acessórios
  switch (avatar.accessoryId) {
    case 'cap':
      px(1.8, 0.2, 4.4, 0.9, c.accessory);
      px(5.8, 0.9, 1.6, 0.6, c.accessory);
      break;
    case 'crown':
      px(2.2, -0.4, 3.6, 0.9, '#FFD93D');
      px(2.2, -1, 0.8, 0.8, '#FFD93D');
      px(4.9, -1, 0.8, 0.8, '#FFD93D');
      break;
    case 'band':
      px(1.8, 1.2, 4.4, 0.6, '#FF6B6B');
      break;
    case 'goggles':
      px(2.4, 2, 3.2, 1, 'rgba(63,197,240,0.75)');
      break;
    default:
      break;
  }
}
