import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { createRng } from '../../shared/rng';
import { distanceSqXZ } from '../../shared/vec';
import { playerTransform } from '../player/playerTransform';
import { DEFAULT_WORLD_SEED } from '../world/world.store';
import { fitsOnLand, regionAt } from '../regions/regions.logic';
import { GARDEN } from '../garden/garden.logic';
import { blocksHome } from '../home/home.logic';
import {
  addToInventory,
  createNodes,
  emptyInventory,
  startingInventory,
  plantedResourceKind,
  plantingPosition,
  type Inventory,
  type PlantingKind,
  type ResourceNode,
} from './resources.logic';

let nextPlantedNodeId = 0;

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
  plantResource: (kind: PlantingKind) => void;
  refreshPlantedNodes: (day: number) => void;
  loadResourceState: (depletedNodeIds: readonly string[], plantedNodes?: readonly ResourceNode[]) => void;
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
         nodes: state.nodes.map((node) =>
           node.id === nodeId
             ? node.planted
               ? { ...node, depleted: true, lastHarvestDay: state.clock.day }
               : { ...node, depleted: true }
             : node,
         ),
         inventory: addToInventory(state.inventory, target.kind, amount),
         highlightedNodeId: state.highlightedNodeId === nodeId ? null : state.highlightedNodeId,
       };
     }),

  plantResource: (kind) =>
    set((state) => {
      if (state.seeds <= 0) return state;
      const position = plantingPosition(playerTransform, playerTransform.yaw);
      const gardenSpacingSq = GARDEN.spacing * GARDEN.spacing;
      if (
        !fitsOnLand(position, 1.2) ||
        blocksHome(position) ||
        state.nodes.some((node) => distanceSqXZ(node.position, position) < 16) ||
        state.garden.some((plot) => distanceSqXZ(plot.position, position) < gardenSpacingSq) ||
        state.structures.some((structure) => distanceSqXZ(structure.position, position) < gardenSpacingSq)
      ) {
        return state;
      }
      const region = regionAt(position);
      const perGroup = region?.tables[0] ?? 2;
      nextPlantedNodeId += 1;
      return {
        seeds: state.seeds - 1,
        nodes: [
          ...state.nodes,
          {
            id: `planta-${nextPlantedNodeId}`,
            kind: plantedResourceKind(kind),
            position,
            groups: 1,
            perGroup,
            depleted: false,
            planted: true,
          },
        ],
      };
    }),

  refreshPlantedNodes: (day) =>
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.planted && node.depleted && (node.lastHarvestDay ?? day) < day
          ? { ...node, depleted: false }
          : node,
      );
      return nodes.some((node, index) => node !== state.nodes[index]) ? { nodes } : state;
    }),

  loadResourceState: (depletedNodeIds, plantedNodes = []) => {
    nextPlantedNodeId = plantedNodes.reduce((highest, node) => {
      const suffix = Number(node.id.replace('planta-', ''));
      return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
    }, 0);
    const depleted = new Set(depletedNodeIds);
    set((state) => ({
      nodes: [
        ...state.nodes.filter((node) => !node.planted).map((node) => ({ ...node, depleted: depleted.has(node.id) })),
        ...plantedNodes,
      ],
      highlightedNodeId: null,
    }));
  },

  resetResources: () =>
    set({
      nodes: createNodes(createRng(DEFAULT_WORLD_SEED)),
  inventory: startingInventory(),
      highlightedNodeId: null,
    }),
});
