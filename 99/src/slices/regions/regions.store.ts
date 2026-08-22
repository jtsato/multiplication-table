import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { payCost } from '../building/building.logic';
import { bridgeById, checkBridge, reachableFrom, type BridgeRejection } from './bridges.logic';
import { REGION_ORDER, type RegionId } from './regions.logic';

/**
 * Onde a crianca esta e para onde ja pode ir.
 *
 * A regiao atual e um valor **publicado**, e nao derivado da posicao a cada
 * quadro: quem sabe a posicao e o `playerTransform`, que vive fora do React de
 * proposito. `RegionsView` le a posicao dentro do `useFrame` e so chama
 * `publishRegion` quando a regiao de fato muda — que e algo que acontece
 * algumas vezes por partida, nao 60 vezes por segundo.
 */
export interface RegionsSlice {
  /** Pontes ja compradas. Persistido. */
  openBridges: string[];
  /** Ultima recusa de compra de ponte, exibida no painel. */
  bridgeError: BridgeRejection | null;
  /** Regiao onde o jogador esta. */
  currentRegion: RegionId;
  /** Ponte ao alcance da mao, ou `null`. */
  nearbyBridge: string | null;

  buyBridge: (id: string) => void;
  clearBridgeError: () => void;
  publishRegion: (id: RegionId) => void;
  setNearbyBridge: (id: string | null) => void;
  resetRegions: () => void;
}

const INICIO = {
  openBridges: [] as string[],
  bridgeError: null as BridgeRejection | null,
  currentRegion: REGION_ORDER[0],
  nearbyBridge: null as string | null,
};

export const createRegionsSlice: StateCreator<GameState, [], [], RegionsSlice> = (set, get) => ({
  ...INICIO,

  buyBridge: (id) => {
    const ponte = bridgeById(id);
    if (!ponte) return;

    const state = get();
    if (state.openBridges.includes(id)) return;

    const check = checkBridge(ponte, state.coins, state.inventory, state.factCounts);
    if (!check.ok) {
      set({ bridgeError: check.reason });
      return;
    }

    set({
      coins: state.coins - ponte.coins,
      // A mesma funcao que a loja e a construcao usam: o debito de recurso e um
      // so no jogo inteiro.
      inventory: payCost(state.inventory, ponte.recipe),
      openBridges: [...state.openBridges, id],
      bridgeError: null,
    });
  },

  clearBridgeError: () =>
    set((state) => (state.bridgeError === null ? state : { bridgeError: null })),

  // Guarda de igualdade: `RegionsView` chama a cada quadro em que ha duvida, e
  // sem isto o store notificaria assinantes 60 vezes por segundo sem novidade.
  publishRegion: (id) =>
    set((state) => (state.currentRegion === id ? state : { currentRegion: id })),

  setNearbyBridge: (id) =>
    set((state) => (state.nearbyBridge === id ? state : { nearbyBridge: id })),

  resetRegions: () => set({ ...INICIO }),
});

/** As regioes que a crianca ja pode pisar, a partir da praia. */
export function unlockedRegions(openBridges: readonly string[]): RegionId[] {
  return reachableFrom(REGION_ORDER[0], openBridges);
}
