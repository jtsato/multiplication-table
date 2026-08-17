/**
 * Avatar do herói/heroína, desenhado com blocos SVG (mesmo estilo do cc/src/art).
 *
 * Nada aqui muda regra de jogo: é pura apresentação. A única diferença entre
 * as variantes é a silhueta (cabelo, corpo e túnica/vestido).
 */

export type HeroVariant = "hero" | "heroine";

interface HeroAvatarProps {
  variant?: HeroVariant;
  /** Altura em pixels; a largura acompanha a proporção 3:4. */
  size?: number;
  className?: string;
  title?: string;
}

const SKIN = "#f2c59b";
const HAIR = "#6b4a2f";
const EYE = "#2b2233";
const SHOE = "#3b3247";
const HERO_OUTFIT = "#4a7fb5";
const HEROINE_OUTFIT = "#e06a9e";

function Hair({ variant }: { variant: HeroVariant }) {
  if (variant === "heroine") {
    return (
      <g fill={HAIR}>
        <rect x="13" y="6" width="22" height="7" />
        <rect x="35" y="15" width="6" height="13" />
        <rect x="33" y="13" width="5" height="4" />
      </g>
    );
  }
  return (
    <g fill={HAIR}>
      <rect x="13" y="6" width="22" height="7" />
      <rect x="13" y="13" width="3" height="5" />
      <rect x="32" y="13" width="3" height="5" />
    </g>
  );
}

function Body({ variant }: { variant: HeroVariant }) {
  const outfit = variant === "heroine" ? HEROINE_OUTFIT : HERO_OUTFIT;
  if (variant === "heroine") {
    return (
      <g>
        <rect x="16" y="30" width="16" height="13" fill={outfit} />
        <rect x="12" y="42" width="24" height="9" fill={outfit} />
        <rect x="12" y="42" width="24" height="3" fill="#ffffff" opacity="0.25" />
        <rect x="18" y="51" width="5" height="8" fill={SKIN} />
        <rect x="25" y="51" width="5" height="8" fill={SKIN} />
        <rect x="16" y="59" width="8" height="4" fill={SHOE} />
        <rect x="24" y="59" width="8" height="4" fill={SHOE} />
      </g>
    );
  }
  return (
    <g>
      <rect x="15" y="30" width="18" height="17" fill={outfit} />
      <rect x="15" y="30" width="18" height="3" fill="#ffffff" opacity="0.25" />
      {/* Cinto */}
      <rect x="15" y="43" width="18" height="3" fill="#c98f2d" />
      <rect x="17" y="47" width="6" height="12" fill="#3f5570" />
      <rect x="25" y="47" width="6" height="12" fill="#3f5570" />
      <rect x="15" y="59" width="8" height="4" fill={SHOE} />
      <rect x="25" y="59" width="8" height="4" fill={SHOE} />
    </g>
  );
}

export function HeroAvatar({ variant = "hero", size = 96, className, title }: HeroAvatarProps) {
  const classes = ["hero-avatar", `hero-avatar--${variant}`, className ?? ""]
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
      {/* Cabelo de trás primeiro (rabo de cavalo da heroína). */}
      {variant === "heroine" && <Hair variant={variant} />}

      {/* Braços */}
      <rect
        x="9"
        y="31"
        width="6"
        height="13"
        fill={variant === "heroine" ? HEROINE_OUTFIT : HERO_OUTFIT}
      />
      <rect
        x="33"
        y="31"
        width="6"
        height="13"
        fill={variant === "heroine" ? HEROINE_OUTFIT : HERO_OUTFIT}
      />
      <rect x="9" y="44" width="6" height="5" fill={SKIN} />
      <rect x="33" y="44" width="6" height="5" fill={SKIN} />

      <Body variant={variant} />

      {/* Espada do herói (à esquerda, atrás do corpo). */}
      {variant === "hero" && (
        <g>
          <rect x="3" y="22" width="3" height="26" fill="#c8ccd4" />
          <rect x="2" y="20" width="5" height="3" fill="#c98f2d" />
        </g>
      )}

      {/* Cabeça */}
      <rect x="13" y="10" width="22" height="18" fill={SKIN} />
      <rect x="17" y="17" width="4" height="4" fill={EYE} />
      <rect x="27" y="17" width="4" height="4" fill={EYE} />
      <rect x="15" y="21" width="3" height="3" fill="#ff8fa3" opacity="0.55" />
      <rect x="30" y="21" width="3" height="3" fill="#ff8fa3" opacity="0.55" />
      <rect x="21" y="23" width="6" height="3" fill="#a9503f" />

      <Hair variant={variant} />
    </svg>
  );
}
