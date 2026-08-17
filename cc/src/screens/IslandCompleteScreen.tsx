import { useEffect, type CSSProperties } from 'react';
import { audioService } from '../audio/audioService';
import { getIsland } from '../domain/islands';
import { getIslandProgress } from '../domain/progression';
import type { GameState } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';
import { IslandBadge } from '../art/IslandBadge';
import { Mascot } from '../art/Mascot';
import { Button } from '../ui/Button';
import { Stars } from '../ui/Stars';

const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => ({
  shape: (['strip', 'dot', 'square'] as const)[index % 3],
  left: `${(index * 13 + 5) % 100}%`,
  delay: `${(index % 9) * 0.17}s`,
  duration: `${2.6 + (index % 5) * 0.24}s`,
  rotation: `${(index * 37) % 180}deg`,
  colorIndex: index % 6,
}));

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
  const confettiColors = [
    island.palette.accent,
    island.palette.accentSoft,
    '#ffd23f',
    '#ff8fa3',
    '#7bc9ff',
    '#ffffff',
  ];

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
        {CONFETTI_PIECES.map((piece, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`confetti confetti--${piece.shape}`}
            style={
              {
                left: piece.left,
                background: confettiColors[piece.colorIndex],
                '--confetti-delay': piece.delay,
                '--confetti-duration': piece.duration,
                '--confetti-rotation': piece.rotation,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <Mascot palette={island.palette} size={92} mood="cheering" />

      <h1 className="island-complete__title">{t('islandComplete.title')}</h1>
      <p className="island-complete__subtitle">{t('islandComplete.subtitle', { table })}</p>

      <IslandBadge palette={island.palette} status="completed" size={190} />
      <Stars count={progress.stars} size={38} />

      {/* Nao ha ramo "acabou tudo" aqui: fechar a ultima ilha leva direto para
          a tela de final do jogo, que celebra o arquipelago inteiro. */}
      {unlockedTable !== null && (
        <p className="island-complete__unlock">
          {t('islandComplete.unlocked', { island: t(`islands.${unlockedTable}.name`) })}
        </p>
      )}

      <p className="island-complete__note">{t('islandComplete.keepPracticing')}</p>

      <Button size="lg" icon="🗺️" onClick={onBackToMap}>
        {t('islandComplete.backToMap')}
      </Button>
    </div>
  );
}
