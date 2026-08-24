import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { eventForDay, gardenPlantedDay, harvestMultiplier } from '../daily/daily.logic';
import { blocksHome } from '../home/home.logic';
import { fitsOnLand, regionAt } from '../regions/regions.logic';
import { playerTransform } from '../player/playerTransform';
import { distanceSqXZ, vec3 } from '../../shared/vec';
import {
  GARDEN,
  gardenPlantingPosition,
  gardenStatus,
  initialGardenState,
  type GardenPlot,
  type GardenState,
} from './garden.logic';

let nextGardenPlotId = 0;

export interface GardenSlice {
  garden: GardenState;
  nearbyGardenId: string | null;
  setNearbyGarden: (id: string | null) => void;
  plantGarden: () => void;
  plantGardenAtPlayer: () => void;
  harvestGarden: () => void;
  resetGarden: () => void;
}

function nextId(garden: GardenState): string {
  nextGardenPlotId += 1;
  const used = new Set(garden.map((plot) => plot.id));
  while (used.has(`canteiro-${nextGardenPlotId}`)) nextGardenPlotId += 1;
  return `canteiro-${nextGardenPlotId}`;
}

function canPlaceGarden(state: GameState, position: GardenPlot['position']): boolean {
  const spacingSq = GARDEN.spacing * GARDEN.spacing;
  return (
    fitsOnLand(position, GARDEN.bedMargin) &&
    !blocksHome(position) &&
    !state.garden.some((plot) => distanceSqXZ(plot.position, position) < spacingSq) &&
    !state.nodes.some((node) => distanceSqXZ(node.position, position) < spacingSq) &&
    !state.structures.some((structure) => distanceSqXZ(structure.position, position) < spacingSq)
  );
}

function plantedPlot(plot: GardenPlot, day: number): GardenPlot {
  return {
    ...plot,
    planted: true,
    plantedDay: gardenPlantedDay(eventForDay(day).kind, day),
  };
}

export const createGardenSlice: StateCreator<GameState, [], [], GardenSlice> = (set, get) => ({
  garden: initialGardenState(),
  nearbyGardenId: null,

  setNearbyGarden: (id) =>
    set((state) => (state.nearbyGardenId === id ? state : { nearbyGardenId: id })),

  plantGarden: () => {
    const state = get();
    const plot = state.garden.find((candidate) => candidate.id === state.nearbyGardenId);
    if (!plot || plot.planted || state.seeds <= 0) return;

    set({
      seeds: state.seeds - 1,
      garden: state.garden.map((candidate) =>
        candidate.id === plot.id ? plantedPlot(candidate, state.clock.day) : candidate,
      ),
    });
  },

  plantGardenAtPlayer: () => {
    const state = get();
    if (state.seeds <= 0) return;
    const position = gardenPlantingPosition(playerTransform, playerTransform.yaw);
    if (!canPlaceGarden(state, position)) return;

    const region = regionAt(position);
    if (!region) return;

    const plot: GardenPlot = {
      id: nextId(state.garden),
      position: vec3(position.x, position.y, position.z),
      planted: true,
      plantedDay: gardenPlantedDay(eventForDay(state.clock.day).kind, state.clock.day),
      crop: region.harvest[0],
      table: region.tables[0],
    };

    set({ seeds: state.seeds - 1, garden: [...state.garden, plot] });
  },

  harvestGarden: () => {
    const state = get();
    const plot = state.garden.find((candidate) => candidate.id === state.nearbyGardenId);
    if (!plot || gardenStatus(plot, state.clock.day) !== 'ready') return;

    const amount = GARDEN.yield * harvestMultiplier(eventForDay(state.clock.day).kind);
    set({
      inventory: { ...state.inventory, [plot.crop]: state.inventory[plot.crop] + amount },
      garden: state.garden.map((candidate) =>
        candidate.id === plot.id ? { ...candidate, planted: false, plantedDay: 0 } : candidate,
      ),
    });
  },

  resetGarden: () => {
    nextGardenPlotId = 0;
    set({ garden: initialGardenState(), nearbyGardenId: null });
  },
});
