import type { MascotKind } from '../domain/types';

/**
 * Bloquinho: o mascote do jogo.
 * Um cubo simpatico que apresenta as missoes e comemora os acertos.
 * O topo (`kind`) muda conforme o companheiro escolhido pelo jogador.
 */

interface MascotPalette {
  accent: string;
  accentSoft: string;
  blockDark: string;
}

interface MascotProps {
  palette: MascotPalette;
  size?: number;
  mood?: 'happy' | 'waving' | 'cheering' | 'thinking';
  kind?: MascotKind;
  className?: string;
}

function Topper({ kind, palette }: { kind: MascotKind; palette: MascotPalette }) {
  switch (kind) {
    case 'flame':
      return (
        <g>
          <rect x="27" y="6" width="10" height="8" rx="2" fill={palette.accent} />
          <rect x="29" y="0" width="6" height="8" rx="2" fill={palette.accentSoft} />
        </g>
      );
    case 'leaf':
      return (
        <g>
          <rect x="30" y="4" width="4" height="10" fill={palette.blockDark} />
          <rect
            x="20"
            y="0"
            width="16"
            height="8"
            rx="4"
            fill={palette.accent}
            transform="rotate(-20 28 4)"
          />
        </g>
      );
    case 'petals':
      return (
        <g>
          <rect x="30" y="6" width="4" height="8" fill={palette.blockDark} />
          <rect x="24" y="-2" width="16" height="10" rx="5" fill={palette.accent} />
          <rect x="29" y="1" width="6" height="6" rx="3" fill={palette.accentSoft} />
        </g>
      );
    case 'crystal':
      return (
        <g>
          <rect x="26" y="4" width="6" height="10" fill={palette.accent} />
          <rect x="32" y="-2" width="5" height="10" fill={palette.accentSoft} />
          <rect x="26" y="4" width="2" height="10" fill="#ffffff" opacity="0.3" />
        </g>
      );
    case 'antenna':
    default:
      return (
        <g>
          <rect x="30" y="2" width="4" height="8" fill={palette.blockDark} />
          <rect x="26" y="0" width="12" height="6" rx="1" fill={palette.accent} />
        </g>
      );
  }
}

export function Mascot({
  palette,
  size = 72,
  mood = 'happy',
  kind = 'antenna',
  className,
}: MascotProps) {
  const classes = ['mascot', `mascot--${mood}`, className ?? ''].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <Topper kind={kind} palette={palette} />

      {/* Arms respond to touch and celebrate with both hands raised. */}
      <g className="mascot__arms">
        <rect
          className={mood === 'cheering' ? 'mascot__arm mascot__arm--raised' : 'mascot__arm'}
          x={mood === 'cheering' ? 3 : 4}
          y={mood === 'cheering' ? 19 : 29}
          width="7"
          height="17"
          fill={palette.accent}
        />
        <rect
          className={
            mood === 'waving'
              ? 'mascot__arm mascot__arm--waving'
              : mood === 'cheering'
                ? 'mascot__arm mascot__arm--raised'
                : 'mascot__arm'
          }
          x={mood === 'cheering' ? 54 : 53}
          y={mood === 'waving' || mood === 'cheering' ? 18 : 29}
          width="7"
          height="18"
          fill={palette.accent}
        />
      </g>

      {/* Corpo */}
      <rect x="10" y="12" width="44" height="40" rx="4" fill={palette.accent} />
      <rect x="10" y="12" width="44" height="8" rx="4" fill="#ffffff" opacity="0.3" />

      {/* Rosto */}
      {mood === 'waving' ? (
        <g>
          <rect x="20" y="30" width="8" height="2" rx="1" fill="#2b2233" />
          <rect x="36" y="30" width="8" height="2" rx="1" fill="#2b2233" />
        </g>
      ) : (
        <g>
          <rect x="20" y="26" width="8" height="9" rx="1" fill="#2b2233" />
          <rect x="36" y="26" width="8" height="9" rx="1" fill="#2b2233" />
          <rect x="22" y="27" width="3" height="3" fill="#ffffff" />
          <rect x="38" y="27" width="3" height="3" fill="#ffffff" />
        </g>
      )}
      <g className="mascot__smile">
        <rect x="22" y="40" width="20" height="7" rx="2" fill="#2b2233" />
        <rect x="26" y="40" width="12" height="2" fill="#ffffff" opacity="0.8" />
        <rect x="29" y="44" width="6" height="2" fill={palette.accentSoft} opacity="0.9" />
      </g>
      <rect x="14" y="36" width="6" height="5" fill={palette.accentSoft} opacity="0.8" />
      <rect x="44" y="36" width="6" height="5" fill={palette.accentSoft} opacity="0.8" />

      {mood === 'cheering' && (
        <g className="mascot__sparkles" aria-hidden="true" fill={palette.accentSoft}>
          <rect x="5" y="8" width="4" height="4" />
          <rect x="52" y="4" width="3" height="3" />
          <rect x="12" y="2" width="3" height="3" />
          <rect x="10" y="20" width="8" height="2" />
          <rect x="13" y="17" width="2" height="8" />
        </g>
      )}

      {/* Pes */}
      <rect x="16" y="52" width="12" height="6" rx="2" fill={palette.blockDark} />
      <rect x="36" y="52" width="12" height="6" rx="2" fill={palette.blockDark} />
    </svg>
  );
}
