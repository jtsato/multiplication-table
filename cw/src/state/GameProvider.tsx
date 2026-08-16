import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { evaluateAchievements } from '../domain/achievements';
import { recordAnswer } from '../domain/mastery';
import { applyMissionOutcome, type MissionOutcome, type ProgressUpdate } from '../domain/progression';
import { createDefaultState } from '../persistence/schema';
import { LocalStorageProgressRepository } from '../persistence/storageService';
import { audioService } from '../audio/audioService';
import type { ProgressRepository } from '../persistence/ProgressRepository';
import type {
  Fact,
  GameSettings,
  GameState,
  PlayerProfile,
} from '../domain/types';

interface GameContextValue {
  state: GameState;
  ready: boolean;
  /** Conquistas desbloqueadas agora (para o toast); limpe com clearToasts. */
  achievementToasts: string[];
  clearToasts: () => void;
  createPlayer: (player: PlayerProfile) => void;
  updateSettings: (patch: Partial<GameSettings>) => void;
  registerAnswer: (fact: Fact, correct: boolean) => void;
  finishMission: (outcome: MissionOutcome) => ProgressUpdate;
  markTutorialSeen: () => void;
  resetProgress: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  /** Injetável para testes ou para trocar por uma API futuramente. */
  repository?: ProgressRepository;
}

export function GameProvider({ children, repository }: GameProviderProps) {
  const repoRef = useRef<ProgressRepository>(repository ?? new LocalStorageProgressRepository());
  const [state, setState] = useState<GameState>(() => createDefaultState());
  const [ready, setReady] = useState(false);
  const [achievementToasts, setAchievementToasts] = useState<string[]>([]);

  // Carregamento inicial + contagem de sessão.
  useEffect(() => {
    let cancelled = false;
    void repoRef.current.load().then((loaded) => {
      if (cancelled) return;
      const withSession: GameState = {
        ...loaded,
        statistics: { ...loaded.statistics, playSessions: loaded.statistics.playSessions + 1 },
      };
      setState(withSession);
      setReady(true);
      void repoRef.current.save(withSession);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persistência: salva sempre que o estado muda (após o load inicial).
  useEffect(() => {
    if (!ready) return;
    void repoRef.current.save(state);
  }, [state, ready]);

  // Áudio segue as configurações.
  useEffect(() => {
    audioService.setEnabled(state.settings.soundEffectsEnabled, state.settings.musicEnabled);
    if (state.settings.musicEnabled && ready) audioService.startMusic();
    else audioService.stopMusic();
  }, [state.settings.soundEffectsEnabled, state.settings.musicEnabled, ready]);

  const applyAchievements = useCallback((next: GameState): GameState => {
    const now = new Date().toISOString();
    const evaluation = evaluateAchievements(
      next.achievements,
      { stats: next.statistics, progress: next.progress },
      now,
    );
    if (evaluation.newlyUnlocked.length > 0) {
      setAchievementToasts((current) => [...current, ...evaluation.newlyUnlocked]);
      audioService.play('unlock');
    }
    return { ...next, achievements: evaluation.achievements };
  }, []);

  const createPlayer = useCallback((player: PlayerProfile) => {
    setState((current) => ({
      ...current,
      player,
      progress: { ...current.progress, onboardingDone: true },
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }, []);

  const registerAnswer = useCallback(
    (fact: Fact, correct: boolean) => {
      setState((current) =>
        applyAchievements({
          ...current,
          statistics: recordAnswer(current.statistics, fact, correct, new Date().toISOString()),
        }),
      );
    },
    [applyAchievements],
  );

  /**
   * Aplica o resultado da missão. Retorna o update de forma síncrona para que
   * a tela de resultado saiba se a ilha foi concluída e o que foi desbloqueado.
   */
  const finishMission = useCallback(
    (outcome: MissionOutcome): ProgressUpdate => {
      const update = applyMissionOutcome(state.progress, outcome);
      setState((current) =>
        applyAchievements({ ...current, progress: applyMissionOutcome(current.progress, outcome).progress }),
      );
      return update;
    },
    [state.progress, applyAchievements],
  );

  const markTutorialSeen = useCallback(() => {
    setState((current) => ({ ...current, progress: { ...current.progress, tutorialSeen: true } }));
  }, []);

  const resetProgress = useCallback(() => {
    const locale = state.settings.locale;
    void repoRef.current.clear().then(() => {
      const fresh = createDefaultState(locale);
      setState(fresh);
      void repoRef.current.save(fresh);
    });
  }, [state.settings.locale]);

  const clearToasts = useCallback(() => setAchievementToasts([]), []);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      ready,
      achievementToasts,
      clearToasts,
      createPlayer,
      updateSettings,
      registerAnswer,
      finishMission,
      markTutorialSeen,
      resetProgress,
    }),
    [
      state,
      ready,
      achievementToasts,
      clearToasts,
      createPlayer,
      updateSettings,
      registerAnswer,
      finishMission,
      markTutorialSeen,
      resetProgress,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame precisa estar dentro de <GameProvider>');
  return ctx;
}
