import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import {
  createFactProgress,
  factProgressToCounts,
  factProgressToKnownFacts,
  recordAnswer,
  type FactProgress,
  type FactProgressMap,
} from './pedagogy.logic';

export interface PedagogySlice {
  knownFacts: string[];
  factCounts: Record<string, number>;
  factProgress: FactProgressMap;
  learningStep: number;
  lastFactKey: string | null;

  recordFactAnswer: (key: string, correct: boolean) => void;
  resetPedagogy: () => void;
}

const INITIAL_PEDAGOGY: Pick<
  PedagogySlice,
  'knownFacts' | 'factCounts' | 'factProgress' | 'learningStep' | 'lastFactKey'
> = {
  knownFacts: [],
  factCounts: {},
  factProgress: {} as FactProgressMap,
  learningStep: 0,
  lastFactKey: null,
};

export const createPedagogySlice: StateCreator<GameState, [], [], PedagogySlice> = (set) => ({
  ...INITIAL_PEDAGOGY,

  recordFactAnswer: (key, correct) =>
    set((state) => {
      const at = state.learningStep + 1;
      const current: FactProgress = state.factProgress[key] ?? createFactProgress(key);
      const progress: FactProgressMap = { ...state.factProgress, [key]: recordAnswer(current, correct, at) };

      return {
        ...syncedLegacyState(progress),
        learningStep: at,
        lastFactKey: key,
      };
    }),

  resetPedagogy: () => set({ ...INITIAL_PEDAGOGY }),
});

function syncedLegacyState(progress: FactProgressMap) {
  return {
    knownFacts: factProgressToKnownFacts(progress),
    factCounts: factProgressToCounts(progress),
    factProgress: progress,
  };
}
