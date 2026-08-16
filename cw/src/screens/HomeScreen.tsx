import { BlockButton } from '../components/BlockButton';
import { useI18n } from '../i18n/I18nProvider';
import { useGame } from '../state/GameProvider';
import { AvatarPreview } from '../render/AvatarPreview';
import { Mascot } from '../render/Mascot';
import { suggestedTable } from '../domain/progression';
import { getIsland } from '../domain/world';

interface HomeScreenProps {
  onPlay: () => void;
  onAchievements: () => void;
  onSettings: () => void;
}

export function HomeScreen({ onPlay, onAchievements, onSettings }: HomeScreenProps) {
  const { t } = useI18n();
  const { state } = useGame();
  const island = getIsland(suggestedTable(state.progress));

  return (
    <section className="home">
      <div className="home__hero">
        <div className="logo logo--small" role="img" aria-label={t('app.title')}>
          {'BLOQUILHA'.split('').map((letter, index) => (
            <span className="logo__block" key={index} style={{ ['--i' as string]: index }}>
              {letter}
            </span>
          ))}
        </div>
        <p className="home__greeting">
          {state.player?.name
            ? t('home.greeting', { name: state.player.name })
            : t('home.greetingAnonymous')}
        </p>
        <p className="home__hint">{t('home.continueHint', { island: t(island.nameKey) })}</p>
      </div>

      <div className="home__crew">
        {state.player && <AvatarPreview avatar={state.player.avatar} size={120} />}
        <Mascot mood="cheer" size={96} />
      </div>

      <nav className="home__menu">
        <BlockButton variant="primary" size="xl" onClick={onPlay}>
          {t('home.play')}
        </BlockButton>
        <BlockButton variant="secondary" size="lg" onClick={onAchievements}>
          {t('home.achievements')}
        </BlockButton>
        <BlockButton variant="secondary" size="lg" onClick={onSettings}>
          {t('home.settings')}
        </BlockButton>
      </nav>
    </section>
  );
}
