import type { MultiplicationFact, Rng } from "./question.types";

const DEFAULT_COUNT = 4;
const MAX_TRIES = 100;

/**
 * Gera alternativas para a pergunta: a resposta correta + distratores
 * próximos (±1, ±a, ±b), sem duplicatas e sem negativos.
 */
export function generateAlternatives(
  fact: MultiplicationFact,
  rng: Rng,
  count: number = DEFAULT_COUNT,
): number[] {
  const candidates = [fact.answer];
  let tries = 0;
  while (candidates.length < count && tries < MAX_TRIES) {
    tries += 1;
    const candidate = generateDistractor(fact, rng);
    if (candidate >= 0 && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }
  return shuffle(candidates, rng);
}

function generateDistractor(fact: MultiplicationFact, rng: Rng): number {
  const strategy = Math.floor(rng() * 3);
  const delta = strategy === 0 ? 1 : strategy === 1 ? fact.a : fact.b;
  const sign = rng() < 0.5 ? -1 : 1;
  return fact.answer + delta * sign;
}

/** Fisher–Yates com RNG injetado (determinístico nos testes). */
function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
