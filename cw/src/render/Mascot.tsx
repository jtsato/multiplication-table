interface MascotProps {
  mood?: 'happy' | 'cheer' | 'think';
  size?: number;
}

/**
 * Bloquinho, o mascote: um cubo simpático com olhos. Desenho 100% original,
 * feito só com retângulos.
 */
export function Mascot({ mood = 'happy', size = 72 }: MascotProps) {
  const u = size / 10;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`mascot mascot--${mood}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect x={u} y={u * 2} width={u * 8} height={u * 7} fill="#5BD07A" />
      <rect x={u} y={u * 2} width={u * 8} height={u * 1.2} fill="#7BE39A" />
      <rect x={u} y={u * 7.8} width={u * 8} height={u * 1.2} fill="#3FA45F" />
      <rect x={u * 2.6} y={u * 4} width={u * 1.4} height={u * 1.4} fill="#1B2A5B" />
      <rect x={u * 6} y={u * 4} width={u * 1.4} height={u * 1.4} fill="#1B2A5B" />
      {mood === 'cheer' ? (
        <rect x={u * 3.4} y={u * 6} width={u * 3.2} height={u * 1.2} fill="#1B2A5B" />
      ) : (
        <rect x={u * 3.8} y={u * 6.2} width={u * 2.4} height={u * 0.7} fill="#1B2A5B" />
      )}
      <rect x={u * 4} y={u * 0.6} width={u * 2} height={u * 1.4} fill="#FFC53D" />
    </svg>
  );
}
