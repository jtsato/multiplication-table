import { Avatar } from '../components/Avatar';
import { useGame } from '../state/GameProvider';
import { useI18n } from '../i18n/useI18n';
import { audioService } from '../services/audioService';

export function HomeScreen({
  onPlay,
  onAchievements,
  onSettings,
}: {
  onPlay(): void;
  onAchievements(): void;
  onSettings(): void;
}) {
  const { state } = useGame();
  const t = useI18n();
  const player = state.player!;
  const completed = Object.values(state.progress.tables).filter(
    (item) => item.status === 'completed',
  ).length;
  return (
    <section className="home-hero">
      <div className="home-copy">
        <span className="eyebrow">{t('app.name')}</span>
        <h1>{t('home.greeting', { name: player.name })}</h1>
        <p>{t('home.subtitle')}</p>
        <div className="home-actions">
          <button
            className="primary-button primary-button--hero"
            onClick={() => {
              audioService.setMusic(state.settings.musicEnabled);
              onPlay();
            }}
          >
            <span aria-hidden="true">▶</span>
            {t('home.play')}
          </button>
          <button className="secondary-button" onClick={onAchievements}>
            <span aria-hidden="true">★</span>
            {t('home.achievements')}
          </button>
          <button className="secondary-button" onClick={onSettings}>
            <span aria-hidden="true">⚙</span>
            {t('home.settings')}
          </button>
        </div>
        <div className="home-progress">
          <span>{t('home.progress', { completed })}</span>
          <div>
            <i style={{ width: `${(completed / 9) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="home-art">
        <div className="floating-island">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <Avatar
          style={player.avatarStyle}
          outfitColor={player.outfitColor}
          hairStyle={player.hairStyle}
          accessory={player.accessory}
          celebrating
        />
      </div>
    </section>
  );
}
