import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import type { TableNumber } from './domain/types';
import type { ProgressRepository } from './services/progressRepository';
import { GameProvider, useGame } from './state/GameProvider';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { GameScreen, type ResultSummary } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ResultScreen } from './screens/ResultScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import { useI18n } from './i18n/useI18n';

type Screen = 'home' | 'map' | 'achievements' | 'settings' | 'game' | 'result';

function GameApp() {
  const { state, loading } = useGame();
  const t = useI18n();
  const [screen, setScreen] = useState<Screen>('home');
  const [table, setTable] = useState<TableNumber>(2);
  const [result, setResult] = useState<ResultSummary | null>(null);
  useEffect(() => {
    document.documentElement.lang = state.settings.locale;
    document.title = t('app.name');
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t('app.description'));
  }, [state.settings.locale, t]);
  if (loading)
    return (
      <div className="splash">
        <div className="block-logo block-logo--spin">
          <i />
          <i />
          <i />
          <i />
        </div>
        <p>{t('splash.loading')}</p>
      </div>
    );
  if (!state.player)
    return (
      <AppShell compact>
        <OnboardingScreen onComplete={() => setScreen('map')} />
      </AppShell>
    );
  const selectIsland = (selected: TableNumber) => {
    setTable(selected);
    setScreen('game');
  };
  const complete = (summary: ResultSummary) => {
    setResult(summary);
    setScreen('result');
  };
  return (
    <AppShell
      onHome={screen === 'home' ? undefined : () => setScreen('home')}
      compact={screen === 'game' || screen === 'result'}
    >
      {screen === 'home' && (
        <HomeScreen
          onPlay={() => setScreen('map')}
          onAchievements={() => setScreen('achievements')}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'map' && (
        <WorldMapScreen onSelect={selectIsland} onBack={() => setScreen('home')} />
      )}
      {screen === 'achievements' && <AchievementsScreen onBack={() => setScreen('home')} />}
      {screen === 'settings' && (
        <SettingsScreen onBack={() => setScreen('home')} onReset={() => setScreen('home')} />
      )}
      {screen === 'game' && (
        <GameScreen table={table} onLeave={() => setScreen('map')} onComplete={complete} />
      )}
      {screen === 'result' && result && (
        <ResultScreen result={result} onMap={() => setScreen('map')} />
      )}
    </AppShell>
  );
}

export function App({ repository }: { repository?: ProgressRepository }) {
  return (
    <GameProvider repository={repository}>
      <GameApp />
    </GameProvider>
  );
}
