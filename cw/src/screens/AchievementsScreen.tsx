import { AchievementBadge } from '../components/AchievementBadge';
import { Screen } from '../components/Screen';
import { useI18n } from '../i18n/I18nProvider';
import { useGame } from '../state/GameProvider';
import { ACHIEVEMENTS } from '../domain/achievements';

export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { state } = useGame();
  const unlockedCount = state.achievements.filter((a) => a.unlocked).length;

  return (
    <Screen
      title={t('achievements.title')}
      subtitle={t('achievements.unlockedCount', {
        done: unlockedCount,
        total: ACHIEVEMENTS.length,
      })}
      onBack={onBack}
      backLabel={t('common.back')}
    >
      <ul className="achievements">
        {ACHIEVEMENTS.map((def) => {
          const unlocked = state.achievements.find((a) => a.id === def.id)?.unlocked ?? false;
          return (
            <li key={def.id} className={`achievement${unlocked ? ' is-unlocked' : ''}`}>
              <AchievementBadge def={def} unlocked={unlocked} />
              <div>
                <h3>{t(`achievements.${def.id}.name`)}</h3>
                <p>{t(`achievements.${def.id}.description`)}</p>
                {!unlocked && <span className="achievement__locked">{t('achievements.locked')}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
