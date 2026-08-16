import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import type { DayPhase } from './daynight.logic';

/** Amostra do relogio publicada para o HUD. */
export interface ClockSample {
  phase: DayPhase;
  /** Numero do dia, comecando em 1. */
  day: number;
  /** Segundos ate a proxima fase. */
  secondsToNextPhase: number;
}

export interface DayNightSlice {
  clock: ClockSample;
  publishClock: (sample: ClockSample) => void;
  resetClock: () => void;
}

const INITIAL: ClockSample = { phase: 'dia', day: 1, secondsToNextPhase: 0 };

export const createDayNightSlice: StateCreator<GameState, [], [], DayNightSlice> = (set) => ({
  clock: INITIAL,

  publishClock: (sample) =>
    set((state) => {
      // O contador regressivo e exibido em segundos inteiros; sem esta guarda o
      // store notificaria os assinantes a cada amostra, mesmo sem mudanca
      // visivel no HUD.
      const current = state.clock;
      if (
        current.phase === sample.phase &&
        current.day === sample.day &&
        Math.ceil(current.secondsToNextPhase) === Math.ceil(sample.secondsToNextPhase)
      ) {
        return state;
      }
      return { clock: sample };
    }),

  resetClock: () => set({ clock: INITIAL }),
});
