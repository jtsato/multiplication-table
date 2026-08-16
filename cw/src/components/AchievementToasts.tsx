import { useEffect } from 'react';
import { AchievementBadge } from './AchievementBadge';
import { useI18n } from '../i18n/I18nProvider';
import { useGame } from '../state/GameProvider';
import { ACHIEVEMENTS } from '../domain/achievements';

/** Avisos discretos de conquista: não interrompem o fluxo do jogo. */
export function AchievementToasts() {
  const { t } = useI18n();
  const { achievementToasts, clearToasts } = useGame();

  useEffect(() => {
    if (achievementToasts.length === 0) return;
    const timer = setTimeout(clearToasts, 3200);
    return () => clearTimeout(timer);
  }, [achievementToasts, clearToasts]);

  if (achievementToasts.length === 0) return null;

  return (
    <div className="toasts" role="status" aria-live="polite">
      {achievementToasts.map((id) => {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (!def) return null;
        return (
          <div className="toast" key={id}>
            <AchievementBadge def={def} unlocked size={40} />
            <div>
              <strong>{t(`achievements.${id}.name`)}</strong>
              <span>{t(`achievements.${id}.description`)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
