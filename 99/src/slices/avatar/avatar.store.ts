import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import {
  DEFAULT_AVATAR,
  FACE_ACCESSORIES,
  HEAD_ACCESSORIES,
  accessoryIsAvailable,
  type AvatarSelection,
} from './avatar.logic';

export interface AvatarSlice {
  avatar: AvatarSelection;
  /** Troca uma parte da aparencia. Acessorio ainda trancado e ignorado. */
  setAvatar: (partial: Partial<AvatarSelection>) => void;
  resetAvatar: () => void;
}

export const createAvatarSlice: StateCreator<GameState, [], [], AvatarSlice> = (set, get) => ({
  avatar: DEFAULT_AVATAR,

  setAvatar: (partial) => {
    const { knownFacts } = get();

    // Guarda no store, e nao so na UI: quem chama direto — um save antigo, um
    // teste — nao deveria conseguir vestir um acessorio nao conquistado.
    if (partial.head && !accessoryIsAvailable(HEAD_ACCESSORIES, partial.head, knownFacts)) return;
    if (partial.face && !accessoryIsAvailable(FACE_ACCESSORIES, partial.face, knownFacts)) return;

    set((state) => ({ avatar: { ...state.avatar, ...partial } }));
  },

  resetAvatar: () => set({ avatar: DEFAULT_AVATAR }),
});
