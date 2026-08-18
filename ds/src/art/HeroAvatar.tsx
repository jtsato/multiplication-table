/**
 * Avatares dos heróis, desenhados com blocos SVG (estilo pixel art 32 bits).
 *
 * Quatro classes: Guerreiro, Elfa, Clérigo e Anão. Cada classe tem uma
 * silhueta própria; a cor da roupa/armadura é personalizável pela paleta.
 */

import type { AvatarColorId, AvatarId } from "../slices/avatar/avatar";
import { colorSpec } from "../slices/avatar/avatar";

export interface HeroAvatarProps {
  avatarId?: AvatarId;
  colorId?: AvatarColorId;
  /** Altura em pixels; a largura acompanha a proporção 3:4. */
  size?: number;
  className?: string;
  title?: string;
}

const SKIN = "#f2c59b";
const HAIR = "#6b4a2f";
const EYE = "#2b2233";
const SHOE = "#3b3247";
const METAL = "#c8ccd4";
const WOOD = "#8a5a2b";
const LIGHT_HAIR = "#e8c07a";

function FighterSprite({ outfit }: { outfit: string }) {
  return (
    <g>
      {/* Braços */}
      <rect x="9" y="31" width="6" height="13" fill={outfit} />
      <rect x="33" y="31" width="6" height="13" fill={outfit} />
      <rect x="9" y="44" width="6" height="5" fill={SKIN} />
      <rect x="33" y="44" width="6" height="5" fill={SKIN} />

      {/* Corpo/armadura */}
      <rect x="15" y="30" width="18" height="17" fill={outfit} />
      <rect x="15" y="30" width="18" height="3" fill="#ffffff" opacity="0.25" />
      <rect x="15" y="43" width="18" height="3" fill="#c98f2d" />
      <rect x="17" y="46" width="6" height="13" fill="#3f5570" />
      <rect x="25" y="46" width="6" height="13" fill="#3f5570" />
      <rect x="15" y="59" width="8" height="4" fill={SHOE} />
      <rect x="25" y="59" width="8" height="4" fill={SHOE} />

      {/* Espada de longo alcance */}
      <rect x="3" y="22" width="3" height="26" fill={METAL} />
      <rect x="2" y="20" width="5" height="3" fill="#c98f2d" />

      {/* Cabeça */}
      <rect x="13" y="10" width="22" height="18" fill={SKIN} />
      <rect x="17" y="17" width="4" height="4" fill={EYE} />
      <rect x="27" y="17" width="4" height="4" fill={EYE} />
      <rect x="21" y="23" width="6" height="3" fill="#a9503f" />
      <rect x="13" y="6" width="22" height="7" fill={HAIR} />
      <rect x="13" y="13" width="3" height="5" fill={HAIR} />
      <rect x="32" y="13" width="3" height="5" fill={HAIR} />
    </g>
  );
}

function ElfSprite({ outfit }: { outfit: string }) {
  return (
    <g>
      {/* Cabelo de trás */}
      <rect x="13" y="6" width="22" height="7" fill={HAIR} />
      <rect x="12" y="13" width="3" height="8" fill={HAIR} />
      <rect x="33" y="13" width="3" height="8" fill={HAIR} />

      {/* Orelhas pontudas */}
      <rect x="9" y="15" width="5" height="7" fill={SKIN} />
      <rect x="34" y="15" width="5" height="7" fill={SKIN} />

      {/* Arco */}
      <rect x="3" y="20" width="3" height="28" fill={WOOD} />
      <rect x="2" y="18" width="5" height="3" fill={WOOD} />
      <rect x="2" y="47" width="5" height="3" fill={WOOD} />

      {/* Corpo ágil */}
      <rect x="16" y="30" width="16" height="13" fill={outfit} />
      <rect x="16" y="30" width="16" height="3" fill="#ffffff" opacity="0.25" />
      <rect x="12" y="43" width="24" height="8" fill={outfit} />
      <rect x="12" y="43" width="24" height="3" fill="#ffffff" opacity="0.25" />
      <rect x="9" y="31" width="6" height="13" fill={outfit} />
      <rect x="33" y="31" width="6" height="13" fill={outfit} />
      <rect x="9" y="44" width="6" height="5" fill={SKIN} />
      <rect x="33" y="44" width="6" height="5" fill={SKIN} />
      <rect x="17" y="51" width="6" height="8" fill="#3f5570" />
      <rect x="25" y="51" width="6" height="8" fill="#3f5570" />
      <rect x="16" y="59" width="8" height="4" fill={SHOE} />
      <rect x="24" y="59" width="8" height="4" fill={SHOE} />

      {/* Cabeça */}
      <rect x="13" y="10" width="22" height="18" fill={SKIN} />
      <rect x="17" y="17" width="4" height="4" fill={EYE} />
      <rect x="27" y="17" width="4" height="4" fill={EYE} />
      <rect x="21" y="23" width="6" height="3" fill="#a9503f" />
      <rect x="13" y="10" width="22" height="4" fill={HAIR} />
    </g>
  );
}

function ClericSprite({ outfit }: { outfit: string }) {
  return (
    <g>
      {/* Cajado com orbe */}
      <rect x="5" y="14" width="3" height="42" fill={WOOD} />
      <rect x="3" y="10" width="7" height="7" fill="#ffd23f" />
      <rect x="4" y="11" width="3" height="3" fill="#ffffff" opacity="0.6" />

      {/* Robe longo */}
      <rect x="15" y="30" width="18" height="22" fill={outfit} />
      <rect x="15" y="30" width="18" height="3" fill="#ffffff" opacity="0.25" />
      <rect x="12" y="52" width="24" height="8" fill={outfit} />
      <rect x="12" y="52" width="24" height="3" fill="#ffffff" opacity="0.25" />
      <rect x="9" y="31" width="6" height="18" fill={outfit} />
      <rect x="33" y="31" width="6" height="18" fill={outfit} />
      <rect x="9" y="49" width="6" height="5" fill={SKIN} />
      <rect x="33" y="49" width="6" height="5" fill={SKIN} />

      {/* Símbolo sagrado */}
      <rect x="22" y="37" width="4" height="8" fill="#ffd23f" />
      <rect x="20" y="39" width="8" height="4" fill="#ffd23f" />

      {/* Cabeça com capuz */}
      <rect x="13" y="6" width="22" height="7" fill={LIGHT_HAIR} />
      <rect x="14" y="10" width="20" height="16" fill={SKIN} />
      <rect x="17" y="17" width="4" height="4" fill={EYE} />
      <rect x="27" y="17" width="4" height="4" fill={EYE} />
      <rect x="21" y="23" width="6" height="3" fill="#a9503f" />
      <rect x="12" y="12" width="24" height="4" fill={outfit} />
      <rect x="10" y="14" width="4" height="10" fill={outfit} />
      <rect x="34" y="14" width="4" height="10" fill={outfit} />
    </g>
  );
}

function DwarfSprite({ outfit }: { outfit: string }) {
  return (
    <g>
      {/* Corpo largo e baixo */}
      <rect x="14" y="32" width="20" height="20" fill={outfit} />
      <rect x="14" y="32" width="20" height="3" fill="#ffffff" opacity="0.25" />
      <rect x="10" y="34" width="6" height="14" fill={outfit} />
      <rect x="32" y="34" width="6" height="14" fill={outfit} />
      <rect x="10" y="48" width="6" height="4" fill={SKIN} />
      <rect x="32" y="48" width="6" height="4" fill={SKIN} />
      <rect x="17" y="52" width="6" height="7" fill="#3f5570" />
      <rect x="25" y="52" width="6" height="7" fill="#3f5570" />
      <rect x="16" y="59" width="8" height="4" fill={SHOE} />
      <rect x="24" y="59" width="8" height="4" fill={SHOE} />

      {/* Machado */}
      <rect x="4" y="30" width="4" height="18" fill={WOOD} />
      <rect x="1" y="24" width="10" height="8" fill={METAL} />

      {/* Cabeça com barba e elmo */}
      <rect x="15" y="18" width="18" height="14" fill={SKIN} />
      <rect x="18" y="24" width="4" height="4" fill={EYE} />
      <rect x="26" y="24" width="4" height="4" fill={EYE} />
      <rect x="16" y="28" width="16" height="10" fill="#c98f5f" />
      <rect x="14" y="12" width="20" height="8" fill="#5b6b8c" />
      <rect x="17" y="8" width="14" height="5" fill="#5b6b8c" />
    </g>
  );
}

function AvatarSprite({ avatarId, outfit }: { avatarId: AvatarId; outfit: string }) {
  switch (avatarId) {
    case "fighter":
      return <FighterSprite outfit={outfit} />;
    case "elf":
      return <ElfSprite outfit={outfit} />;
    case "cleric":
      return <ClericSprite outfit={outfit} />;
    case "dwarf":
      return <DwarfSprite outfit={outfit} />;
  }
}

export function HeroAvatar({
  avatarId = "fighter",
  colorId = "crimson",
  size = 96,
  className,
  title,
}: HeroAvatarProps) {
  const outfit = colorSpec(colorId).hex;
  const classes = ["hero-avatar", `hero-avatar--${avatarId}`, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 48 64"
      width={(size * 48) / 64}
      height={size}
      shapeRendering="crispEdges"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <AvatarSprite avatarId={avatarId} outfit={outfit} />
    </svg>
  );
}
