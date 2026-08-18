import type { ReactNode } from 'react';
import type { BiomeId, BiomePalette } from '../domain/islands';
import type { IslandStatus } from '../domain/types';

/**
 * A ilha desenhada no mapa do arquipelago.
 *
 * O estado muda a aparencia: bloqueada fica acinzentada com um cadeado,
 * concluida ganha construcoes e bandeira. O status NUNCA e comunicado so
 * pela cor - ha icone e texto junto, na tela do mapa.
 */

export interface IslandBadgeProps {
  biome?: BiomeId;
  palette: BiomePalette;
  status: IslandStatus;
  size?: number;
}

const LANDMARKS: Record<BiomeId, (palette: BiomePalette) => ReactNode> = {
  fields: (palette) => (
    <>
      <rect x="30" y="46" width="60" height="8" fill={palette.groundMid} />
      <rect x="38" y="38" width="44" height="8" fill={palette.groundTop} />
      <rect x="46" y="30" width="28" height="8" fill={palette.groundMid} />
      <rect x="57" y="22" width="4" height="16" fill={palette.blockDark} />
      <rect x="52" y="18" width="6" height="6" fill={palette.blockLight} />
      <rect x="60" y="18" width="6" height="6" fill={palette.blockLight} />
      <rect x="48" y="24" width="6" height="6" fill={palette.blockLight} />
      <rect x="64" y="24" width="6" height="6" fill={palette.blockLight} />
      <rect x="56" y="28" width="6" height="6" fill={palette.blockLight} />
      <rect x="56" y="23" width="6" height="6" fill={palette.accent} />
    </>
  ),
  forest: (palette) => (
    <>
      <rect x="57" y="38" width="8" height="18" fill={palette.blockDark} />
      <path d="M42 40h38L61 16 42 40Z" fill={palette.groundMid} />
      <path d="M46 34h30L61 10 46 34Z" fill={palette.groundTop} />
      <path d="M50 27h22L61 4 50 27Z" fill={palette.groundMid} />
    </>
  ),
  mountains: (palette) => (
    <>
      <path d="M60 8 82 34 60 58 38 34 60 8Z" fill={palette.block} />
      <path d="M60 8 60 34 38 34 60 8Z" fill={palette.blockLight} />
      <path d="M60 34 82 34 60 58 60 34Z" fill={palette.blockDark} />
      <path d="M60 34 60 58 38 34 60 34Z" fill={palette.accent} />
    </>
  ),
  beach: (palette) => (
    <>
      <path d="M38 43h44l-8 10H46l-8-10Z" fill={palette.blockDark} />
      <rect x="59" y="16" width="4" height="28" fill={palette.blockDark} />
      <path d="M63 18 78 39H63V18Z" fill={palette.blockLight} />
      <path d="M58 22 45 39h13V22Z" fill={palette.accentSoft} />
      <rect x="32" y="57" width="56" height="4" fill={palette.water} />
    </>
  ),
  magicForest: (palette) => (
    <>
      <path d="m60 8 6 18 18 8-18 6-6 18-6-18-18-6 18-8 6-18Z" fill={palette.accent} />
      <path d="m34 17 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill={palette.accentSoft} />
      <path d="m85 35 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill={palette.blockLight} />
    </>
  ),
  caves: (palette) => (
    <>
      <path d="M34 54V39C34 21 46 12 60 12s26 9 26 27v15H34Z" fill={palette.groundDeep} />
      <path d="M42 54V40c0-12 8-20 18-20s18 8 18 20v14H42Z" fill={palette.blockDark} />
      <path d="m60 25 9 13-9 14-9-14 9-13Z" fill={palette.accent} />
      <path d="m60 25 9 13H60V25Z" fill={palette.accentSoft} />
    </>
  ),
  ice: (palette) => (
    <>
      <rect x="58" y="10" width="4" height="46" fill={palette.blockLight} />
      <rect
        x="58"
        y="10"
        width="4"
        height="46"
        fill={palette.blockLight}
        transform="rotate(60 60 33)"
      />
      <rect
        x="58"
        y="10"
        width="4"
        height="46"
        fill={palette.blockLight}
        transform="rotate(120 60 33)"
      />
      <rect x="56" y="29" width="8" height="8" fill={palette.accent} />
    </>
  ),
  volcano: (palette) => (
    <>
      <path d="M32 54 60 12l28 42H32Z" fill={palette.groundDeep} />
      <path d="m51 39 9-15 9 15-5 11h-8l-5-11Z" fill={palette.blockDark} />
      <rect x="57" y="31" width="6" height="17" fill={palette.accentSoft} />
      <rect x="47" y="8" width="10" height="8" fill={palette.blockLight} />
      <rect x="63" y="3" width="12" height="10" fill={palette.block} />
    </>
  ),
  city: (palette) => (
    <>
      <rect x="36" y="28" width="14" height="26" fill={palette.block} />
      <path d="M34 28 43 18l9 10H34Z" fill={palette.accent} />
      <rect x="70" y="28" width="14" height="26" fill={palette.block} />
      <path d="m68 28 9-10 9 10H68Z" fill={palette.accent} />
      <rect x="50" y="20" width="20" height="34" fill={palette.blockLight} />
      <path d="m48 20 12-12 12 12H48Z" fill={palette.accentSoft} />
      <rect x="56" y="42" width="8" height="12" fill={palette.blockDark} />
    </>
  ),
};

export function IslandBadge({ biome, palette, status, size = 132 }: IslandBadgeProps) {
  const locked = status === 'locked';
  const completed = status === 'completed';

  return (
    <svg
      className={`island-badge island-badge--${status}`}
      viewBox="0 0 120 104"
      width={size}
      height={(size * 104) / 120}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Mar em volta */}
      <rect x="0" y="66" width="120" height="14" rx="3" fill={palette.waterDeep} opacity="0.55" />
      <rect x="4" y="62" width="112" height="10" rx="3" fill={palette.water} opacity="0.75" />

      {biome ? (
        <g data-landmark={biome}>{LANDMARKS[biome](palette)}</g>
      ) : (
        <>
          {/* Compatibilidade com o badge usado na tela de conclusao. */}
          <rect x="12" y="56" width="96" height="14" fill={palette.groundDeep} />
          <rect x="18" y="44" width="84" height="14" fill={palette.groundMid} />
          <rect x="24" y="32" width="72" height="14" fill={palette.groundTop} />
          {completed ? (
            <g>
              <rect x="34" y="20" width="16" height="12" fill={palette.block} />
              <rect x="32" y="14" width="20" height="7" fill={palette.accent} />
              <rect x="60" y="12" width="12" height="20" fill={palette.blockLight} />
              <rect x="58" y="6" width="16" height="7" fill={palette.accent} />
              <rect x="80" y="24" width="6" height="8" fill={palette.blockDark} />
              <rect x="86" y="18" width="12" height="7" fill={palette.accentSoft} />
            </g>
          ) : (
            <g>
              <rect x="38" y="24" width="6" height="8" fill={palette.groundDeep} />
              <rect x="32" y="16" width="18" height="9" fill={palette.groundMid} />
              <rect x="72" y="26" width="5" height="6" fill={palette.groundDeep} />
              <rect x="67" y="20" width="15" height="7" fill={palette.groundMid} />
            </g>
          )}
        </>
      )}

      {completed && biome && (
        <g data-completion-accent>
          <rect x="98" y="18" width="4" height="22" fill={palette.blockDark} />
          <path d="M102 18h12l-6 7 6 7h-12V18Z" fill={palette.accent} />
        </g>
      )}

      {locked && (
        <g>
          <rect x="0" y="0" width="120" height="104" fill="#1c2333" opacity="0.55" />
          <rect x="48" y="40" width="24" height="20" rx="3" fill="#f4f6fb" />
          <rect
            x="54"
            y="30"
            width="12"
            height="14"
            rx="6"
            fill="none"
            stroke="#f4f6fb"
            strokeWidth="4"
          />
          <rect x="57" y="46" width="6" height="8" fill="#3b4658" />
        </g>
      )}
    </svg>
  );
}
