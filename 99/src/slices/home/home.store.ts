import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import type { HomeSpot } from './home.logic';

export interface HomeSlice {
  /** Movel ao alcance agora, publicado pela view. */
  nearbySpot: HomeSpot | null;
  /** O jogador esta dentro das paredes? Publicado pela view. */
  insideHome: boolean;
  /** Painel aberto dentro de casa, ou `null`. */
  openSpot: HomeSpot | null;
  setNearbySpot: (spot: HomeSpot | null) => void;
  setInsideHome: (inside: boolean) => void;
  /** Abre o painel do movel ao alcance. Ignorado longe de tudo. */
  openNearbySpot: () => void;
  closeSpot: () => void;
}

export const createHomeSlice: StateCreator<GameState, [], [], HomeSlice> = (set, get) => ({
  nearbySpot: null,
  insideHome: false,
  openSpot: null,

  // Guardas de igualdade: as duas acoes sao chamadas a 4 Hz pela view, e sem
  // elas o store notificaria os assinantes sem nada ter mudado.
  setNearbySpot: (spot) =>
    set((state) => (state.nearbySpot === spot ? state : { nearbySpot: spot })),

  setInsideHome: (inside) =>
    set((state) => (state.insideHome === inside ? state : { insideHome: inside })),

  openNearbySpot: () => {
    const state = get();
    // O desafio tem prioridade, como na loja: a conta ja esta na tela.
    if (state.activeChallenge || !state.nearbySpot) return;
    set({ openSpot: state.nearbySpot, shopOpen: false });
  },

  closeSpot: () => set((state) => (state.openSpot ? { openSpot: null } : state)),
});
