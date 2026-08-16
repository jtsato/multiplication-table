import { useEffect } from 'react';
import { audioService } from '../audio/audioService';
import { getIsland } from '../domain/islands';
import { getIslandProgress, isArchipelagoComplete } from '../domain/progression';
import type { GameState } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';
import { IslandBadge } from '../art/IslandBadge';
import { Mascot } from '../art/Mascot';
import { Button } from '../ui/Button';
import { Stars } from '../ui/Stars';

interface IslandCompleteScreenProps {
  state: GameState;
  table: number;
  unlockedTable: number | null;
  onBackToMap: () => void;
}

/** Celebracao maior: a ilha inteira ficou pronta e a proxima abriu. */
export function IslandCompleteScreen({
  state,
  table,
  unlockedTable,
  onBackToMap,
}: IslandCompleteScreenProps) {
  const { t } = useTranslation();
  const island = getIsland(table);
  const progress = getIslandProgress(state.progress, table);
  const finishedEverything = isArchipelagoComplete(state.progress);

  useEffect(() => {
    audioService.play('unlock');
  }, []);

  return (
    <div
      className="island-complete"
      style={{
        background: `linear-gradient(160deg, ${island.palette.skyTop}, ${island.palette.skyBottom})`,
      }}
    >
      <div className="island-complete__confetti" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            className="confetti"
            style={{
              left: `${(index * 7 + 4) % 100}%`,
              background: [island.palette.accent, island.palette.accentSoft, '#ffffff'][index % 3],
              animationDelay: `${(index % 7) * 0.22}s`,
            }}
          />
        ))}
      </div>

      <Mascot palette={island.palette} size={92} mood="cheering" />

      <h1 className="island-complete__title">{t('islandComplete.title')}</h1>
      <p className="island-complete__subtitle">{t('islandComplete.subtitle', { table })}</p>

      <IslandBadge palette={island.palette} status="completed" size={190} />
      <Stars count={progress.stars} size={38} />

      {finishedEverything ? (
        <p className="island-complete__unlock">{t('islandComplete.allDone')}</p>
      ) : (
        unlockedTable !== null && (
          <p className="island-complete__unlock">
            {t('islandComplete.unlocked', { island: t(`islands.${unlockedTable}.name`) })}
          </p>
        )
      )}

      <p className="island-complete__note">{t('islandComplete.keepPracticing')}</p>

      <Button size="lg" icon="🗺️" onClick={onBackToMap}>
        {t('islandComplete.backToMap')}
      </Button>
    </div>
  );
}
