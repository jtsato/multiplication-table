/**
 * PRNG semeado (mulberry32).
 *
 * Todo sorteio do jogo — posicao de recursos, escolha do desafio, distratores,
 * ponto de spawn do inimigo — passa por aqui em vez de `Math.random`. Isso deixa
 * os testes deterministicos: mesma semente, mesmo mundo.
 */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  // `>>> 0` mantem o estado como inteiro sem sinal de 32 bits.
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inteiro em [min, max], ambos inclusivos. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Real em [min, max). */
export function randomRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/**
 * Copia embaralhada do array (Fisher-Yates).
 *
 * Percorre de tras para frente trocando com um indice sorteado entre 0 e i —
 * a versao ingenua (sortear qualquer indice do array inteiro) produz permutacoes
 * com probabilidades desiguais, o que enviesaria a posicao da resposta certa
 * entre as alternativas.
 */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Elemento sorteado de um array nao vazio. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pick() exige um array nao vazio.');
  }
  return items[randomInt(rng, 0, items.length - 1)];
}
