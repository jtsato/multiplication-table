import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { createRng } from '../../shared/rng';
import { vec3 } from '../../shared/vec';
import { emptyInventory } from '../resources/resources.logic';
import {
  ANIMAL_FOOD,
  WILDLIFE,
  animalIsVisible,
  canFeedAnimal,
  createAnimals,
  emptyAnimalBook,
  feedCost,
  feedTarget,
  migrateAnimalBook,
  migratePet,
  nearestFeedableAnimal,
  type Animal,
} from './wildlife.logic';

const cachorro: Animal = {
  id: 'teste-cachorro',
  kind: 'cachorro',
  regionId: 'bosque',
  position: vec3(0, 1.5, 0),
  rare: false,
  groups: 3,
  perGroup: 4,
};

const unicornio: Animal = {
  id: 'teste-unicornio',
  kind: 'unicornio',
  regionId: 'cachoeira',
  position: vec3(5, 4, 0),
  rare: true,
  groups: 2,
  perGroup: 6,
};

describe('wildlife.logic', () => {
  it('cria os animais com a mesma semente, sempre iguais', () => {
    const primeiro = createAnimals(createRng(20260816));
    const segundo = createAnimals(createRng(20260816));

    expect(primeiro).toEqual(segundo);
    expect(primeiro.length).toBeGreaterThan(0);
    // Os raros entram no estado mesmo fechados; a view e que decide a janela.
    expect(primeiro.some((animal) => animal.kind === 'unicornio')).toBe(true);
    expect(primeiro.some((animal) => animal.kind === 'dinossauro')).toBe(true);
  });

  it('animal de ambiente esta sempre visivel', () => {
    expect(animalIsVisible(cachorro, 'dia', 0)).toBe(true);
    expect(animalIsVisible(cachorro, 'noite', 0)).toBe(true);
  });

  it('raro so abre com sequencia de acertos e na fase certa', () => {
    expect(animalIsVisible(unicornio, 'noite', 0)).toBe(false);
    expect(animalIsVisible(unicornio, 'noite', WILDLIFE.rareStreak)).toBe(true);
    expect(animalIsVisible(unicornio, 'dia', WILDLIFE.rareStreak)).toBe(false);
  });

  it('o pedido de comida usa o alimento do animal e a tabuada da regiao', () => {
    const alvo = feedTarget(cachorro);

    expect(alvo.id).toBe(cachorro.id);
    expect(alvo.kind).toBe(ANIMAL_FOOD.cachorro);
    expect(alvo.groups).toBe(cachorro.groups);
    expect(alvo.perGroup).toBe(cachorro.perGroup);
    expect(feedCost(cachorro)).toBe(12);
  });

  it('so da para alimentar com a comida na mochila', () => {
    const semComida = emptyInventory();
    const comComida = { ...emptyInventory(), fruta: 12 };

    expect(canFeedAnimal(cachorro, semComida)).toBe(false);
    expect(canFeedAnimal(cachorro, comComida)).toBe(true);
  });

  it('nearestFeedableAnimal ignora raro fora da janela e acha o ambiente', () => {
    const animais = [unicornio, cachorro];
    const posicao = vec3(1, 1.5, 0);

    expect(nearestFeedableAnimal(posicao, animais, 'dia', 0)?.id).toBe(cachorro.id);
    expect(nearestFeedableAnimal(posicao, animais, 'noite', WILDLIFE.rareStreak)?.id).toBe(
      cachorro.id,
    );
  });

  it('migrateAnimalBook descarta especie desconhecida e preserva amizade', () => {
    const resultado = migrateAnimalBook([
      { kind: 'cachorro', seen: true, friend: true },
      { kind: 'pikachu', seen: true, friend: true },
      'lixo',
    ]);

    expect(resultado.find((entry) => entry.kind === 'cachorro')).toMatchObject({
      seen: true,
      friend: true,
    });
    expect(resultado.find((entry) => entry.kind === 'unicornio')).toBeUndefined();
  });

  it('migrateAnimalBook recusa lista que nao e lista', () => {
    expect(() => migrateAnimalBook('cachorro')).toThrow();
  });

  it('migratePet aceita especie conhecida e rejeita o resto', () => {
    expect(migratePet('cachorro')).toBe('cachorro');
    expect(migratePet('pikachu')).toBeNull();
    expect(migratePet(42)).toBeNull();
  });
});

describe('wildlife.store', () => {
  const state = () => useGameStore.getState();

  beforeEach(() => {
    state().resetWildlife();
    state().resetResources();
  });

  it('marcar como visto e idempotente', () => {
    state().markSeen('cachorro');
    const depoisDaPrimeira = state().animalBook;

    state().markSeen('cachorro');

    expect(state().animalBook.find((entry) => entry.kind === 'cachorro')?.seen).toBe(true);
    expect(state().animalBook).toEqual(depoisDaPrimeira);
  });

  it('alimentar debita a comida e registra amizade', () => {
    useGameStore.setState({
      animals: [cachorro],
      inventory: { ...emptyInventory(), fruta: 20 },
    });

    state().feedAnimal(cachorro.id);

    expect(state().inventory.fruta).toBe(8);
    expect(state().animalBook.find((entry) => entry.kind === 'cachorro')).toMatchObject({
      seen: true,
      friend: true,
    });
  });

  it('sem comida suficiente, alimentar nao faz nada', () => {
    useGameStore.setState({
      animals: [cachorro],
      inventory: emptyInventory(),
    });

    state().feedAnimal(cachorro.id);

    expect(state().inventory.fruta).toBe(0);
    expect(state().animalBook.find((entry) => entry.kind === 'cachorro')?.friend).toBe(false);
  });

  it('resetWildlife volta a caderneta vazia', () => {
    state().markSeen('gaivota');
    state().resetWildlife();

    expect(state().animalBook).toEqual(emptyAnimalBook());
  });
});
