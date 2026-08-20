import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { eventForDay, gardenPlantedDay } from '../daily/daily.logic';
import { GARDEN, gardenStatus, type GardenState } from './garden.logic';

export interface GardenSlice {
  garden: GardenState;
  /** A horta esta ao alcance? */
  nearbyGarden: boolean;
  setNearbyGarden: (perto: boolean) => void;
  /** Planta uma semente. Sem semente ou ja plantada, nao faz nada. */
  plantGarden: () => void;
  /** Colhe a horta madura. So funciona no dia seguinte ao plantio. */
  harvestGarden: () => void;
  resetGarden: () => void;
}

export const createGardenSlice: StateCreator<GameState, [], [], GardenSlice> = (set, get) => ({
  garden: { planted: false, plantedDay: 0 },
  nearbyGarden: false,

  setNearbyGarden: (perto) =>
    set((state) => (state.nearbyGarden === perto ? state : { nearbyGarden: perto })),

  plantGarden: () => {
    const state = get();
    if (state.seeds <= 0 || state.garden.planted) return;

    set({
      seeds: state.seeds - 1,
      garden: {
        planted: true,
        // Dia de chuva: a horta já amanhece regada e rende no mesmo dia.
        plantedDay: gardenPlantedDay(eventForDay(state.clock.day).kind, state.clock.day),
      },
    });
  },

  harvestGarden: () => {
    const state = get();
    if (gardenStatus(state.garden, state.clock.day) !== 'ready') return;

    set({
      inventory: { ...state.inventory, fruta: state.inventory.fruta + GARDEN.yield },
      garden: { planted: false, plantedDay: 0 },
    });
  },

  resetGarden: () =>
    set({
      garden: { planted: false, plantedDay: 0 },
      nearbyGarden: false,
    }),
});
