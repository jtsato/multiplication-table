import { ISLANDS } from '../domain/islands';
import {
  getIslandProgress,
  islandStatus,
  missionProgress,
  tableBefore,
} from '../domain/progression';
import type { GameState, IslandStatus } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';
import { IslandBadge } from '../art/IslandBadge';
import { Stars } from '../ui/Stars';
import { ScreenLayout } from '../ui/ScreenLayout';

interface WorldMapScreenProps {
  state: GameState;
  onBack: () => void;
  onEnterIsland: (table: number) => void;
}

const STATUS_ICON: Record<IslandStatus, string> = {
  locked: '🔒',
  available: '⛵',
  inProgress: '🔨',
  completed: '✅',
};

/**
 * Mapa do arquipelago.
 *
 * Cada ilha e um botao de verdade, entao da para navegar por teclado. O
 * estado aparece de tres formas ao mesmo tempo - desenho, icone e texto -
 * porque cor sozinha nao comunica status.
 */
export function WorldMapScreen({ state, onBack, onEnterIsland }: WorldMapScreenProps) {
  const { t } = useTranslation();

  return (
    <ScreenLayout
      title={t('map.title')}
      subtitle={t('map.subtitle')}
      onBack={onBack}
      backLabel={t('common.back')}
      variant="wide"
      className="map-screen"
    >
      <ol className="map">
        {ISLANDS.map((island) => {
          const status = islandStatus(state.progress, island.table);
          const progress = getIslandProgress(state.progress, island.table);
          const missions = missionProgress(state.progress, island.table);
          const locked = status === 'locked';
          const previousTable = tableBefore(island.table);

          return (
            <li key={island.table} className="map__item">
              <button
                type="button"
                className={`island island--${status}`}
                disabled={locked}
                aria-disabled={locked}
                onClick={() => !locked && onEnterIsland(island.table)}
              >
                <span className="island__badge">
                  <IslandBadge palette={island.palette} status={status} size={140} />
                  <span className="island__number" aria-hidden="true">
                    {island.table}
                  </span>
                </span>

                <span className="island__info">
                  <span className="island__name">{t(`islands.${island.table}.name`)}</span>
                  <span className="island__table">
                    {t('map.tableLabel', { table: island.table })}
                  </span>

                  <span className={`island__status island__status--${status}`}>
                    <span aria-hidden="true">{STATUS_ICON[status]}</span>
                    {t(`map.status.${status}`)}
                  </span>

                  {locked ? (
                    <span className="island__hint">
                      {t('map.lockedHint', { table: previousTable ?? island.table - 1 })}
                    </span>
                  ) : (
                    <>
                      <span className="island__hint">
                        {t('map.missions', {
                          completed: missions.completed,
                          total: missions.total,
                        })}
                      </span>
                      <Stars count={progress.stars} size={22} />
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </ScreenLayout>
  );
}
