export function factKey(a, b) {
  return `${a}x${b}`;
}

function shuffle(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function generateChoices(answer, rng = Math.random) {
  const offsets = [-10, -7, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 7, 10];
  const orderedOffsets = shuffle(offsets, rng);
  const choices = new Set([answer]);

  for (const offset of orderedOffsets) {
    const candidate = answer + offset;
    if (candidate > 0 && Math.abs(candidate - answer) <= 14) {
      choices.add(candidate);
    }
    if (choices.size === 4) break;
  }

  return shuffle([...choices], rng);
}

function weightFor(stats) {
  if (!stats) return 5;
  const masteryPenalty = (1 - stats.masteryScore) * 4;
  const mistakes = Math.min(stats.incorrect, 8) * 0.3;
  return 1 + masteryPenalty + mistakes;
}

export function pickAdaptiveFact(table, stats = {}, recentKeys = [], rng = Math.random) {
  const facts = Array.from({ length: 10 }, (_, index) => {
    const multiplier = index + 1;
    const key = factKey(table, multiplier);
    return { table, multiplier, key, answer: table * multiplier };
  });

  let candidates = facts.filter((fact) => !recentKeys.includes(fact.key));
  if (candidates.length === 0) candidates = facts;

  const weighted = candidates.map((fact) => ({
    fact,
    weight: weightFor(stats[fact.key]),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = rng() * total;

  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.fact;
  }
  return weighted.at(-1).fact;
}
