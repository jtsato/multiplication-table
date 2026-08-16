import { useCallback, useEffect, useState } from 'react';
import { I18nProvider } from './i18n/I18nProvider';
import { GameProvider, useGame } from './state/GameProvider';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MapScreen } from './screens/MapScreen';
import { MissionScreen } from './screens/MissionScreen';
import { ResultScreen } from './screens/ResultScreen';
import { IslandCompleteScreen } from './screens/IslandCompleteScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AchievementToasts } from './components/AchievementToasts';
import { getIsland } from './domain/world';
import { starsForAccuracy } from './domain/progression';

type Route =
  | { name: 'splash' }
  | { name: 'onboarding' }
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'mission'; table: number; missionId: string }
  | { name: 'result'; table: number; missionId: string; correct: number; total: number; stars: number }
  | { name: 'islandComplete'; table: number; unlockedTable: number | null }
  | { name: 'achievements' }
  | { name: 'settings' };

const SPLASH_MS = 900;

function Router() {
  const { state, ready, finishMission } = useGame();
  const [route, setRoute] = useState<Route>({ name: 'splash' });

  // Splash curto: sai assim que o save carrega.
  useEffect(() => {
    if (!ready || route.name !== 'splash') return;
    const timer = setTimeout(() => {
      setRoute(state.progress.onboardingDone ? { name: 'home' } : { name: 'onboarding' });
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, [ready, route.name, state.progress.onboardingDone]);

  const handleMissionFinish = useCallback(
    (table: number, missionId: string, correct: number, total: number) => {
      const update = finishMission({ table, missionId, correct, total });
      setRoute({
        name: 'result',
        table,
        missionId,
        correct,
        total,
        stars: update.stars || starsForAccuracy(total > 0 ? correct / total : 0),
      });
      if (update.islandCompleted) {
        // Mostra o resultado da missão e, em seguida, a celebração da ilha.
        setTimeout(
          () => setRoute({ name: 'islandComplete', table, unlockedTable: update.unlockedTable }),
          2200,
        );
      }
    },
    [finishMission],
  );

  const nextMissionId = useCallback(
    (table: number, missionId: string): string | null => {
      const missions = getIsland(table).missions;
      const index = missions.findIndex((m) => m.id === missionId);
      const next = missions[index + 1];
      return next ? next.id : null;
    },
    [],
  );

  if (!ready || route.name === 'splash') return <SplashScreen />;

  switch (route.name) {
    case 'onboarding':
      return <OnboardingScreen onDone={() => setRoute({ name: 'map' })} />;

    case 'home':
      return (
        <HomeScreen
          onPlay={() => setRoute({ name: 'map' })}
          onAchievements={() => setRoute({ name: 'achievements' })}
          onSettings={() => setRoute({ name: 'settings' })}
        />
      );

    case 'map':
      return (
        <MapScreen
          onBack={() => setRoute({ name: 'home' })}
          onEnterMission={(table, missionId) => setRoute({ name: 'mission', table, missionId })}
        />
      );

    case 'mission':
      return (
        <MissionScreen
          key={`${route.table}-${route.missionId}`}
          table={route.table}
          missionId={route.missionId}
          onFinish={({ correct, total }) =>
            handleMissionFinish(route.table, route.missionId, correct, total)
          }
          onQuit={() => setRoute({ name: 'map' })}
        />
      );

    case 'result': {
      const next = nextMissionId(route.table, route.missionId);
      return (
        <ResultScreen
          correct={route.correct}
          total={route.total}
          stars={route.stars}
          hasNextMission={next !== null}
          onNext={() =>
            next && setRoute({ name: 'mission', table: route.table, missionId: next })
          }
          onMap={() => setRoute({ name: 'map' })}
        />
      );
    }

    case 'islandComplete':
      return (
        <IslandCompleteScreen
          table={route.table}
          unlockedTable={route.unlockedTable}
          onContinue={() => setRoute({ name: 'map' })}
        />
      );

    case 'achievements':
      return <AchievementsScreen onBack={() => setRoute({ name: 'home' })} />;

    case 'settings':
      return <SettingsScreen onBack={() => setRoute({ name: 'home' })} />;

    default:
      return <HomeScreen onPlay={() => setRoute({ name: 'map' })} onAchievements={() => setRoute({ name: 'achievements' })} onSettings={() => setRoute({ name: 'settings' })} />;
  }
}

/** Ponte entre o idioma salvo e o provider de tradução. */
function LocalizedApp() {
  const { state } = useGame();
  return (
    <I18nProvider locale={state.settings.locale}>
      <div className={`app${state.settings.reducedMotion ? ' reduced-motion' : ''}`}>
        <Router />
        <AchievementToasts />
      </div>
    </I18nProvider>
  );
}

export default function App() {
  return (
    <GameProvider>
      <LocalizedApp />
    </GameProvider>
  );
}
