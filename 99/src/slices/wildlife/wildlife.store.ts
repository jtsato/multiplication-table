import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { createRng } from '../../shared/rng';
import { DEFAULT_WORLD_SEED } from '../world/world.store';
import {
  ANIMAL_FOOD,
  createAnimals,
  emptyAnimalBook,
  feedCost,
  type Animal,
  type AnimalBookEntry,
  type AnimalKind,
} from './wildlife.logic';

export interface WildlifeSlice {
  /** Animais do mundo, com posicoes deterministas pela semente. */
  animals: Animal[];
  /** Caderneta: quem ja foi visto e quem ja virou amigo. Persistido. */
  animalBook: AnimalBookEntry[];
  /** Animal ao alcance agora, publicado pela view. */
  nearbyAnimalId: string | null;
  setNearbyAnimal: (id: string | null) => void;
  /** Registra "visto" na caderneta. Idempotente. */
  markSeen: (kind: AnimalKind) => void;
  /**
   * Alimenta o animal: debita a comida e registra amizade.
   *
   * Quem chama e a slice de matematica, no acerto do desafio de `alimentar`.
   * No erro nada e debitado — a crianca ve a resposta certa e tenta de novo.
   */
  feedAnimal: (animalId: string) => void;
  resetWildlife: () => void;
}

const SEMENTE_ANIMAIS = DEFAULT_WORLD_SEED ^ 0x5eed;

export const createWildlifeSlice: StateCreator<GameState, [], [], WildlifeSlice> = (set, get) => ({
  animals: createAnimals(createRng(SEMENTE_ANIMAIS)),
  animalBook: emptyAnimalBook(),
  nearbyAnimalId: null,

  setNearbyAnimal: (id) =>
    set((state) => (state.nearbyAnimalId === id ? state : { nearbyAnimalId: id })),

  markSeen: (kind) =>
    set((state) => {
      const jaVisto = state.animalBook.find((entry) => entry.kind === kind)?.seen;
      if (jaVisto) return state;
      return {
        animalBook: state.animalBook.map((entry) =>
          entry.kind === kind ? { ...entry, seen: true } : entry,
        ),
      };
    }),

  feedAnimal: (animalId) => {
    const state = get();
    const animal = state.animals.find((candidate) => candidate.id === animalId);
    if (!animal) return;

    const custo = feedCost(animal);
    const comida = ANIMAL_FOOD[animal.kind];
    if (state.inventory[comida] < custo) return;

    set({
      inventory: { ...state.inventory, [comida]: state.inventory[comida] - custo },
      animalBook: state.animalBook.map((entry) =>
        entry.kind === animal.kind ? { ...entry, seen: true, friend: true } : entry,
      ),
    });
  },

  resetWildlife: () =>
    set({
      animals: createAnimals(createRng(SEMENTE_ANIMAIS)),
      animalBook: emptyAnimalBook(),
      nearbyAnimalId: null,
    }),
});
