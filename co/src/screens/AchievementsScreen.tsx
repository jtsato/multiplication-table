import { useGame } from '../state/GameProvider';
import { useI18n } from '../i18n/useI18n';

export function AchievementsScreen({ onBack }: { onBack(): void }) {
  const { state } = useGame();
  const t = useI18n();
  return (
    <section className="screen-card auxiliary-screen">
      <div className="screen-heading">
        <button className="back-button" onClick={onBack}>
          ← {t('nav.back')}
        </button>
        <div>
          <h1>{t('achievements.title')}</h1>
          <p>{t('achievements.subtitle')}</p>
        </div>
      </div>
      <div className="achievement-grid">
        {state.achievements.map((item, index) => (
          <article
            key={item.id}
            className={item.unlockedAt ? 'achievement is-unlocked' : 'achievement'}
          >
            <span aria-hidden="true">
              {item.unlockedAt ? ['◆', '★', '⚡', '2×', '◉', '♛'][index] : '?'}
            </span>
            <div>
              <h2>{t(`achievement.${item.id}.name` as 'achievement.first-correct.name')}</h2>
              <p>
                {t(`achievement.${item.id}.description` as 'achievement.first-correct.description')}
              </p>
              {!item.unlockedAt && <small>🔒 {t('achievements.locked')}</small>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
