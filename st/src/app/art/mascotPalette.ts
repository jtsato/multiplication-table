/** Paletas do mascote. Separadas do componente para o fast refresh continuar valendo. */
import type { MascotColor } from "../../domain/profile/profile";

export type MascotPalette = { accent: string; accentSoft: string; blockDark: string };

const PALETTES: Record<MascotColor, MascotPalette> = {
  orange: { accent: "#e57a44", accentSoft: "#f5b971", blockDark: "#9c4f24" },
  mint: { accent: "#3f9c8c", accentSoft: "#72b7a1", blockDark: "#27675d" },
  berry: { accent: "#d4608c", accentSoft: "#f0a3c0", blockDark: "#8f3a5c" },
  sky: { accent: "#5e78bd", accentSoft: "#9fb3e8", blockDark: "#3a4f85" },
  grape: { accent: "#8b83d4", accentSoft: "#b9b3ea", blockDark: "#5b539c" },
  sun: { accent: "#f5c14b", accentSoft: "#ffe08a", blockDark: "#b88a1e" },
};

export function getMascotPalette(color: MascotColor): MascotPalette {
  return PALETTES[color] ?? PALETTES.orange;
}

