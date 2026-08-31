import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import type { RegionId } from '../regions/regions.logic';
import { regionById } from '../regions/regions.logic';
import { mentorAdvice, type MentorAdvice } from '../pedagogy/pedagogy.logic';
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
   * Entrega a encomenda: debita a quantidade da mochila, paga as moedas e
   * **tira o pedido da lista**.
   * Quem chama e a slice de matematica, no acerto do desafio de `encomenda`.
   */
  completeOrder: (orderId: string) => void;
  getTeacherAdvice: (regionId: RegionId) => MentorAdvice | null;
  /**
   * Renova as encomendas para o novo dia.
   *
   * Chamado no amanhecer: cada dia traz pedidos diferentes, e um pedido de dia
   * novo pode ter um recurso ou uma quantidade que o anterior não tinha — por isso
   * o NPC mais próximo publicado antes da virada fica inválido.
   */
  advanceOrders: (day: number) => void;
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

    /**
     * O pedido sai da lista assim que e entregue.
     *
     * Sem isto o NPC continuava de pe com a mesma encomenda: cada `E` reabria a
     * *mesma* conta — mesmos fatores, dia inteiro — e pagava de novo as moedas.
     * A regra sempre foi uma encomenda por regiao por dia, e a propria
     * `npcPositionsFor` ja conta com ela: sem pedido na regiao, o NPC de
     * encomendas nao aparece. Entregar e o que fecha o pedido; o amanhecer, em
     * `advanceOrders`, e que traz os proximos.
     *
     * `nearbyOrderId` cai junto, para o HUD nao continuar convidando a entregar
     * o que ja foi entregue no quadro em que a view ainda nao recalculou.
     */
    set({
      inventory: { ...state.inventory, [order.kind]: state.inventory[order.kind] - quantidade },
      orders: state.orders.filter((candidate) => candidate.id !== orderId),
      nearbyOrderId: state.nearbyOrderId === orderId ? null : state.nearbyOrderId,
    });
    state.addCoins(order.rewardCoins);
  },

  getTeacherAdvice: (regionId) => {
    const state = get();
    const region = regionById(regionId);
    if (!region || region.tables.length === 0) return null;
    return mentorAdvice(region.tables, state.factProgress, state.learningStep);
  },

  advanceOrders: (day) =>
    set({
      orders: createOrders(day),
      nearbyOrderId: null,
      nearbyMerchant: false,
      nearbyTeacherRegion: null,
    }),

  resetNpc: () =>
    set({
      orders: createOrders(1),
      nearbyOrderId: null,
      nearbyMerchant: false,
      nearbyTeacherRegion: null,
    }),
});
