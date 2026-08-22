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
  coins: number;
  streak: number;
  correctToday: number;
  coinsToday: number;
  newFactsToday: string[];
  rewardCorrect: (perGroup: number, groups: number) => void;
  breakStreak: (key?: string) => void;
  owned: ShopItemKind[];
  hints: number;
  seeds: number;
  purchaseError: PurchaseRejection | null;
  shopOpen: boolean;
  lastSummaryDay: number;
  toggleShop: () => void;
  closeShop: () => void;
  buy: (kind: ShopItemKind) => void;
  addCoins: (amount: number) => void;
  useHint: () => boolean;
  summaryOpen: boolean;
  openSummary: (day: number) => void;
  closeSummary: () => void;
  resetDaily: () => void;
  resetEconomy: () => void;
}

const DIA_ZERADO = { correctToday: 0, coinsToday: 0, newFactsToday: [] as string[] };

export const createEconomySlice: StateCreator<GameState, [], [], EconomySlice> = (set, get) => ({
  coins: 0,
  streak: 0,
  owned: [],
  hints: 0,
  seeds: 0,
  purchaseError: null,
  shopOpen: false,
  summaryOpen: false,
  lastSummaryDay: 0,
  ...DIA_ZERADO,

  rewardCorrect: (perGroup, groups) => {
    const key = factKey(perGroup, groups);
    const factIsNew = !get().knownFacts.includes(key);
    get().recordFactAnswer(key, true);
    const streak = get().streak + 1;
    const coins = coinsFor({ perGroup, streak, factIsNew });

    set((state) => ({
      coins: state.coins + coins,
      streak,
      correctToday: state.correctToday + 1,
      coinsToday: state.coinsToday + coins,
      newFactsToday: factIsNew ? [...state.newFactsToday, key] : state.newFactsToday,
    }));
  },

  breakStreak: (key) => {
    if (key) get().recordFactAnswer(key, false);
    set((state) => (state.streak === 0 ? state : { streak: 0 }));
  },

  toggleShop: () =>
    set((state) => {
      if (state.activeChallenge) return state;
      return { shopOpen: !state.shopOpen, purchaseError: null };
    }),

  closeShop: () => set((state) => (state.shopOpen ? { shopOpen: false } : state)),

  openSummary: (day) =>
    set((state) => {
      if (state.lastSummaryDay >= day) return state;
      return { summaryOpen: true, lastSummaryDay: day, shopOpen: false };
    }),

  closeSummary: () =>
    set((state) => (state.summaryOpen ? { summaryOpen: false, ...DIA_ZERADO } : state)),

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
      inventory: payCost(state.inventory, item.recipe),
      owned: item.repeatable ? state.owned : [...state.owned, kind],
      hints: kind === 'dica' ? state.hints + 1 : state.hints,
      seeds: kind === 'sementes' ? state.seeds + 1 : state.seeds,
      purchaseError: null,
    });
  },

  useHint: () => {
    if (get().hints <= 0) return false;
    set((state) => ({ hints: state.hints - 1 }));
    return true;
  },

  addCoins: (amount) =>
    set((state) => ({
      coins: state.coins + Math.max(0, Math.floor(amount)),
      coinsToday: state.coinsToday + Math.max(0, Math.floor(amount)),
    })),

  resetDaily: () => set(DIA_ZERADO),

  resetEconomy: () =>
    set({
      coins: 0,
      streak: 0,
      knownFacts: [],
      factCounts: {},
      factProgress: {},
      learningStep: 0,
      lastFactKey: null,
      owned: [],
      hints: 0,
      seeds: 0,
      purchaseError: null,
      shopOpen: false,
      summaryOpen: false,
      lastSummaryDay: 0,
      ...DIA_ZERADO,
    }),
});
