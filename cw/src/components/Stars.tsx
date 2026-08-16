interface StarsProps {
  value: number;
  max?: number;
  size?: number;
  label: string;
}

/** Estrelas em blocos. O texto acessível não depende da cor nem da forma. */
export function Stars({ value, max = 3, size = 22, label }: StarsProps) {
  return (
    <span className="stars" role="img" aria-label={label}>
      {Array.from({ length: max }, (_, index) => (
        <svg
          key={index}
          width={size}
          height={size}
          viewBox="0 0 10 10"
          className={index < value ? 'star star--on' : 'star star--off'}
          aria-hidden="true"
        >
          <rect x="4" y="0" width="2" height="10" />
          <rect x="0" y="4" width="10" height="2" />
          <rect x="2" y="2" width="6" height="6" />
        </svg>
      ))}
    </span>
  );
}
