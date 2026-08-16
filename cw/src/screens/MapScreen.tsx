import { useState } from 'react';
import { BlockButton } from '../components/BlockButton';
import { Screen } from '../components/Screen';
import { Stars } from '../components/Stars';
import { IslandArt } from '../render/IslandArt';
import { useI18n } from '../i18n/I18nProvider';
import { useGame } from '../state/GameProvider';
import { getIslandProgress, suggestedTable } from '../domain/progression';
import { ISLANDS, getIsland } from '../domain/world';

interface MapScreenProps {
  onBack: () => void;
  onEnterMission: (table: number, missionId: string) => void;
}

/** Mapa do arquipélago: cada ilha é uma tabuada. */
export function MapScreen({ onBack, onEnterMission }: MapScreenProps) {
  const { t } = useI18n();
  const { state } = useGame();
  const [selected, setSelected] = useState<number>(suggestedTable(state.progress));

  const island = getIsland(selected);
  const islandProgress = getIslandProgress(state.progress, selected);
  const doneMissions = island.missions.filter(
    (m) => islandProgress.missions[m.id]?.completed,
  ).length;
  const completedIslands = ISLANDS.filter(
    (i) => getIslandProgress(state.progress, i.table).status === 'completed',
  ).length;

  return (
    <Screen
      title={t('map.title')}
      subtitle={t('map.overall', { done: completedIslands, total: ISLANDS.length })}
      onBack={onBack}
      backLabel={t('common.back')}
      className="screen--map"
    >
      <div className="map">
        <div className="map__islands">
          {ISLANDS.map((def) => {
            const progress = getIslandProgress(state.progress, def.table);
            const isSelected = def.table === selected;
            return (
              <button
                key={def.table}
                type="button"
                className={`island-card is-${progress.status}${isSelected ? ' is-selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setSelected(def.table)}
              >
                <IslandArt island={def} status={progress.status} size={104} />
                <span className="island-card__name">{t(def.nameKey)}</span>
                <span className={`tag tag--${progress.status}`}>
                  {t(`map.status.${progress.status}`)}
                </span>
                <Stars
                  value={progress.stars}
                  label={t('common.stars', { count: progress.stars })}
                  size={16}
                />
              </button>
            );
          })}
        </div>

        <aside className="map__detail">
          <IslandArt island={island} status={islandProgress.status} size={132} />
          <h2>{t(island.nameKey)}</h2>
          <p className="map__biome">{t(island.biomeKey)}</p>
          <p className="map__missions">
            {t('map.missionCount', { done: doneMissions, total: island.missions.length })}
          </p>

          {islandProgress.status === 'locked' ? (
            <p className="map__locked">
              {t('map.lockedHint', { island: t(`islands.${selected - 1}.name`) })}
            </p>
          ) : (
            <ul className="mission-list">
              {island.missions.map((mission, index) => {
                const done = islandProgress.missions[mission.id]?.completed ?? false;
                const previous = island.missions[index - 1];
                const previousDone =
                  index === 0 || (islandProgress.missions[previous?.id ?? '']?.completed ?? false);
                return (
                  <li key={mission.id} className={`mission-row${done ? ' is-done' : ''}`}>
                    <span className="mission-row__name">
                      {t(mission.titleKey)}
                      {mission.isFinal && <span className="tag tag--final">{t('missions.finalBadge')}</span>}
                    </span>
                    <Stars
                      value={islandProgress.missions[mission.id]?.bestStars ?? 0}
                      size={15}
                      label={t('common.stars', {
                        count: islandProgress.missions[mission.id]?.bestStars ?? 0,
                      })}
                    />
                    <BlockButton
                      variant={done ? 'secondary' : 'primary'}
                      disabled={!previousDone}
                      onClick={() => onEnterMission(selected, mission.id)}
                    >
                      {done ? t('result.replay') : t('map.enter')}
                    </BlockButton>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </Screen>
  );
}
