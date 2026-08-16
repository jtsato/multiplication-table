import type {
  AccessoryId,
  AvatarBase,
  AvatarConfig,
  HairStyleId,
  OutfitColorId,
  SkinToneId,
} from './types';

/**
 * Opcoes de personagem.
 *
 * Poucas escolhas, todas claras. Nenhuma delas altera dificuldade, perguntas
 * ou progressao - a aparencia e puramente cosmetica. As mesmas cores, cabelos
 * e acessorios estao disponiveis para as duas bases, de proposito.
 */

export const AVATAR_BASES: readonly AvatarBase[] = ['boy', 'girl'];
export const SKIN_TONES: readonly SkinToneId[] = ['skin1', 'skin2', 'skin3', 'skin4'];
export const HAIR_STYLES: readonly HairStyleId[] = ['short', 'long', 'curly', 'ponytail'];
export const OUTFIT_COLORS: readonly OutfitColorId[] = [
  'red',
  'blue',
  'green',
  'purple',
  'orange',
  'pink',
];
export const ACCESSORIES: readonly AccessoryId[] = ['none', 'cap', 'glasses', 'crown'];

export const SKIN_COLORS: Record<SkinToneId, string> = {
  skin1: '#f7d7b8',
  skin2: '#e0ac74',
  skin3: '#a9673d',
  skin4: '#6b4226',
};

export const HAIR_COLORS: Record<HairStyleId, string> = {
  short: '#3b2314',
  long: '#8b3a1f',
  curly: '#1f1a17',
  ponytail: '#d9a441',
};

export const OUTFIT_COLORS_HEX: Record<OutfitColorId, string> = {
  red: '#e63946',
  blue: '#2f80ed',
  green: '#38b000',
  purple: '#9d4edd',
  orange: '#ff8c42',
  pink: '#ff5da2',
};

/** Avatar aleatorio, usado como sugestao inicial na criacao do personagem. */
export function randomAvatar(pick: (max: number) => number): AvatarConfig {
  return {
    base: AVATAR_BASES[pick(AVATAR_BASES.length)] ?? 'boy',
    skin: SKIN_TONES[pick(SKIN_TONES.length)] ?? 'skin2',
    hair: HAIR_STYLES[pick(HAIR_STYLES.length)] ?? 'short',
    outfit: OUTFIT_COLORS[pick(OUTFIT_COLORS.length)] ?? 'blue',
    accessory: ACCESSORIES[pick(ACCESSORIES.length)] ?? 'none',
  };
}
