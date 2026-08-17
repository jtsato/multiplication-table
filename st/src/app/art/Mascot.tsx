/**
 * O lojista da Lojinha Maluca: um bloquinho simpático que atende os clientes.
 *
 * A estrutura (corpo em blocos, braços que sobem para comemorar, topo trocável)
 * foi adaptada do mascote do projeto irmão `cc`. É uma cópia proposital: os dois
 * projetos são separados e não devem compartilhar módulo.
 */

import type { MascotColor, MascotKind } from "../../domain/profile/profile";
import { getMascotPalette, type MascotPalette } from "./mascotPalette";

export type MascotMood = "idle" | "celebrate";

function Topper({ kind, palette }: { kind: MascotKind; palette: MascotPalette }) {
  switch (kind) {
    case "cap":
      return (
        <g>
          <rect x="18" y="6" width="28" height="5" rx="1" fill={palette.blockDark} />
          <rect x="22" y="0" width="20" height="7" rx="2" fill={palette.accent} />
        </g>
      );
    case "crown":
      return (
        <g>
          <rect x="20" y="6" width="24" height="6" fill={palette.accentSoft} />
          <rect x="20" y="0" width="5" height="7" fill={palette.accentSoft} />
          <rect x="30" y="-2" width="5" height="9" fill={palette.accentSoft} />
          <rect x="39" y="0" width="5" height="7" fill={palette.accentSoft} />
        </g>
      );
    case "bow":
      return (
        <g>
          <polygon points="20,2 30,8 20,14" fill={palette.accentSoft} />
          <polygon points="44,2 34,8 44,14" fill={palette.accentSoft} />
          <rect x="29" y="4" width="6" height="8" rx="1" fill={palette.blockDark} />
        </g>
      );
    case "leaf":
      return (
        <g>
          <rect x="30" y="4" width="4" height="10" fill={palette.blockDark} />
          <rect x="20" y="0" width="16" height="8" rx="4" fill={palette.accentSoft} transform="rotate(-20 28 4)" />
        </g>
      );
    case "antenna":
    default:
      return (
        <g>
          <rect x="30" y="2" width="4" height="9" fill={palette.blockDark} />
          <rect x="26" y="-1" width="12" height="6" rx="1" fill={palette.accentSoft} />
        </g>
      );
  }
}

export type MascotProps = {
  kind: MascotKind;
  color: MascotColor;
  size?: number;
  mood?: MascotMood;
  reducedMotion?: boolean;
  className?: string;
};

export function Mascot({ kind, color, size = 72, mood = "idle", reducedMotion = false, className }: MascotProps) {
  const palette = getMascotPalette(color);
  const cheering = mood === "celebrate";
  const classes = ["mascot", reducedMotion ? "mascot--still" : `mascot--${mood}`, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    // Decorativo: o apelido do jogador aparece como texto onde importa.
    <svg className={classes} viewBox="0 0 64 64" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <Topper kind={kind} palette={palette} />

      <g className="mascot__arms">
        <rect x={cheering ? 3 : 4} y={cheering ? 19 : 29} width="7" height="17" fill={palette.accent} />
        <rect x={cheering ? 54 : 53} y={cheering ? 18 : 29} width="7" height="18" fill={palette.accent} />
      </g>

      <rect x="10" y="12" width="44" height="40" rx="4" fill={palette.accent} />
      <rect x="10" y="12" width="44" height="8" rx="4" fill="#ffffff" opacity="0.3" />

      <rect x="20" y="26" width="8" height="9" rx="1" fill="#2b2233" />
      <rect x="36" y="26" width="8" height="9" rx="1" fill="#2b2233" />
      <rect x="22" y="27" width="3" height="3" fill="#ffffff" />
      <rect x="38" y="27" width="3" height="3" fill="#ffffff" />

      <rect x="22" y="40" width="20" height="7" rx="2" fill="#2b2233" />
      <rect x="26" y="40" width="12" height="2" fill="#ffffff" opacity="0.8" />
      <rect x="14" y="36" width="6" height="5" fill={palette.accentSoft} opacity="0.8" />
      <rect x="44" y="36" width="6" height="5" fill={palette.accentSoft} opacity="0.8" />

      {cheering && (
        <g fill={palette.accentSoft}>
          <rect x="5" y="8" width="4" height="4" />
          <rect x="52" y="4" width="3" height="3" />
          <rect x="12" y="2" width="3" height="3" />
        </g>
      )}

      <rect x="16" y="52" width="12" height="6" rx="2" fill={palette.blockDark} />
      <rect x="36" y="52" width="12" height="6" rx="2" fill={palette.blockDark} />
    </svg>
  );
}
