export interface MultiplicationFact {
  a: number;
  b: number;
  answer: number;
}

/** Gerador de números pseudoaleatórios em [0, 1). Injetado para determinismo. */
export type Rng = () => number;
