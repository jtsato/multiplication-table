import { useEffect, useRef, useState } from 'react';
import { audioService } from '../audio/audioService';
import { TABLES } from '../domain/facts';
import { getPalette } from '../domain/islands';
import { completedIslandCount } from '../domain/progression';
import type { GameState } from '../domain/types';
import { useTranslation } from '../i18n/I18nProvider';
import { Avatar } from '../art/Avatar';
import { Mascot } from '../art/Mascot';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

const WAVE_DURATION_MS = 600;

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
  const [waving, setWaving] = useState(false);
  const waveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (waveTimer.current !== null) {
        clearTimeout(waveTimer.current);
      }
    },
    [],
  );

  const waveAtAvatar = () => {
    audioService.play('click');
    setWaving(true);
    if (waveTimer.current !== null) {
      clearTimeout(waveTimer.current);
    }
    waveTimer.current = setTimeout(() => setWaving(false), WAVE_DURATION_MS);
  };

  return (
    <div className="home">
      <div className="home__hero">
        <Mascot palette={getPalette(2)} size={86} mood={waving ? 'waving' : 'happy'} />
        <div>
          <h1 className="home__title">{t('splash.title')}</h1>
          <p className="home__subtitle">{t('home.subtitle')}</p>
        </div>
      </div>

      <div className="home__card">
        <div className="home__avatar-group">
          <button
            type="button"
            className={['home__avatar', waving ? 'home__avatar--waving' : '']
              .filter(Boolean)
              .join(' ')}
            aria-label={t('a11y.heroWave')}
            onClick={waveAtAvatar}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                waveAtAvatar();
              }
            }}
          >
            <Avatar
              avatar={state.player.avatar}
              size={130}
              className={waving ? 'avatar--waving' : undefined}
            />
          </button>
          <Button variant="secondary" size="sm" onClick={onEditCharacter}>
            {t('home.changeCharacter')}
          </Button>
        </div>

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
        {/* Ghost, nao secondary: tres barras cheias empilhadas anulavam a
            hierarquia que o verde do "Jogar" deve carregar sozinho. */}
        <Button variant="ghost" size="lg" block icon="🏅" onClick={onAchievements}>
          {t('home.achievements')}
        </Button>
        <Button variant="ghost" size="lg" block icon="⚙" onClick={onSettings}>
          {t('home.settings')}
        </Button>
      </div>
    </div>
  );
}
