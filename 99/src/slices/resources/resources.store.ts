import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { createRng } from '../../shared/rng';
import { DEFAULT_WORLD_SEED } from '../world/world.store';
import {
  addToInventory,
  createNodes,
  emptyInventory,
  type Inventory,
  type ResourceNode,
} from './resources.logic';

export interface ResourcesSlice {
  nodes: ResourceNode[];
  inventory: Inventory;
  /**
   * No em destaque sob a mira do jogador. Muda poucas vezes por segundo (so ao
   * entrar e sair do alcance), entao pode viver no store sem custo de render.
   */
  highlightedNodeId: string | null;
  setHighlightedNodeId: (id: string | null) => void;
  /** Marca o no como colhido e credita os itens no inventario. */
  collectNode: (nodeId: string, amount: number) => void;
  /** Devolve o no ao mundo depois do tempo de recuperacao. */
  restoreNode: (nodeId: string) => void;
  resetResources: () => void;
}

export const createResourcesSlice: StateCreator<GameState, [], [], ResourcesSlice> = (set) => ({
  nodes: createNodes(createRng(DEFAULT_WORLD_SEED)),
  inventory: emptyInventory(),
  highlightedNodeId: null,

  setHighlightedNodeId: (id) =>
    set((state) => (state.highlightedNodeId === id ? state : { highlightedNodeId: id })),

  collectNode: (nodeId, amount) =>
    set((state) => {
      const target = state.nodes.find((node) => node.id === nodeId);
      // Ja colhido: ignora em silencio. Dois `E` no mesmo quadro nao podem
      // render recurso em dobro.
      if (!target || target.depleted) return state;

      return {
        nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, depleted: true } : node)),
        inventory: addToInventory(state.inventory, target.kind, amount),
        highlightedNodeId: state.highlightedNodeId === nodeId ? null : state.highlightedNodeId,
      };
    }),

  restoreNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, depleted: false } : node)),
    })),

  resetResources: () =>
    set({
      nodes: createNodes(createRng(DEFAULT_WORLD_SEED)),
      inventory: emptyInventory(),
      highlightedNodeId: null,
    }),
});
