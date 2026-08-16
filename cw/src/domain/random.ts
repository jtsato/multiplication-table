/**
 * RNG determinístico (mulberry32). Toda a lógica que sorteia recebe um Rng
 * injetado, o que torna geração de perguntas e revisão adaptativa testáveis.
 */

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const defaultRng: Rng = () => Math.random();

export function pick<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pick() em lista vazia');
  return items[Math.floor(rng() * items.length)] as T;
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/** Escolha ponderada. Pesos devem ser > 0. */
export function weightedPick<T>(items: readonly T[], weights: readonly number[], rng: Rng): T {
  if (items.length === 0) throw new Error('weightedPick() em lista vazia');
  const total = weights.reduce((sum, w) => sum + Math.max(w, 0), 0);
  if (total <= 0) return pick(items, rng);
  let target = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    target -= Math.max(weights[i] ?? 0, 0);
    if (target <= 0) return items[i] as T;
  }
  return items[items.length - 1] as T;
}
