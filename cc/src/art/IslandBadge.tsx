import type { BiomePalette } from '../domain/islands';
import type { IslandStatus } from '../domain/types';

/**
 * A ilha desenhada no mapa do arquipelago.
 *
 * O estado muda a aparencia: bloqueada fica acinzentada com um cadeado,
 * concluida ganha construcoes e bandeira. O status NUNCA e comunicado so
 * pela cor - ha icone e texto junto, na tela do mapa.
 */

interface IslandBadgeProps {
  palette: BiomePalette;
  status: IslandStatus;
  size?: number;
}

export function IslandBadge({ palette, status, size = 132 }: IslandBadgeProps) {
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

      {/* Corpo da ilha */}
      <rect x="12" y="56" width="96" height="14" fill={palette.groundDeep} />
      <rect x="18" y="44" width="84" height="14" fill={palette.groundMid} />
      <rect x="24" y="32" width="72" height="14" fill={palette.groundTop} />

      {completed ? (
        <g>
          {/* Ilha viva: casinhas, torre e bandeira */}
          <rect x="34" y="20" width="16" height="12" fill={palette.block} />
          <rect x="32" y="14" width="20" height="7" fill={palette.accent} />
          <rect x="60" y="12" width="12" height="20" fill={palette.blockLight} />
          <rect x="58" y="6" width="16" height="7" fill={palette.accent} />
          <rect x="80" y="24" width="6" height="8" fill={palette.blockDark} />
          <rect x="86" y="18" width="12" height="7" fill={palette.accentSoft} />
        </g>
      ) : (
        <g>
          {/* Ilha ainda selvagem */}
          <rect x="38" y="24" width="6" height="8" fill={palette.groundDeep} />
          <rect x="32" y="16" width="18" height="9" fill={palette.groundMid} />
          <rect x="72" y="26" width="5" height="6" fill={palette.groundDeep} />
          <rect x="67" y="20" width="15" height="7" fill={palette.groundMid} />
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
