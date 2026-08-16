import type { ReactNode } from 'react';
import { Button } from './Button';

interface ScreenLayoutProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  /** Conteudo fixo no rodape (acoes principais). */
  footer?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'wide';
  className?: string;
}

/** Moldura comum das telas: cabecalho, area rolavel e rodape. */
export function ScreenLayout({
  title,
  subtitle,
  onBack,
  backLabel,
  footer,
  children,
  variant = 'default',
  className,
}: ScreenLayoutProps) {
  return (
    <div className={['screen', `screen--${variant}`, className ?? ''].filter(Boolean).join(' ')}>
      {(title || onBack) && (
        <header className="screen__header">
          {onBack && (
            <Button variant="ghost" size="sm" icon="←" onClick={onBack}>
              {backLabel}
            </Button>
          )}
          <div className="screen__titles">
            {title && <h1 className="screen__title">{title}</h1>}
            {subtitle && <p className="screen__subtitle">{subtitle}</p>}
          </div>
        </header>
      )}

      <main className="screen__body">{children}</main>

      {footer && <footer className="screen__footer">{footer}</footer>}
    </div>
  );
}
