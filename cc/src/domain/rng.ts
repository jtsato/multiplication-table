/**
 * Gerador de numeros pseudo-aleatorios deterministico.
 *
 * Todo o dominio recebe um `Rng` por parametro em vez de chamar Math.random
 * diretamente. Isso deixa geracao de perguntas, sorteio de distratores e
 * selecao adaptativa 100% testaveis.
 */
export interface Rng {
  /** Numero em [0, 1). */
  next(): number;
}

/** Rng deterministico (mulberry32). Mesma seed, mesma sequencia. */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Rng real, usado em runtime. */
export const systemRng: Rng = {
  next: () => Math.random(),
};

/** Inteiro em [min, max], inclusivo nas duas pontas. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng.next() * (max - min + 1));
}

/** Escolhe um item do array. Lanca se o array estiver vazio. */
export function pickOne<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pickOne: array vazio');
  }
  return items[randomInt(rng, 0, items.length - 1)]!;
}

/** Fisher-Yates puro: devolve uma copia embaralhada. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, 0, i);
    const a = copy[i]!;
    const b = copy[j]!;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

/**
 * Sorteio ponderado. `weights` deve ter o mesmo tamanho de `items` e conter
 * apenas valores >= 0. Se a soma for 0, cai para sorteio uniforme.
 */
export function weightedPick<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  if (items.length === 0) {
    throw new Error('weightedPick: array vazio');
  }
  if (items.length !== weights.length) {
    throw new Error('weightedPick: items e weights com tamanhos diferentes');
  }
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) {
    return pickOne(rng, items);
  }
  let threshold = rng.next() * total;
  for (let i = 0; i < items.length; i += 1) {
    threshold -= Math.max(0, weights[i]!);
    if (threshold < 0) {
      return items[i]!;
    }
  }
  return items[items.length - 1]!;
}
