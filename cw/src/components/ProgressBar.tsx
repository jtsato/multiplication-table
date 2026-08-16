interface ProgressBarProps {
  value: number;
  total: number;
  label: string;
}

/** Barra feita de blocos discretos: cada peça é uma pergunta. */
export function ProgressBar({ value, total, label }: ProgressBarProps) {
  const safeTotal = Math.max(1, total);
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={value}
      aria-label={label}
    >
      {Array.from({ length: safeTotal }, (_, index) => (
        <span key={index} className={index < value ? 'progress__cell is-on' : 'progress__cell'} />
      ))}
    </div>
  );
}
