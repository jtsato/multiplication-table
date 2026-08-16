interface ProgressBarProps {
  /** 0..1 */
  value: number;
  label?: string;
  /** Mostra o valor em texto ao lado da barra. */
  caption?: string;
  tone?: 'default' | 'success';
}

/** Barra de progresso acessivel: sempre acompanhada de texto. */
export function ProgressBar({ value, label, caption, tone = 'default' }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div className="progress">
      {(label || caption) && (
        <div className="progress__header">
          {label && <span className="progress__label">{label}</span>}
          {caption && <span className="progress__caption">{caption}</span>}
        </div>
      )}
      <div
        className={`progress__track progress__track--${tone}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
      >
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
