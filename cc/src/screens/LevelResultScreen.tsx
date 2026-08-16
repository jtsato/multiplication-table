import { getAchievementDefinition } from '../domain/achievements';
import { getIsland } from '../domain/islands';
import type { MissionDefinition } from '../domain/missions';
import { missionProgress, nextMissionForTable } from '../domain/progression';
import type { GameState } from '../domain/types';
import { levelAccuracy, type LevelState } from '../game/levelSession';
import { useTranslation } from '../i18n/I18nProvider';
import { Mascot } from '../art/Mascot';
import { SceneView } from '../art/SceneView';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import type { MissionCompletion } from '../state/GameProvider';

interface LevelResultScreenProps {
  state: GameState;
  mission: MissionDefinition;
  level: LevelState;
  completion: MissionCompletion;
  onNextMission: () => void;
  onBackToMap: () => void;
}

/** Resultado da missao: o que foi construido, como foi e o que vem depois. */
export function LevelResultScreen({
  state,
  mission,
  level,
  completion,
  onNextMission,
  onBackToMap,
}: LevelResultScreenProps) {
  const { t } = useTranslation();
  const island = getIsland(mission.table);
  const missions = missionProgress(state.progress, mission.table);
  const hasNext = nextMissionForTable(state.progress, mission.table) !== undefined;
  const accuracyPercent = Math.round(levelAccuracy(level) * 100);
  const extraTries = level.totalAttempts - level.totalQuestions;

  return (
    <div className="result">
      <div className="result__scene">
        <SceneView
          scene={mission.scene}
          palette={island.palette}
          decor={island.decor}
          progress={1}
          avatar={state.player.avatar}
          reducedMotion={state.settings.reducedMotion}
          ariaLabel={t(`missions.${mission.scene}.done`)}
        />
      </div>

      <div className="result__panel">
        <div className="result__headline">
          <Mascot palette={island.palette} size={72} mood="cheering" />
          <div>
            <h1 className="result__title">{t('result.title')}</h1>
            <p className="result__done">{t(`missions.${mission.scene}.done`)}</p>
          </div>
        </div>

        <dl className="result__stats">
          <div className="result__stat">
            <dt>{t('result.correct')}</dt>
            <dd>
              {level.firstTryCorrect}/{level.totalQuestions}
            </dd>
          </div>
          <div className="result__stat">
            <dt>{t('result.mistakes')}</dt>
            <dd>{Math.max(0, extraTries)}</dd>
          </div>
          <div className="result__stat">
            <dt>{t('result.accuracy')}</dt>
            <dd>{accuracyPercent}%</dd>
          </div>
        </dl>

        <ProgressBar
          value={missions.total === 0 ? 0 : missions.completed / missions.total}
          label={t('result.islandProgress')}
          caption={t('map.missions', { completed: missions.completed, total: missions.total })}
        />

        {completion.newAchievements.length > 0 && (
          <div className="result__achievements">
            <h2 className="result__achievements-title">{t('result.newAchievements')}</h2>
            <ul className="result__achievements-list">
              {completion.newAchievements.map((id) => (
                <li key={id} className="result__achievement">
                  <span className="result__achievement-icon" aria-hidden="true">
                    {getAchievementDefinition(id)?.icon ?? '🏅'}
                  </span>
                  {t(`achievements.list.${id}.name`)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="result__actions">
          <Button variant="secondary" size="lg" onClick={onBackToMap}>
            {t('result.backToMap')}
          </Button>
          {hasNext && (
            <Button size="lg" icon="▶" onClick={onNextMission}>
              {t('result.nextMission')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
