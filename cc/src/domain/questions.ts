import { factKey, productOf } from './facts';
import { randomInt, shuffle, type Rng } from './rng';
import type { MultiplicationFact, Question } from './types';

/** Quantidade de alternativas aceitas por pergunta. */
export const MIN_OPTIONS = 3;
export const MAX_OPTIONS = 4;

/**
 * Faixa de plausibilidade dos distratores.
 * Um distrator so entra se estiver "perto o bastante" da resposta correta,
 * para nunca cair no caso `42 / 103 / 999`.
 */
function plausibleRange(answer: number): { min: number; max: number } {
  const spread = Math.max(10, Math.round(answer * 0.6));
  return { min: Math.max(1, answer - spread), max: answer + spread };
}

/**
 * Candidatos a distrator, organizados por tier de plausibilidade.
 *
 * tier 1: produtos vizinhos reais (a*(b+-1) e (a+-1)*b) - o erro mais comum
 *         de quem recita a tabuada e para uma linha antes ou depois.
 * tier 2: erros de contagem pequenos (+-1, +-2).
 * tier 3: confusoes classicas (somar em vez de multiplicar, pular uma dezena).
 */
function distractorTiers(fact: MultiplicationFact): number[][] {
  const { a, b } = fact;
  const answer = productOf(fact);
  return [
    [answer + a, answer - a, answer + b, answer - b],
    [answer + 1, answer - 1, answer + 2, answer - 2],
    [a + b, answer + 5, answer - 5, answer + 10],
  ];
}

/**
 * Escolhe distratores plausiveis e distintos para um fato.
 * Percorre os tiers em ordem, embaralhando dentro de cada tier, ate juntar
 * a quantidade pedida.
 */
export function buildDistractors(rng: Rng, fact: MultiplicationFact, count: number): number[] {
  const answer = productOf(fact);
  const { min, max } = plausibleRange(answer);
  const chosen: number[] = [];
  const seen = new Set<number>([answer]);

  for (const tier of distractorTiers(fact)) {
    if (chosen.length >= count) {
      break;
    }
    const usable = shuffle(rng, tier).filter(
      (value) => Number.isInteger(value) && value >= min && value <= max,
    );
    for (const value of usable) {
      if (chosen.length >= count) {
        break;
      }
      // O teste do `seen` fica aqui dentro, e nao no filter: um mesmo tier
      // pode repetir valores quando a == b (ex: 2x2 gera [6, 2, 6, 2]).
      if (seen.has(value)) {
        continue;
      }
      chosen.push(value);
      seen.add(value);
    }
  }

  // Rede de seguranca: fatos minusculos (2x1) podem esgotar os tiers.
  let offset = 1;
  while (chosen.length < count && offset < 40) {
    for (const candidate of [answer + offset, answer - offset]) {
      if (chosen.length >= count) {
        break;
      }
      if (Number.isInteger(candidate) && candidate >= 1 && !seen.has(candidate)) {
        chosen.push(candidate);
        seen.add(candidate);
      }
    }
    offset += 1;
  }

  return chosen;
}

/**
 * Monta uma pergunta completa e ja embaralhada.
 *
 * `avoidCorrectIndex` recebe a posicao da resposta correta da pergunta
 * anterior; a correta nunca cai duas vezes seguidas no mesmo lugar, o que
 * impede a crianca de decorar a posicao em vez da conta.
 */
export function createQuestion(
  rng: Rng,
  fact: MultiplicationFact,
  optionCount: number,
  avoidCorrectIndex?: number,
): Question {
  const total = Math.min(MAX_OPTIONS, Math.max(MIN_OPTIONS, optionCount));
  const answer = productOf(fact);
  const distractors = buildDistractors(rng, fact, total - 1);
  const options = shuffle(rng, [answer, ...distractors]);

  let correctIndex = options.indexOf(answer);
  if (avoidCorrectIndex !== undefined && correctIndex === avoidCorrectIndex && options.length > 1) {
    let target = randomInt(rng, 0, options.length - 2);
    if (target >= correctIndex) {
      target += 1;
    }
    const swapped = options[target]!;
    options[target] = options[correctIndex]!;
    options[correctIndex] = swapped;
    correctIndex = target;
  }

  return {
    fact,
    key: factKey(fact),
    answer,
    options,
    correctIndex,
  };
}
