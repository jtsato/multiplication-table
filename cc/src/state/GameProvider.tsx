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
import { createDefaultState } from '../domain/defaultState';
import { applyMissionResult, type MissionResult } from '../domain/progression';
import { recordAnswer as recordAnswerStat, startSession } from '../domain/statistics';
import type { AchievementId, AvatarConfig, GameState, Locale, MascotId } from '../domain/types';
import { detectLocale } from '../i18n/translate';
import { LocalStorageProgressRepository } from '../persistence/localStorageRepository';
import type { LoadSource, ProgressRepository } from '../persistence/ProgressRepository';
import { browserStorageService } from '../persistence/storageService';

/**
 * Dono do estado do jogo.
 *
 * Concentra tres responsabilidades que nao devem vazar para as telas:
 *  - manter o `GameState` em memoria;
 *  - aplicar as regras de dominio (que sao puras e vivem em `src/domain`);
 *  - salvar no repositorio com debounce.
 *
 * O repositorio e injetavel: trocar localStorage por API nao toca nas telas.
 */

const AUTOSAVE_DELAY_MS = 400;

export interface MissionCompletion {
  islandCompleted: boolean;
  unlockedTable: number | null;
  newAchievements: AchievementId[];
}

interface GameContextValue {
  state: GameState;
  ready: boolean;
  loadSource: LoadSource | null;
  /** Falso quando o navegador bloqueia o armazenamento local. */
  storageAvailable: boolean;
  setLocale: (locale: Locale) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  completeOnboarding: (avatar: AvatarConfig, mascotId: MascotId) => void;
  updateAvatar: (avatar: AvatarConfig, mascotId: MascotId) => void;
  markTutorialSeen: () => void;
  selectTable: (table: number) => void;
  recordAnswer: (factKey: string, wasCorrect: boolean) => void;
  finishMission: (result: MissionResult) => MissionCompletion;
  resetProgress: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export interface GameProviderProps {
  children: ReactNode;
  /** Permite injetar outro repositorio (testes, futura API). */
  repository?: ProgressRepository;
}

export function GameProvider({ children, repository }: GameProviderProps) {
  const initialLocale = useMemo(() => detectLocale(), []);

  const repositoryRef = useRef<ProgressRepository>(
    repository ?? new LocalStorageProgressRepository({ fallbackLocale: initialLocale }),
  );

  const [state, setState] = useState<GameState>(() => createDefaultState(initialLocale));
  const [ready, setReady] = useState(false);
  const [loadSource, setLoadSource] = useState<LoadSource | null>(null);

  // Espelho sincrono do estado: algumas acoes precisam calcular o resultado
  // e devolve-lo na mesma hora (a tela de resultado depende disso).
  const stateRef = useRef(state);
  const applyState = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const update = useCallback(
    (mutate: (current: GameState) => GameState) => {
      applyState(mutate(stateRef.current));
    },
    [applyState],
  );

  // Carrega o progresso salvo uma unica vez, na abertura.
  useEffect(() => {
    let cancelled = false;
    void repositoryRef.current.load().then((outcome) => {
      if (cancelled) {
        return;
      }
      applyState({
        ...outcome.state,
        statistics: startSession(outcome.state.statistics),
      });
      setLoadSource(outcome.source);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [applyState]);

  // Autosave com debounce: digitar em configuracoes nao escreve a cada tecla.
  useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = setTimeout(() => {
      void repositoryRef.current.save(state);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, ready]);

  const setLocale = useCallback(
    (locale: Locale) => {
      // Troca de idioma nunca mexe em progresso, personagem ou estatisticas.
      update((current) => ({ ...current, settings: { ...current.settings, locale } }));
    },
    [update],
  );

  const setMusicEnabled = useCallback(
    (musicEnabled: boolean) => {
      update((current) => ({ ...current, settings: { ...current.settings, musicEnabled } }));
    },
    [update],
  );

  const setSoundEffectsEnabled = useCallback(
    (soundEffectsEnabled: boolean) => {
      update((current) => ({
        ...current,
        settings: { ...current.settings, soundEffectsEnabled },
      }));
    },
    [update],
  );

  const setReducedMotion = useCallback(
    (reducedMotion: boolean) => {
      update((current) => ({ ...current, settings: { ...current.settings, reducedMotion } }));
    },
    [update],
  );

  const completeOnboarding = useCallback(
    (avatar: AvatarConfig, mascotId: MascotId) => {
      update((current) => ({
        ...current,
        player: { ...current.player, avatar, mascotId, onboardingCompleted: true },
      }));
    },
    [update],
  );

  const updateAvatar = useCallback(
    (avatar: AvatarConfig, mascotId: MascotId) => {
      update((current) => ({ ...current, player: { ...current.player, avatar, mascotId } }));
    },
    [update],
  );

  const markTutorialSeen = useCallback(() => {
    update((current) =>
      current.player.tutorialSeen
        ? current
        : { ...current, player: { ...current.player, tutorialSeen: true } },
    );
  }, [update]);

  const selectTable = useCallback(
    (table: number) => {
      update((current) => ({ ...current, progress: { ...current.progress, currentTable: table } }));
    },
    [update],
  );

  const recordAnswer = useCallback(
    (factKey: string, wasCorrect: boolean) => {
      update((current) => ({
        ...current,
        statistics: recordAnswerStat(current.statistics, factKey, wasCorrect),
      }));
    },
    [update],
  );

  /**
   * Encerra uma missao: atualiza progresso, reavalia conquistas e devolve o
   * que aconteceu para a tela de resultado mostrar na hora.
   */
  const finishMission = useCallback(
    (result: MissionResult): MissionCompletion => {
      const current = stateRef.current;
      const outcome = applyMissionResult(current.progress, result);
      const withProgress: GameState = { ...current, progress: outcome.progress };
      const { achievements, newlyUnlocked } = evaluateAchievements(withProgress);

      applyState({ ...withProgress, achievements });

      return {
        islandCompleted: outcome.islandCompleted,
        unlockedTable: outcome.unlockedTable,
        newAchievements: newlyUnlocked,
      };
    },
    [applyState],
  );

  const resetProgress = useCallback(() => {
    // O idioma escolhido sobrevive ao reset: e uma preferencia de leitura,
    // nao progresso de jogo.
    const locale = stateRef.current.settings.locale;
    const fresh = createDefaultState(locale);
    applyState(fresh);
    void repositoryRef.current.clear();
  }, [applyState]);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      ready,
      loadSource,
      storageAvailable: browserStorageService.available,
      setLocale,
      setMusicEnabled,
      setSoundEffectsEnabled,
      setReducedMotion,
      completeOnboarding,
      updateAvatar,
      markTutorialSeen,
      selectTable,
      recordAnswer,
      finishMission,
      resetProgress,
    }),
    [
      state,
      ready,
      loadSource,
      setLocale,
      setMusicEnabled,
      setSoundEffectsEnabled,
      setReducedMotion,
      completeOnboarding,
      updateAvatar,
      markTutorialSeen,
      selectTable,
      recordAnswer,
      finishMission,
      resetProgress,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame precisa estar dentro de <GameProvider>');
  }
  return context;
}
