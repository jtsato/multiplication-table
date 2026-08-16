import type { BiomePalette } from '../domain/islands';

/**
 * Bloquinho: o mascote do jogo.
 * Um cubo simpatico que apresenta as missoes e comemora os acertos.
 */

interface MascotProps {
  palette: BiomePalette;
  size?: number;
  mood?: 'happy' | 'cheering' | 'thinking';
  className?: string;
}

export function Mascot({ palette, size = 72, mood = 'happy', className }: MascotProps) {
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
      {/* Antena */}
      <rect x="30" y="2" width="4" height="8" fill={palette.blockDark} />
      <rect x="26" y="0" width="12" height="6" rx="1" fill={palette.accent} />

      {/* Corpo */}
      <rect x="10" y="12" width="44" height="40" rx="4" fill={palette.accent} />
      <rect x="10" y="12" width="44" height="8" rx="4" fill="#ffffff" opacity="0.3" />

      {/* Rosto */}
      <rect x="20" y="26" width="8" height="9" rx="1" fill="#2b2233" />
      <rect x="36" y="26" width="8" height="9" rx="1" fill="#2b2233" />
      <rect x="22" y="27" width="3" height="3" fill="#ffffff" />
      <rect x="38" y="27" width="3" height="3" fill="#ffffff" />
      <rect x="24" y="41" width="16" height="4" rx="2" fill="#2b2233" />
      <rect x="14" y="36" width="6" height="5" fill={palette.accentSoft} opacity="0.8" />
      <rect x="44" y="36" width="6" height="5" fill={palette.accentSoft} opacity="0.8" />

      {/* Pes */}
      <rect x="16" y="52" width="12" height="6" rx="2" fill={palette.blockDark} />
      <rect x="36" y="52" width="12" height="6" rx="2" fill={palette.blockDark} />
    </svg>
  );
}
