import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import type { AnimalKind } from '../wildlife/wildlife.logic';

export interface CompanionSlice {
  /** O animal que acompanha a crianca, ou `null` se ainda nao escolheu. */
  pet: AnimalKind | null;
  setPet: (kind: AnimalKind | null) => void;
  resetCompanion: () => void;
}

export const createCompanionSlice: StateCreator<GameState, [], [], CompanionSlice> = (set) => ({
  pet: null,

  setPet: (kind) => set({ pet: kind }),

  resetCompanion: () => set({ pet: null }),
});
