import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import type { Vec3 } from '../../shared/vec';
import { dayNightClock } from '../daynight/dayNightClock';
import {
  BUILDING,
  STRUCTURES,
  checkPlacement,
  payCost,
  refuelUntil,
  type PlacementRejection,
  type Structure,
  type StructureKind,
} from './building.logic';

export interface BuildingSlice {
  structures: Structure[];
  /** Tipo em construcao, ou `null` fora do modo construcao. */
  buildMode: StructureKind | null;
  /** Ultima recusa, exibida no HUD. */
  buildError: PlacementRejection | null;
  toggleBuildMode: (kind: StructureKind) => void;
  exitBuildMode: () => void;
  /** Tenta construir na posicao dada. Recusa vira `buildError`. */
  placeStructure: (position: Vec3, rotation: number, now: number) => void;
  /** Renova o combustivel da fogueira. `ratio` de 0 a 1 conforme o acerto. */
  refuelStructure: (structureId: string, ratio: number, now?: number) => void;
  clearBuildError: () => void;
  resetBuilding: () => void;
}

let nextStructureId = 0;

export const createBuildingSlice: StateCreator<GameState, [], [], BuildingSlice> = (set, get) => ({
  structures: [],
  buildMode: null,
  buildError: null,

  toggleBuildMode: (kind) =>
    set((state) => ({
      // Apertar a mesma tecla de novo sai do modo — evita ficar preso nele.
      buildMode: state.buildMode === kind ? null : kind,
      buildError: null,
    })),

  exitBuildMode: () => set({ buildMode: null, buildError: null }),

  placeStructure: (position, rotation, now) => {
    const state = get();
    const kind = state.buildMode;
    if (!kind) return;

    const spec = STRUCTURES[kind];
    const check = checkPlacement(
      spec,
      position,
      state.inventory,
      state.structures,
      state.nodes,
      rotation,
    );

    if (!check.ok) {
      set({ buildError: check.reason });
      return;
    }

    nextStructureId += 1;
    set({
      structures: [
        ...state.structures,
        {
          id: `${kind}-${nextStructureId}`,
          kind,
          position,
          rotation,
          // A fogueira ja nasce acesa; a cerca nunca queima.
          fuelUntil: kind === 'fogueira' ? now + BUILDING.fireFuelSeconds : 0,
        },
      ],
      inventory: payCost(state.inventory, spec.recipe),
      buildError: null,
      // Sai do modo apos construir: continuar nele levaria a construir varias
      // por engano com a mesma tecla.
      buildMode: null,
    });
  },

  refuelStructure: (structureId, ratio, now = dayNightClock.seconds) =>
    set((state) => ({
      structures: state.structures.map((structure) =>
        structure.id === structureId && structure.kind === 'fogueira'
          ? { ...structure, fuelUntil: refuelUntil(structure, now, ratio) }
          : structure,
      ),
    })),

  clearBuildError: () => set({ buildError: null }),

  resetBuilding: () => set({ structures: [], buildMode: null, buildError: null }),
});
