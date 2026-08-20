import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import type { Vec3 } from '../../shared/vec';
import { dayNightClock } from '../daynight/dayNightClock';
import {
  BUILDING,
  STRUCTURES,
  checkPlacement,
  constructionTarget,
  payCost,
  refuelUntil,
  type PlacementRejection,
  type Structure,
  type StructureKind,
} from './building.logic';

/** Construção aguardando a conta que a ergue. */
export interface PendingBuild {
  kind: StructureKind;
  position: Vec3;
  rotation: number;
}

export interface BuildingSlice {
  structures: Structure[];
  /** Tipo em construcao, ou `null` fora do modo construcao. */
  buildMode: StructureKind | null;
  /** Ultima recusa, exibida no HUD. */
  buildError: PlacementRejection | null;
  /** Construção validada esperando o acerto da tabuada. */
  pendingBuild: PendingBuild | null;
  toggleBuildMode: (kind: StructureKind) => void;
  exitBuildMode: () => void;
  /** Tenta construir na posicao dada. Recusa vira `buildError`. */
  placeStructure: (position: Vec3, rotation: number, now: number) => void;
  /** Valida a posição e abre o desafio de construção. */
  requestBuild: (position: Vec3, rotation: number) => void;
  /** Ergue a construção pendente quando a conta é acertada. */
  completePendingBuild: () => void;
  cancelPendingBuild: () => void;
  /** Renova o combustivel da fogueira. `ratio` de 0 a 1 conforme o acerto. */
  refuelStructure: (structureId: string, ratio: number, now?: number) => void;
  clearBuildError: () => void;
  resetBuilding: () => void;
  /** Restaura estruturas vindas do save e ajusta o contador de ids. */
  loadStructures: (structures: Structure[]) => void;
}

let nextStructureId = 0;

export const createBuildingSlice: StateCreator<GameState, [], [], BuildingSlice> = (set, get) => ({
  structures: [],
  buildMode: null,
  buildError: null,
  pendingBuild: null,

  toggleBuildMode: (kind) =>
    set((state) => ({
      // Apertar a mesma tecla de novo sai do modo — evita ficar preso nele.
      buildMode: state.buildMode === kind ? null : kind,
      buildError: null,
      pendingBuild: null,
    })),

  exitBuildMode: () => set({ buildMode: null, buildError: null, pendingBuild: null }),

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

  requestBuild: (position, rotation) => {
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

    // "Construção instantânea" (configurações) pula o desafio para quem já
    // domina a tabuada. Os recursos são debitados direto, sem conta na tela.
    if (get().instantBuild) {
      get().placeStructure(position, rotation, dayNightClock.seconds);
      return;
    }

    // A construção só sai do papel com uma conta certa. Os recursos ainda não
    // foram gastos: errar não cobra nada além da tentativa.
    set({ pendingBuild: { kind, position, rotation }, buildError: null });
    get().startChallenge(constructionTarget(kind), 'construir');
  },

  completePendingBuild: () => {
    const pending = get().pendingBuild;
    if (!pending) return;
    get().placeStructure(pending.position, pending.rotation, dayNightClock.seconds);
    set({ pendingBuild: null });
  },

  cancelPendingBuild: () => set({ pendingBuild: null }),

  refuelStructure: (structureId, ratio, now = dayNightClock.seconds) =>
    set((state) => ({
      structures: state.structures.map((structure) =>
        structure.id === structureId && structure.kind === 'fogueira'
          ? { ...structure, fuelUntil: refuelUntil(structure, now, ratio) }
          : structure,
      ),
    })),

  clearBuildError: () => set({ buildError: null }),

  resetBuilding: () => set({ structures: [], buildMode: null, buildError: null, pendingBuild: null }),

  loadStructures: (structures) => {
    // O contador de ids vive fora do store; sem este ajuste, construir depois de
    // um reload geraria um id repetido (fogueira-1 de novo) e a fogueira nova
    // brigaria com a antiga no mesmo array.
    nextStructureId = structures.reduce((maior, structure) => {
      const sufixo = Number(structure.id.split('-').pop() ?? 0);
      return Number.isFinite(sufixo) ? Math.max(maior, sufixo) : maior;
    }, 0);
    set({ structures, buildMode: null, buildError: null, pendingBuild: null });
  },
});
