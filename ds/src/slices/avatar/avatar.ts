import type { MessageKey } from "../../shared/i18n/i18n";

/** Classes de avatar disponíveis na aventura. */
export const AVATAR_IDS = ["fighter", "elf", "cleric", "dwarf"] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

/** Cores predefinidas para personalizar a roupa/armadura. */
export const AVATAR_COLOR_IDS = ["crimson", "royal", "forest", "gold", "violet", "steel"] as const;
export type AvatarColorId = (typeof AVATAR_COLOR_IDS)[number];

/** Mascotes: um companheiro para cada classe. */
export const MASCOT_IDS = ["wolf", "owl", "phoenix", "badger"] as const;
export type MascotId = (typeof MASCOT_IDS)[number];

export interface AvatarSpec {
  id: AvatarId;
  nameKey: MessageKey;
  descriptionKey: MessageKey;
  mascot: MascotId;
  mascotNameKey: MessageKey;
  defaultColorId: AvatarColorId;
}

export interface AvatarColorSpec {
  id: AvatarColorId;
  labelKey: MessageKey;
  /** Cor usada pela arte do avatar (blocos SVG). */
  hex: string;
}

/** Escolha persistida do jogador: classe + cor. */
export interface AvatarSelection {
  classId: AvatarId;
  colorId: AvatarColorId;
}

export const AVATARS: AvatarSpec[] = [
  {
    id: "fighter",
    nameKey: "avatar.class.fighter",
    descriptionKey: "avatar.class.fighterDescription",
    mascot: "wolf",
    mascotNameKey: "avatar.mascot.wolf",
    defaultColorId: "crimson",
  },
  {
    id: "elf",
    nameKey: "avatar.class.elf",
    descriptionKey: "avatar.class.elfDescription",
    mascot: "owl",
    mascotNameKey: "avatar.mascot.owl",
    defaultColorId: "forest",
  },
  {
    id: "cleric",
    nameKey: "avatar.class.cleric",
    descriptionKey: "avatar.class.clericDescription",
    mascot: "phoenix",
    mascotNameKey: "avatar.mascot.phoenix",
    defaultColorId: "gold",
  },
  {
    id: "dwarf",
    nameKey: "avatar.class.dwarf",
    descriptionKey: "avatar.class.dwarfDescription",
    mascot: "badger",
    mascotNameKey: "avatar.mascot.badger",
    defaultColorId: "steel",
  },
];

export const AVATAR_COLORS: AvatarColorSpec[] = [
  { id: "crimson", labelKey: "avatar.color.crimson", hex: "#c8102e" },
  { id: "royal", labelKey: "avatar.color.royal", hex: "#0052cc" },
  { id: "forest", labelKey: "avatar.color.forest", hex: "#00875a" },
  { id: "gold", labelKey: "avatar.color.gold", hex: "#b8860b" },
  { id: "violet", labelKey: "avatar.color.violet", hex: "#7b4fbf" },
  { id: "steel", labelKey: "avatar.color.steel", hex: "#5b6b8c" },
];

export const DEFAULT_AVATAR_SELECTION: AvatarSelection = {
  classId: AVATARS[0].id,
  colorId: AVATARS[0].defaultColorId,
};

export function avatarSpec(id: AvatarId): AvatarSpec {
  const spec = AVATARS.find((avatar) => avatar.id === id);
  if (!spec) throw new Error(`avatar desconhecido: ${id}`);
  return spec;
}

export function colorSpec(id: AvatarColorId): AvatarColorSpec {
  const spec = AVATAR_COLORS.find((color) => color.id === id);
  if (!spec) throw new Error(`cor de avatar desconhecida: ${id}`);
  return spec;
}

export function mascotForAvatar(id: AvatarId): MascotId {
  return avatarSpec(id).mascot;
}

export function isAvatarId(value: unknown): value is AvatarId {
  return AVATAR_IDS.includes(value as AvatarId);
}

export function isAvatarColorId(value: unknown): value is AvatarColorId {
  return AVATAR_COLOR_IDS.includes(value as AvatarColorId);
}

/** Valida uma seleção de avatar vinda de save (ou outra fonte externa). */
export function migrateAvatarSelection(raw: unknown): AvatarSelection {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("avatar inválido: não é um objeto");
  }
  const { classId, colorId } = raw as Partial<AvatarSelection>;
  if (!isAvatarId(classId)) {
    throw new Error("avatar inválido: classe");
  }
  if (!isAvatarColorId(colorId)) {
    throw new Error("avatar inválido: cor");
  }
  return { classId, colorId };
}
