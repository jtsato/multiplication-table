import { ISLANDS } from '../content/islands';
import type { TableNumber } from '../domain/types';
import { useGame } from '../state/GameProvider';
import { useI18n } from '../i18n/useI18n';

export function WorldMapScreen({
  onSelect,
  onBack,
}: {
  onSelect(table: TableNumber): void;
  onBack(): void;
}) {
  const { state } = useGame();
  const t = useI18n();
  return (
    <section className="screen-card map-screen">
      <div className="screen-heading">
        <button className="back-button" onClick={onBack}>
          ← {t('nav.back')}
        </button>
        <div>
          <h1>{t('map.title')}</h1>
          <p>{t('map.subtitle')}</p>
        </div>
      </div>
      <div className="island-grid">
        {ISLANDS.map((island, index) => {
          const progress = state.progress.tables[String(island.table)];
          const locked = progress.status === 'locked';
          return (
            <button
              key={island.table}
              disabled={locked}
              onClick={() => onSelect(island.table)}
              className={`island-card island-card--${progress.status}`}
              style={
                {
                  '--land': island.palette.land,
                  '--accent': island.palette.accent,
                  '--dark': island.palette.dark,
                  '--delay': index,
                } as React.CSSProperties
              }
            >
              <span className="island-card__status">
                {locked ? '🔒 ' : progress.status === 'completed' ? '✓ ' : ''}
                {t(`status.${progress.status}`)}
              </span>
              <span className="island-card__art">
                <i />
                <i />
                <i />
                <b>{island.table}</b>
              </span>
              <strong>{t('island.title', { table: island.table })}</strong>
              <small>{t(`biome.${island.biome}`)}</small>
              <span className="stars" aria-label={t('island.stars', { stars: progress.stars })}>
                {[1, 2, 3].map((star) => (
                  <i key={star} className={star <= progress.stars ? 'is-earned' : ''}>
                    ★
                  </i>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
