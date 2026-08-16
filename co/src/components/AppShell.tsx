import type { ReactNode } from 'react';
import { useI18n } from '../i18n/useI18n';

export function AppShell({
  children,
  onHome,
  compact = false,
}: {
  children: ReactNode;
  onHome?: () => void;
  compact?: boolean;
}) {
  const t = useI18n();
  return (
    <div className={`app-shell ${compact ? 'app-shell--compact' : ''}`}>
      <header className="topbar">
        <button className="brand" onClick={onHome} disabled={!onHome} aria-label={t('nav.home')}>
          <span className="brand__blocks" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>{t('app.name')}</span>
        </button>
      </header>
      <main>{children}</main>
      <div className="cloud cloud--one" />
      <div className="cloud cloud--two" />
    </div>
  );
}
