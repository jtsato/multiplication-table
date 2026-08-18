import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { payCost } from '../building/building.logic';
import {
  SHOP_ITEMS,
  checkPurchase,
  coinsFor,
  factKey,
  type PurchaseRejection,
  type ShopItemKind,
} from './economy.logic';

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
  /** Melhorias permanentes ja compradas. */
  owned: ShopItemKind[];
  /** Dicas em estoque. Consumivel, entao acumula. */
  hints: number;
  /** Ultima recusa de compra, exibida na loja. */
  purchaseError: PurchaseRejection | null;
  shopOpen: boolean;
  toggleShop: () => void;
  closeShop: () => void;
  /** Compra um item. Recusa vira `purchaseError`. */
  buy: (kind: ShopItemKind) => void;
  /** Gasta uma dica. Devolve `false` se nao havia nenhuma. */
  useHint: () => boolean;
  /** Zera so os contadores do dia. Moedas e fatos atravessam. */
  resetDaily: () => void;
  resetEconomy: () => void;
}

const DIA_ZERADO = { correctToday: 0, coinsToday: 0, newFactsToday: [] as string[] };

export const createEconomySlice: StateCreator<GameState, [], [], EconomySlice> = (set, get) => ({
  coins: 0,
  streak: 0,
  knownFacts: [],
  owned: [],
  hints: 0,
  purchaseError: null,
  shopOpen: false,
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

  toggleShop: () =>
    set((state) => {
      // O desafio tem prioridade: dois paineis modais ao mesmo tempo
      // confundiriam a crianca, e a conta ja esta aberta na tela.
      if (state.activeChallenge) return state;
      return { shopOpen: !state.shopOpen, purchaseError: null };
    }),

  closeShop: () => set((state) => (state.shopOpen ? { shopOpen: false } : state)),

  buy: (kind) => {
    const state = get();
    const item = SHOP_ITEMS[kind];
    const check = checkPurchase(item, state.coins, state.inventory, state.owned);

    if (!check.ok) {
      set({ purchaseError: check.reason });
      return;
    }

    set({
      coins: state.coins - item.coins,
      // `payCost` ja recusa pagamento parcial e e a mesma funcao que a
      // construcao usa — o debito de recurso e um so no jogo inteiro.
      inventory: payCost(state.inventory, item.recipe),
      owned: item.repeatable ? state.owned : [...state.owned, kind],
      hints: kind === 'dica' ? state.hints + 1 : state.hints,
      purchaseError: null,
    });
  },

  useHint: () => {
    if (get().hints <= 0) return false;
    set((state) => ({ hints: state.hints - 1 }));
    return true;
  },

  resetDaily: () => set(DIA_ZERADO),

  resetEconomy: () =>
    set({
      coins: 0,
      streak: 0,
      knownFacts: [],
      owned: [],
      hints: 0,
      purchaseError: null,
      shopOpen: false,
      ...DIA_ZERADO,
    }),
});
