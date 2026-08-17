/**
 * RNG determinístico (LCG) para testes: mesma semente → mesma sequência.
 */
export function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
