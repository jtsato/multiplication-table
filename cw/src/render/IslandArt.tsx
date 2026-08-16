import type { IslandStatus } from '../domain/types';
import type { IslandDef } from '../domain/world';

interface IslandArtProps {
  island: IslandDef;
  status: IslandStatus;
  size?: number;
}

/**
 * Ilha do mapa desenhada em SVG com blocos. Ilhas concluídas ganham
 * construções e cores vivas; bloqueadas ficam dessaturadas e com cadeado.
 */
export function IslandArt({ island, status, size = 120 }: IslandArtProps) {
  const p = island.palette;
  const locked = status === 'locked';
  const completed = status === 'completed';
  const u = size / 12;
  const b = (x: number, y: number, w: number, h: number, fill: string, key: string) => (
    <rect key={key} x={x * u} y={y * u} width={w * u} height={h * u} fill={fill} />
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`island-art${locked ? ' is-locked' : ''}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* base da ilha */}
      {b(2, 6, 8, 1, p.ground, 'top')}
      {b(2.5, 7, 7, 1.4, p.groundDark, 'mid')}
      {b(3.5, 8.4, 5, 1.2, p.groundDark, 'bottom')}
      {/* água ao redor */}
      {b(1, 9.6, 10, 0.8, p.water, 'water')}
      {/* elementos do bioma */}
      {b(3.4, 4.6, 1.2, 1.4, p.prop, 'prop1')}
      {b(3.1, 3.8, 1.8, 1, p.prop, 'prop2')}
      {completed ? (
        <>
          {b(6, 3.4, 2, 2.6, p.accent, 'build1')}
          {b(6.4, 2.6, 1.2, 0.8, p.prop, 'build2')}
          {b(8.2, 4.8, 1.2, 1.2, p.accent, 'build3')}
        </>
      ) : (
        b(7, 5, 1.4, 1, p.accent, 'rock')
      )}
      {locked && (
        <g>
          <rect x={size * 0.36} y={size * 0.38} width={size * 0.28} height={size * 0.22} rx="3" fill="#33406B" />
          <rect x={size * 0.42} y={size * 0.28} width={size * 0.16} height={size * 0.14} fill="none" stroke="#33406B" strokeWidth={size * 0.05} />
          <rect x={size * 0.47} y={size * 0.44} width={size * 0.06} height={size * 0.09} fill="#FFD93D" />
        </g>
      )}
    </svg>
  );
}
