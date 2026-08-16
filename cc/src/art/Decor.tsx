import type { BiomePalette, DecorKind } from '../domain/islands';

/**
 * Enfeites de cenario feitos de blocos.
 * Cada sprite e desenhado a partir do chao para cima, para poder ser colocado
 * em qualquer linha de solo.
 */

interface DecorProps {
  kind: DecorKind;
  /** Canto esquerdo do sprite. */
  x: number;
  /** Linha do chao onde o sprite se apoia. */
  groundY: number;
  palette: BiomePalette;
}

export function Decor({ kind, x, groundY, palette }: DecorProps) {
  const y = (height: number) => groundY - height;

  switch (kind) {
    case 'tree':
      return (
        <g>
          <rect x={x + 9} y={y(16)} width="8" height="16" fill={palette.groundDeep} />
          <rect x={x} y={y(30)} width="26" height="14" fill={palette.groundTop} />
          <rect x={x + 6} y={y(40)} width="14" height="10" fill={palette.groundMid} />
        </g>
      );
    case 'pine':
      return (
        <g>
          <rect x={x + 10} y={y(12)} width="6" height="12" fill={palette.groundDeep} />
          <rect x={x} y={y(22)} width="26" height="10" fill={palette.groundMid} />
          <rect x={x + 4} y={y(32)} width="18" height="10" fill={palette.groundTop} />
          <rect x={x + 8} y={y(42)} width="10" height="10" fill={palette.groundMid} />
        </g>
      );
    case 'flower':
      return (
        <g>
          <rect x={x + 8} y={y(12)} width="4" height="12" fill={palette.groundMid} />
          <rect x={x + 2} y={y(20)} width="16" height="8" fill={palette.accent} />
          <rect x={x + 8} y={y(18)} width="4" height="4" fill={palette.accentSoft} />
        </g>
      );
    case 'crystal':
      return (
        <g>
          <rect x={x + 6} y={y(24)} width="10" height="24" fill={palette.accent} opacity="0.9" />
          <rect x={x + 16} y={y(14)} width="7" height="14" fill={palette.accentSoft} />
          <rect x={x + 6} y={y(24)} width="4" height="24" fill="#ffffff" opacity="0.3" />
        </g>
      );
    case 'rock':
      return (
        <g>
          <rect x={x} y={y(12)} width="24" height="12" fill={palette.groundDeep} />
          <rect x={x + 6} y={y(20)} width="12" height="8" fill={palette.groundMid} />
        </g>
      );
    case 'mushroom':
      return (
        <g>
          <rect x={x + 8} y={y(12)} width="6" height="12" fill="#f6f1e7" />
          <rect x={x + 2} y={y(22)} width="18" height="10" fill={palette.accent} />
          <rect x={x + 6} y={y(20)} width="4" height="4" fill="#ffffff" opacity="0.7" />
        </g>
      );
    case 'lamp':
    default:
      return (
        <g>
          <rect x={x + 8} y={y(28)} width="5" height="28" fill={palette.groundDeep} />
          <rect x={x + 3} y={y(38)} width="15" height="10" fill={palette.accentSoft} />
          <rect x={x + 6} y={y(36)} width="9" height="4" fill="#ffffff" opacity="0.5" />
        </g>
      );
  }
}
