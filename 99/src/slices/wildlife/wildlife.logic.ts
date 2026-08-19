import { type Rng } from '../../shared/rng';
import { distanceSqXZ, type Vec3 } from '../../shared/vec';
import type { DayPhase } from '../daynight/daynight.logic';
import { REGIONS, randomGroundPositionIn, type RegionId } from '../regions/regions.logic';
import type { ResourceKind } from '../resources/resources.logic';
import type { ChallengeTarget } from '../math/math.logic';
import type { Inventory } from '../resources/resources.logic';
import { scatterPositions } from '../world/world.logic';

/**
 * Animais, caderneta e raros.
 *
 * A regra tonal firme da spec: **animal nunca e no de colheita**. Nao se colhe
 * uma vaca. Ele e alvo de encomenda (alimentar) e de contagem — e o que esta
 * slice implementa: ver, alimentar, virar amigo, levar como pet.
 *
 * Os raros aparecem em janela curta, em lugar e hora especificos, e a chance
 * sobe com a sequencia de acertos — raridade amarrada a dominio, nao a sorte.
 */

export type AnimalKind =
  'gaivota' | 'peixe' | 'cachorro' | 'gato' | 'cavalo' | 'vaca' | 'unicornio' | 'dinossauro';

export const ANIMAL_KINDS: readonly AnimalKind[] = [
  'gaivota',
  'peixe',
  'cachorro',
  'gato',
  'cavalo',
  'vaca',
  'unicornio',
  'dinossauro',
];

export const WILDLIFE = {
  /** Distancia para interagir com um animal. Mesma da colheita. */
  interactRange: 3.2,
  /** Distancia a partir da qual o animal entra na caderneta como "visto". */
  sightRange: 10,
  /** Sequencia de acertos que abre a janela dos raros. */
  rareStreak: 3,
  /** Quantos animais de ambiente por especie em cada regiao. */
  animalsPerRegion: 2,
} as const;

export interface Animal {
  id: string;
  kind: AnimalKind;
  regionId: RegionId;
  position: Vec3;
  /** Raro: so aparece na janela dele, e a sequencia de acertos abre a janela. */
  rare: boolean;
  /** Grupos do pedido de comida — o multiplicando do desafio. */
  groups: number;
  /** Tabuada da regiao do animal — o multiplicador do desafio. */
  perGroup: number;
}

export interface AnimalBookEntry {
  kind: AnimalKind;
  seen: boolean;
  friend: boolean;
}

/** Onde cada especie vive. */
export const ANIMAL_REGION: Record<AnimalKind, RegionId> = {
  gaivota: 'praia',
  peixe: 'porto',
  cachorro: 'bosque',
  gato: 'bosque',
  cavalo: 'cachoeira',
  vaca: 'pomar',
  unicornio: 'cachoeira',
  dinossauro: 'pico',
};

/**
 * O que cada animal come.
 *
 * Reusamos os recursos existentes de proposito: a regra do projeto diz que
 * nenhum recurso novo entra antes de ter destino, e alimentar animais e um
 * destino — a fruta, o peixe e o cristal ganham mais uma saida.
 */
export const ANIMAL_FOOD: Record<AnimalKind, ResourceKind> = {
  gaivota: 'peixe',
  peixe: 'fruta',
  cachorro: 'fruta',
  gato: 'peixe',
  cavalo: 'fruta',
  vaca: 'fruta',
  unicornio: 'cristal',
  dinossauro: 'fruta',
};

/** Especies de ambiente por regiao; os raros ficam fora desta lista. */
const AMBIENT_BY_REGION: Record<RegionId, readonly AnimalKind[]> = {
  praia: ['gaivota'],
  porto: ['peixe'],
  bosque: ['cachorro', 'gato'],
  cachoeira: ['cavalo'],
  pomar: ['vaca'],
  pico: [],
};

/** Cria os animais do mundo com a mesma semente dos recursos. */
export function createAnimals(rng: Rng): Animal[] {
  const animals: Animal[] = [];

  for (const regiao of REGIONS) {
    const especies = AMBIENT_BY_REGION[regiao.id] ?? [];
    for (const especie of especies) {
      const positions = scatterPositions(
        rng,
        WILDLIFE.animalsPerRegion,
        4,
        () => false,
        (semente) => randomGroundPositionIn(regiao, semente),
      );
      positions.forEach((position, index) => {
        animals.push({
          id: `${regiao.id}-${especie}-${index}`,
          kind: especie,
          regionId: regiao.id,
          position,
          rare: false,
          groups: 1 + Math.floor(rng() * 10),
          perGroup: regiao.tables[index % regiao.tables.length],
        });
      });
    }
  }

  // Os raros entram no estado sempre; a view e que decide se a janela esta
  // aberta. Assim a caderneta conhece a especie antes mesmo de ela aparecer.
  animals.push(
    {
      id: 'raro-unicornio',
      kind: 'unicornio',
      regionId: 'cachoeira',
      position: randomGroundPositionIn(regionById('cachoeira'), rng),
      rare: true,
      groups: 1 + Math.floor(rng() * 6),
      perGroup: 6,
    },
    {
      id: 'raro-dinossauro',
      kind: 'dinossauro',
      regionId: 'pico',
      position: randomGroundPositionIn(regionById('pico'), rng),
      rare: true,
      groups: 1 + Math.floor(rng() * 6),
      perGroup: 9,
    },
  );

  return animals;
}

function regionById(id: RegionId) {
  return REGIONS.find((regiao) => regiao.id === id)!;
}

/** Caderneta vazia: nada visto, nada amigo. */
export function emptyAnimalBook(): AnimalBookEntry[] {
  return ANIMAL_KINDS.map((kind) => ({ kind, seen: false, friend: false }));
}

export function animalById(animals: readonly Animal[], id: string): Animal | null {
  return animals.find((animal) => animal.id === id) ?? null;
}

/**
 * O animal esta visivel agora?
 *
 * Ambiente sempre. Raro so na janela: lugar (regiao) e hora (fase) proprios, e
 * a janela abre com uma sequencia minima de acertos — o raro premia dominio,
 * nao sorte.
 */
export function animalIsVisible(animal: Animal, phase: DayPhase, streak: number): boolean {
  if (!animal.rare) return true;
  if (streak < WILDLIFE.rareStreak) return false;
  if (animal.kind === 'unicornio') return phase === 'noite';
  if (animal.kind === 'dinossauro') return phase === 'dia';
  return false;
}

/** Animal visivel mais proximo dentro do alcance de interacao, ou `null`. */
export function nearestFeedableAnimal(
  position: Vec3,
  animals: readonly Animal[],
  phase: DayPhase,
  streak: number,
  range: number = WILDLIFE.interactRange,
): Animal | null {
  const rangeSq = range * range;
  let best: Animal | null = null;
  let bestDistanceSq = Infinity;

  for (const animal of animals) {
    if (!animalIsVisible(animal, phase, streak)) continue;
    const distanceSq = distanceSqXZ(position, animal.position);
    if (distanceSq <= rangeSq && distanceSq < bestDistanceSq) {
      best = animal;
      bestDistanceSq = distanceSq;
    }
  }

  return best;
}

/** O alvo do desafio de alimentar: a conta usa a comida do animal. */
export function feedTarget(animal: Animal): ChallengeTarget {
  return {
    id: animal.id,
    kind: ANIMAL_FOOD[animal.kind],
    groups: animal.groups,
    perGroup: animal.perGroup,
  };
}

/** Quanta comida o pedido custa. */
export function feedCost(animal: Animal): number {
  return animal.groups * animal.perGroup;
}

/** Da para pagar o pedido deste animal agora? */
export function canFeedAnimal(animal: Animal, inventory: Inventory): boolean {
  return inventory[ANIMAL_FOOD[animal.kind]] >= feedCost(animal);
}

/**
 * Valida a caderneta vinda do save.
 *
 * So os animais que ja apareceram no save entram na lista; os demais ficam de
 * fora e a interface os trata como "ainda nao visto". Especie desconhecida e
 * descartada em silencio (pode ser de uma versao futura); lista que nao e lista
 * derruba o save, porque isso e bug de programa.
 */
export function migrateAnimalBook(raw: unknown): AnimalBookEntry[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error('caderneta invalida');

  const resultado: AnimalBookEntry[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.kind !== 'string' ||
      !ANIMAL_KINDS.includes(candidate.kind as AnimalKind)
    ) {
      continue;
    }
    const kind = candidate.kind as AnimalKind;
    const entrada: AnimalBookEntry = { kind, seen: candidate.seen === true, friend: false };
    if (candidate.friend === true) {
      entrada.seen = true;
      entrada.friend = true;
    }
    resultado.push(entrada);
  }
  return resultado;
}

/** Valida o pet vindo do save. Desconhecido vira `null`, sem lancar. */
export function migratePet(raw: unknown): AnimalKind | null {
  if (typeof raw !== 'string' || !ANIMAL_KINDS.includes(raw as AnimalKind)) return null;
  return raw as AnimalKind;
}
