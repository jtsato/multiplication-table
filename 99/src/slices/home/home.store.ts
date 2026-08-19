import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { PHASE_BOUNDS, DAYNIGHT } from '../daynight/daynight.logic';
import { dayNightClock } from '../daynight/dayNightClock';
import { secondsUntilNextDawn, type HomeSpot } from './home.logic';

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
  /** Abre o mural de qualquer lugar — usado pelo professor NPC. */
  openChartFromNpc: () => void;
  closeSpot: () => void;
  /**
   * Dormir: adianta o relogio ate o proximo amanhecer.
   *
   * Existe mesmo com a noite curta sendo desejavel. Um porto seguro onde a
   * crianca nao pode decidir quando o dia acaba nao e dela.
   */
  sleep: () => void;
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

  openChartFromNpc: () => {
    // O professor nao depende de estar perto do mural: a tabuada e de graca
    // em qualquer lugar do mundo, como a spec manda.
    if (get().activeChallenge) return;
    set({ openSpot: 'mural', shopOpen: false });
  },

  closeSpot: () => set((state) => (state.openSpot ? { openSpot: null } : state)),

  sleep: () => {
    if (get().openSpot !== 'cama') return;
    dayNightClock.seconds += secondsUntilNextDawn(
      dayNightClock.seconds,
      DAYNIGHT.cycleSeconds,
      PHASE_BOUNDS.amanhecer.start,
    );
    // Fecha a cama primeiro: o resumo do dia assume a tela em seguida, e o
    // `DayNightView` o abre na virada de fase que acabou de acontecer.
    set({ openSpot: null });
  },
});
