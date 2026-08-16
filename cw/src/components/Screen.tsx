import type { ReactNode } from 'react';
import { BlockButton } from './BlockButton';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  className?: string;
}

/** Moldura comum das telas: cabeçalho opcional + área de conteúdo rolável. */
export function Screen({ title, subtitle, onBack, backLabel, children, className = '' }: ScreenProps) {
  return (
    <section className={`screen ${className}`}>
      {(title || onBack) && (
        <header className="screen__header">
          {onBack && (
            <BlockButton variant="ghost" onClick={onBack} aria-label={backLabel}>
              ‹ {backLabel}
            </BlockButton>
          )}
          <div className="screen__titles">
            {title && <h1 className="screen__title">{title}</h1>}
            {subtitle && <p className="screen__subtitle">{subtitle}</p>}
          </div>
        </header>
      )}
      <div className="screen__body">{children}</div>
    </section>
  );
}
