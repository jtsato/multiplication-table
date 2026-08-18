/**
 * Economia: moedas, sequencia de acertos e fatos ja dominados.
 *
 * A regra que sustenta a slice inteira: **o recurso e o resultado da conta, a
 * moeda e o premio por ter acertado**. O recurso e concreto e vem em quantidade
 * calculada — a crianca conta 4 galhos de 2 gravetos e passa a ter 8 gravetos.
 * A moeda e abstrata e diz apenas *se* ela acertou.
 *
 * Por isso nao existe vender recurso por moeda em lugar nenhum do jogo: isso
 * faria o erro virar moeda por caminho indireto e a moeda deixaria de significar
 * dominio.
 */

export const ECONOMY = {
  /** Bonus a cada `streakEvery` acertos seguidos. */
  streakBonus: 5,
  /** Bonus da primeira vez que um fato e resolvido. Uma vez por fato. */
  newFactBonus: 10,
  streakEvery: 3,
} as const;

/**
 * Identificador do fato, com os fatores em ordem canonica.
 *
 * 2x4 e 4x2 sao o mesmo fato para quem esta aprendendo. Sem normalizar a ordem,
 * o bonus de "primeira vez" seria pago duas vezes pela mesma descoberta.
 */
export function factKey(a: number, b: number): string {
  const [menor, maior] = a <= b ? [a, b] : [b, a];
  return `${menor}x${maior}`;
}

export interface CoinInput {
  /** Itens por grupo — o numero da tabuada. */
  perGroup: number;
  /** Quantos acertos seguidos, ja contando este. */
  streak: number;
  factIsNew: boolean;
}

/**
 * Quanto vale um acerto.
 *
 * A base e o **numero da tabuada**, e nao um valor fixo: hoje toda conta paga 2,
 * mas quando as regioes chegarem (Fase 4) a tabuada do 9 vai pagar 9 sozinha,
 * sem nenhuma regra nova. A moeda cresce com a dificuldade de graca.
 */
export function coinsFor({ perGroup, streak, factIsNew }: CoinInput): number {
  let coins = perGroup;
  if (streak > 0 && streak % ECONOMY.streakEvery === 0) coins += ECONOMY.streakBonus;
  if (factIsNew) coins += ECONOMY.newFactBonus;
  return coins;
}
