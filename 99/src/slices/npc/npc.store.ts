import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import type { RegionId } from '../regions/regions.logic';
import { createOrders, orderQuantity, type Order } from './npc.logic';

export interface NpcSlice {
  /** Encomendas do dia, uma por regiao. */
  orders: Order[];
  /** Encomenda ao alcance agora, publicada pela view. */
  nearbyOrderId: string | null;
  /** A comerciante esta ao alcance? */
  nearbyMerchant: boolean;
  /** Regiao do professor ao alcance, ou `null`. */
  nearbyTeacherRegion: RegionId | null;
  setNearbyOrder: (id: string | null) => void;
  setNearbyMerchant: (perto: boolean) => void;
  setNearbyTeacherRegion: (region: RegionId | null) => void;
  /**
   * Entrega a encomenda: debita a quantidade da mochila e paga as moedas.
   * Quem chama e a slice de matematica, no acerto do desafio de `encomenda`.
   */
  completeOrder: (orderId: string) => void;
  resetNpc: () => void;
}

export const createNpcSlice: StateCreator<GameState, [], [], NpcSlice> = (set, get) => ({
  orders: createOrders(1),
  nearbyOrderId: null,
  nearbyMerchant: false,
  nearbyTeacherRegion: null,

  setNearbyOrder: (id) =>
    set((state) => (state.nearbyOrderId === id ? state : { nearbyOrderId: id })),

  setNearbyMerchant: (perto) =>
    set((state) => (state.nearbyMerchant === perto ? state : { nearbyMerchant: perto })),

  setNearbyTeacherRegion: (region) =>
    set((state) =>
      state.nearbyTeacherRegion === region ? state : { nearbyTeacherRegion: region },
    ),

  completeOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((candidate) => candidate.id === orderId);
    if (!order) return;

    const quantidade = orderQuantity(order);
    if (state.inventory[order.kind] < quantidade) return;

    set({
      inventory: { ...state.inventory, [order.kind]: state.inventory[order.kind] - quantidade },
    });
    state.addCoins(order.rewardCoins);
  },

  resetNpc: () =>
    set({
      orders: createOrders(1),
      nearbyOrderId: null,
      nearbyMerchant: false,
      nearbyTeacherRegion: null,
    }),
});
