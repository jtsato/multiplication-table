import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { evaluateAchievements } from '../domain/achievements';
import { createDefaultGameState } from '../domain/defaultState';
import { recordAnswer } from '../domain/mastery';
import { completeIsland } from '../domain/progression';
import type {
  GameSettings,
  GameState,
  PlayerProfile,
  Question,
  TableNumber,
} from '../domain/types';
import { LocalStorageProgressRepository } from '../services/localStorageProgressRepository';
import type { ProgressRepository } from '../services/progressRepository';

interface GameContextValue {
  state: GameState;
  loading: boolean;
  createPlayer(profile: PlayerProfile): Promise<GameState>;
  updateSettings(settings: Partial<GameSettings>): Promise<GameState>;
  startSession(table: TableNumber, question: Question): Promise<GameState>;
  saveMissionProgress(
    table: TableNumber,
    completedSteps: number,
    correct: number,
    incorrect: number,
    currentQuestion: Question,
  ): Promise<GameState>;
  answer(table: TableNumber, factor: number, correct: boolean): Promise<GameState>;
  finishIsland(table: TableNumber, correct: number, incorrect: number): Promise<GameState>;
  resetProgress(): Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

const browserRepository = (): ProgressRepository =>
  new LocalStorageProgressRepository(window.localStorage);

export function GameProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: ProgressRepository;
}) {
  const [resolvedRepository] = useState(() => repository ?? browserRepository());
  const [state, setState] = useState(createDefaultGameState);
  const stateRef = useRef(state);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    resolvedRepository
      .load()
      .then((loaded) => {
        if (active) {
          stateRef.current = loaded;
          setState(loaded);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resolvedRepository]);

  const commit = useCallback(
    async (recipe: (current: GameState) => GameState): Promise<GameState> => {
      const next = recipe(stateRef.current);
      stateRef.current = next;
      setState(next);
      try {
        await resolvedRepository.save(next);
      } catch {
        // The in-memory game remains playable if local persistence is unavailable.
      }
      return next;
    },
    [resolvedRepository],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      loading,
      createPlayer: (profile) => commit((current) => ({ ...current, player: profile })),
      updateSettings: (settings) =>
        commit((current) => ({ ...current, settings: { ...current.settings, ...settings } })),
      startSession: (table, question) =>
        commit((current) => {
          if (current.progress.activeMission?.table === table) return current;
          return {
            ...current,
            progress: {
              ...current.progress,
              lastPlayedTable: table,
              activeMission: {
                table,
                completedSteps: 0,
                correct: 0,
                incorrect: 0,
                currentQuestion: question,
                feedback: null,
              },
              tables: {
                ...current.progress.tables,
                [String(table)]: {
                  ...current.progress.tables[String(table)],
                  status:
                    current.progress.tables[String(table)].status === 'completed'
                      ? 'completed'
                      : 'inProgress',
                },
              },
            },
            statistics: {
              ...current.statistics,
              playSessions: current.statistics.playSessions + 1,
            },
          };
        }),
      saveMissionProgress: (table, completedSteps, correct, incorrect, currentQuestion) =>
        commit((current) => ({
          ...current,
          progress: {
            ...current.progress,
            activeMission: {
              table,
              completedSteps,
              correct,
              incorrect,
              currentQuestion,
              feedback: null,
            },
          },
        })),
      answer: (table, factor, correct) =>
        commit((current) => {
          const answered = evaluateAchievements(recordAnswer(current, table, factor, correct));
          const active = answered.progress.activeMission;
          if (!active) return answered;
          return {
            ...answered,
            progress: {
              ...answered.progress,
              activeMission: {
                ...active,
                correct: active.correct + (correct ? 1 : 0),
                incorrect: active.incorrect + (correct ? 0 : 1),
                feedback: correct ? 'correct' : 'incorrect',
              },
            },
          };
        }),
      finishIsland: (table, correct, incorrect) =>
        commit((current) =>
          evaluateAchievements(completeIsland(current, table, correct, incorrect)),
        ),
      resetProgress: async () => {
        try {
          await resolvedRepository.reset();
        } catch {
          // Reset the active session even when persistent storage is unavailable.
        }
        const initial = createDefaultGameState();
        stateRef.current = initial;
        setState(initial);
      },
    }),
    [commit, loading, resolvedRepository, state],
  );

  return <GameContext value={value}>{children}</GameContext>;
}

export function useGame(): GameContextValue {
  const context = use(GameContext);
  if (!context) throw new Error('useGame must be used inside GameProvider');
  return context;
}
