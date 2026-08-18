import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { coinsFor, factKey } from './economy.logic';

export interface EconomySlice {
  /** Total acumulado, atravessa os dias. */
  coins: number;
  /** Acertos seguidos. Zera no erro. */
  streak: number;
  /**
   * Fatos ja resolvidos ao menos uma vez.
   *
   * Guardado como lista, e nao `Set`: este estado vai para o save na Fase 3, e
   * um `Set` nao sobrevive a `JSON.stringify`. E a base do mural da tabuada
   * (Fase 3) e do portao das regioes (Fase 4).
   */
  knownFacts: string[];
  /** Contadores do dia, consumidos pelo resumo do amanhecer. */
  correctToday: number;
  coinsToday: number;
  newFactsToday: string[];
  /** Credita um acerto: moedas, sequencia e fato. Devolve as moedas pagas. */
  rewardCorrect: (perGroup: number, groups: number) => void;
  /** O erro zera a sequencia — e so isso. Errar nao tira nada. */
  breakStreak: () => void;
  /** Zera so os contadores do dia. Moedas e fatos atravessam. */
  resetDaily: () => void;
  resetEconomy: () => void;
}

const DIA_ZERADO = { correctToday: 0, coinsToday: 0, newFactsToday: [] as string[] };

export const createEconomySlice: StateCreator<GameState, [], [], EconomySlice> = (set) => ({
  coins: 0,
  streak: 0,
  knownFacts: [],
  ...DIA_ZERADO,

  rewardCorrect: (perGroup, groups) =>
    set((state) => {
      const key = factKey(perGroup, groups);
      const factIsNew = !state.knownFacts.includes(key);
      const streak = state.streak + 1;
      const coins = coinsFor({ perGroup, streak, factIsNew });

      return {
        coins: state.coins + coins,
        streak,
        knownFacts: factIsNew ? [...state.knownFacts, key] : state.knownFacts,
        correctToday: state.correctToday + 1,
        coinsToday: state.coinsToday + coins,
        newFactsToday: factIsNew ? [...state.newFactsToday, key] : state.newFactsToday,
      };
    }),

  breakStreak: () => set((state) => (state.streak === 0 ? state : { streak: 0 })),

  resetDaily: () => set(DIA_ZERADO),

  resetEconomy: () => set({ coins: 0, streak: 0, knownFacts: [], ...DIA_ZERADO }),
});
