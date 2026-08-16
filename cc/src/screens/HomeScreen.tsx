import { TABLES } from '../domain/facts';
import { getPalette } from '../domain/islands';
import { completedIslandCount } from '../domain/progression';
import type { GameState } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';
import { Avatar } from '../art/Avatar';
import { Mascot } from '../art/Mascot';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

interface HomeScreenProps {
  state: GameState;
  onPlay: () => void;
  onAchievements: () => void;
  onSettings: () => void;
  onEditCharacter: () => void;
}

/** Tela inicial: jogar, conquistas e configuracoes. */
export function HomeScreen({
  state,
  onPlay,
  onAchievements,
  onSettings,
  onEditCharacter,
}: HomeScreenProps) {
  const { t } = useTranslation();
  const completed = completedIslandCount(state.progress);
  const total = TABLES.length;

  return (
    <div className="home">
      <div className="home__hero">
        <Mascot palette={getPalette(2)} size={86} mood="happy" />
        <div>
          <h1 className="home__title">{t('splash.title')}</h1>
          <p className="home__subtitle">{t('home.subtitle')}</p>
        </div>
      </div>

      <div className="home__card">
        <button type="button" className="home__avatar" onClick={onEditCharacter}>
          <Avatar avatar={state.player.avatar} size={130} />
          <span className="home__avatar-hint">{t('home.changeCharacter')}</span>
        </button>

        <div className="home__progress">
          <p className="home__greeting">{t('home.greeting')}</p>
          <ProgressBar
            value={completed / total}
            label={t('home.progress', { completed, total })}
            caption={`${completed}/${total}`}
            tone={completed === total ? 'success' : 'default'}
          />
        </div>
      </div>

      <div className="home__actions">
        <Button size="lg" block icon="▶" onClick={onPlay}>
          {t('home.play')}
        </Button>
        <Button variant="secondary" size="lg" block icon="🏅" onClick={onAchievements}>
          {t('home.achievements')}
        </Button>
        <Button variant="secondary" size="lg" block icon="⚙" onClick={onSettings}>
          {t('home.settings')}
        </Button>
      </div>
    </div>
  );
}
