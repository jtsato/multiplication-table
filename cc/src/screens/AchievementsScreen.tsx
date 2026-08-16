import { ACHIEVEMENTS, unlockedAchievementCount } from '../domain/achievements';
import { parseFactKey } from '../domain/facts';
import { weakestFacts } from '../domain/mastery';
import type { GameState } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';
import { ScreenLayout } from '../ui/ScreenLayout';

interface AchievementsScreenProps {
  state: GameState;
  onBack: () => void;
}

/** Conquistas e estatisticas, incluindo as contas que ainda precisam treino. */
export function AchievementsScreen({ state, onBack }: AchievementsScreenProps) {
  const { t } = useTranslation();
  const unlocked = unlockedAchievementCount(state.achievements);
  const byId = new Map(state.achievements.map((entry) => [entry.id, entry]));
  const toughest = weakestFacts(state.statistics.facts, 6).filter(
    (key) => (state.statistics.facts[key]?.masteryScore ?? 1) < 0.7,
  );

  return (
    <ScreenLayout
      title={t('achievements.title')}
      subtitle={t('achievements.subtitle', { unlocked, total: ACHIEVEMENTS.length })}
      onBack={onBack}
      backLabel={t('common.back')}
      variant="wide"
    >
      <ul className="achievements">
        {ACHIEVEMENTS.map((definition) => {
          const earned = byId.get(definition.id)?.unlocked ?? false;
          return (
            <li
              key={definition.id}
              className={`achievement ${earned ? 'achievement--earned' : 'achievement--locked'}`}
            >
              <span className="achievement__icon" aria-hidden="true">
                {earned ? definition.icon : '🔒'}
              </span>
              <span className="achievement__text">
                <strong className="achievement__name">
                  {t(`achievements.list.${definition.id}.name`)}
                </strong>
                <span className="achievement__description">
                  {earned
                    ? t(`achievements.list.${definition.id}.description`)
                    : t('achievements.locked')}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <section className="stats">
        <h2 className="stats__title">{t('achievements.statsTitle')}</h2>
        <dl className="stats__grid">
          <div className="stats__item">
            <dt>{t('achievements.totalQuestions')}</dt>
            <dd>{state.statistics.totalQuestions}</dd>
          </div>
          <div className="stats__item">
            <dt>{t('achievements.totalCorrect')}</dt>
            <dd>{state.statistics.totalCorrect}</dd>
          </div>
          <div className="stats__item">
            <dt>{t('achievements.bestStreak')}</dt>
            <dd>{state.statistics.bestStreak}</dd>
          </div>
          <div className="stats__item">
            <dt>{t('achievements.playSessions')}</dt>
            <dd>{state.statistics.playSessions}</dd>
          </div>
        </dl>

        <h3 className="stats__subtitle">{t('achievements.toughest')}</h3>
        {toughest.length === 0 ? (
          <p className="stats__empty">{t('achievements.toughestEmpty')}</p>
        ) : (
          <ul className="stats__facts">
            {toughest.map((key) => {
              const fact = parseFactKey(key);
              return (
                <li key={key} className="stats__fact">
                  {fact ? `${fact.a} × ${fact.b}` : key}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </ScreenLayout>
  );
}
