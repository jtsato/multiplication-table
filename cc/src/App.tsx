import { useCallback, useEffect, useState } from 'react';
import { audioService } from './audio/audioService';
import { CHALLENGE_QUESTION_COUNT } from './domain/challenge';
import { getMission, missionsForTable, type MissionDefinition } from './domain/missions';
import { nextMissionForTable } from './domain/progression';
import type { AvatarConfig, MascotId } from './domain/types';
import { toMissionResult, type LevelState } from './game/levelSession';
import { I18nProvider } from './i18n/I18nProvider';
import { GameProvider, useGame, type MissionCompletion } from './state/GameProvider';
import type { ProgressRepository } from './persistence/ProgressRepository';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { ArchipelagoCompleteScreen } from './screens/ArchipelagoCompleteScreen';
import { ChallengeScreen } from './screens/ChallengeScreen';
import { HomeScreen } from './screens/HomeScreen';
import { IslandCompleteScreen } from './screens/IslandCompleteScreen';
import { IslandStudyScreen } from './screens/IslandStudyScreen';
import { LevelResultScreen } from './screens/LevelResultScreen';
import { LevelScreen } from './screens/LevelScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SplashScreen } from './screens/SplashScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import { SoundToggle } from './ui/SoundToggle';
import './styles/global.css';

type Screen =
  | 'splash'
  | 'onboarding'
  | 'editCharacter'
  | 'home'
  | 'map'
  | 'islandStudy'
  | 'level'
  | 'result'
  | 'islandComplete'
  | 'archipelagoComplete'
  | 'challenge'
  | 'achievements'
  | 'settings';

interface FinishedMission {
  mission: MissionDefinition;
  level: LevelState;
  completion: MissionCompletion;
}

/**
 * Roteador do jogo.
 *
 * Sem biblioteca de rotas: o MVP tem um punhado de telas e um fluxo linear.
 * Uma variavel de estado descreve onde a crianca esta.
 */
function Game() {
  const game = useGame();
  const { state, ready } = game;

  const [screen, setScreen] = useState<Screen>('splash');
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  /** Ilha cuja tabuada esta aberta para estudo. */
  const [studyTable, setStudyTable] = useState<number | null>(null);
  const [finished, setFinished] = useState<FinishedMission | null>(null);
  // O final pode ser visto duas vezes: ao conquista-lo e ao reabrir o diploma
  // pela Home. So muda para onde a saida leva de volta.
  const [finaleOrigin, setFinaleOrigin] = useState<'map' | 'home'>('map');
  // Contador de corridas do desafio: serve de `key` para remontar a tela e
  // zerar a sessao quando a crianca joga de novo.
  const [challengeRun, setChallengeRun] = useState(0);

  // Mantem o audio alinhado com as configuracoes salvas.
  useEffect(() => {
    audioService.setSoundEnabled(state.settings.soundEffectsEnabled);
  }, [state.settings.soundEffectsEnabled]);

  useEffect(() => {
    audioService.setMusicEnabled(state.settings.musicEnabled);
  }, [state.settings.musicEnabled]);

  // Politica de autoplay: o audio so pode comecar apos uma interacao real.
  useEffect(() => {
    const unlock = () => audioService.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Reduz animacoes conforme a configuracao e a preferencia do sistema.
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = state.settings.reducedMotion ? 'on' : 'off';
  }, [state.settings.reducedMotion]);

  useEffect(() => {
    document.documentElement.lang = state.settings.locale;
  }, [state.settings.locale]);

  const leaveSplash = useCallback(() => {
    setScreen(state.player.onboardingCompleted ? 'home' : 'onboarding');
  }, [state.player.onboardingCompleted]);

  const enterMission = useCallback(
    (table: number) => {
      const mission = nextMissionForTable(state.progress, table) ?? missionsForTable(table)[0];
      if (!mission) {
        return;
      }
      setActiveMissionId(mission.id);
      setScreen('level');
    },
    [state.progress],
  );

  const startIsland = useCallback(
    (table: number) => {
      game.selectTable(table);
      setStudyTable(table);
      // Entrar na ilha pelo mapa passa pela tabuada, se a configuracao pedir.
      // "Proxima missao", vindo do resultado, nunca passa: ali a crianca ja
      // esta no meio da sessao e escolheu continuar.
      if (state.settings.studyBeforeMission) {
        setScreen('islandStudy');
        return;
      }
      enterMission(table);
    },
    [game, enterMission, state.settings.studyBeforeMission],
  );

  const handleFinishMission = useCallback(
    (level: LevelState) => {
      const mission = getMission(level.missionId);
      if (!mission) {
        setScreen('map');
        return;
      }
      const completion = game.finishMission(toMissionResult(level, new Date().toISOString()));
      setFinished({ mission, level, completion });

      // Fechar a ultima ilha vai direto para o final: uma celebracao so, a
      // maior. A tela de ilha concluida ainda anuncia a proxima ilha, que
      // aqui nao existe mais.
      if (completion.archipelagoCompleted) {
        setFinaleOrigin('map');
        setScreen('archipelagoComplete');
        return;
      }

      setScreen(completion.islandCompleted ? 'islandComplete' : 'result');
    },
    [game],
  );

  const handleNextMission = useCallback(() => {
    if (!finished) {
      setScreen('map');
      return;
    }
    const mission = nextMissionForTable(state.progress, finished.mission.table);
    if (!mission) {
      setScreen('map');
      return;
    }
    setActiveMissionId(mission.id);
    setScreen('level');
  }, [finished, state.progress]);

  const handleOnboardingFinish = useCallback(
    (avatar: AvatarConfig, mascotId: MascotId) => {
      game.completeOnboarding(avatar, mascotId);
      setScreen('map');
    },
    [game],
  );

  const toggleSound = useCallback(() => {
    const next = !state.settings.soundEffectsEnabled;
    game.setSoundEffectsEnabled(next);
    game.setMusicEnabled(next);
  }, [game, state.settings.soundEffectsEnabled]);

  const content = (() => {
    if (screen === 'splash') {
      return <SplashScreen ready={ready} onDone={leaveSplash} />;
    }

    if (screen === 'onboarding') {
      return (
        <OnboardingScreen
          locale={state.settings.locale}
          onLocaleChange={game.setLocale}
          onFinish={handleOnboardingFinish}
        />
      );
    }

    if (screen === 'editCharacter') {
      return (
        <OnboardingScreen
          editing
          locale={state.settings.locale}
          initialAvatar={state.player.avatar}
          initialMascotId={state.player.mascotId}
          onLocaleChange={game.setLocale}
          onCancel={() => setScreen('home')}
          onFinish={(avatar, mascotId) => {
            game.updateAvatar(avatar, mascotId);
            setScreen('home');
          }}
        />
      );
    }

    const home = (
      <HomeScreen
        state={state}
        onPlay={() => setScreen('map')}
        onAchievements={() => setScreen('achievements')}
        onSettings={() => setScreen('settings')}
        onEditCharacter={() => setScreen('editCharacter')}
        onDiploma={() => {
          setFinaleOrigin('home');
          setScreen('archipelagoComplete');
        }}
        onChallenge={() => setScreen('challenge')}
      />
    );

    const map = (
      <WorldMapScreen state={state} onBack={() => setScreen('home')} onEnterIsland={startIsland} />
    );

    if (screen === 'home') {
      return home;
    }

    if (screen === 'map') {
      return map;
    }

    if (screen === 'islandStudy' && studyTable !== null) {
      return (
        <IslandStudyScreen
          state={state}
          table={studyTable}
          onPlay={() => enterMission(studyTable)}
          onBack={() => setScreen('map')}
        />
      );
    }

    if (screen === 'level') {
      const mission = activeMissionId ? getMission(activeMissionId) : undefined;
      if (!mission) {
        return map;
      }
      return (
        <LevelScreen
          // Remontar a fase ao trocar de missao zera a sessao anterior.
          key={mission.id}
          state={state}
          mission={mission}
          onAnswer={game.recordAnswer}
          onFinish={handleFinishMission}
          onExit={() => setScreen('map')}
          onStudy={() => {
            setStudyTable(mission.table);
            setScreen('islandStudy');
          }}
          onTutorialSeen={game.markTutorialSeen}
        />
      );
    }

    if (screen === 'result' && finished) {
      return (
        <LevelResultScreen
          state={state}
          mission={finished.mission}
          level={finished.level}
          completion={finished.completion}
          onNextMission={handleNextMission}
          onBackToMap={() => setScreen('map')}
        />
      );
    }

    if (screen === 'islandComplete' && finished) {
      return (
        <IslandCompleteScreen
          state={state}
          table={finished.mission.table}
          unlockedTable={finished.completion.unlockedTable}
          onBackToMap={() => setScreen('map')}
        />
      );
    }

    if (screen === 'archipelagoComplete') {
      return (
        <ArchipelagoCompleteScreen
          state={state}
          origin={finaleOrigin}
          onBack={() => setScreen(finaleOrigin)}
          onChallenge={() => setScreen('challenge')}
        />
      );
    }

    if (screen === 'challenge') {
      return (
        <ChallengeScreen
          key={challengeRun}
          state={state}
          onAnswer={game.recordAnswer}
          onFinish={(score, elapsedMs) =>
            game.finishChallenge({
              score,
              total: CHALLENGE_QUESTION_COUNT,
              elapsedMs,
              completedAt: new Date().toISOString(),
            })
          }
          onRestart={() => setChallengeRun((run) => run + 1)}
          onExit={() => setScreen('home')}
        />
      );
    }

    if (screen === 'achievements') {
      return <AchievementsScreen state={state} onBack={() => setScreen('home')} />;
    }

    if (screen === 'settings') {
      return (
        <SettingsScreen
          state={state}
          storageAvailable={game.storageAvailable}
          onBack={() => setScreen('home')}
          onLocaleChange={game.setLocale}
          onMusicChange={game.setMusicEnabled}
          onSoundChange={game.setSoundEffectsEnabled}
          onMotionChange={game.setReducedMotion}
          onStudyChange={game.setStudyBeforeMission}
          onReset={() => {
            game.resetProgress();
            setFinished(null);
            setActiveMissionId(null);
            setScreen('onboarding');
          }}
        />
      );
    }

    // Estado inesperado: volta para um lugar seguro em vez de tela branca.
    return home;
  })();

  return (
    <>
      {content}
      {screen !== 'splash' && (
        <SoundToggle muted={!state.settings.soundEffectsEnabled} onToggle={toggleSound} />
      )}
    </>
  );
}

/** Ponte entre o estado do jogo e o idioma das telas. */
function LocalizedGame() {
  const { state } = useGame();
  return (
    <I18nProvider locale={state.settings.locale}>
      <Game />
    </I18nProvider>
  );
}

export interface AppProps {
  /** Injetavel para testes; producao sempre usa o repositorio padrao. */
  repository?: ProgressRepository;
}

export default function App({ repository }: AppProps = {}) {
  return (
    <GameProvider repository={repository}>
      <LocalizedGame />
    </GameProvider>
  );
}
