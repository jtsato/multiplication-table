export type MultiplicationFact = {
  a: number;
  b: number;
  answer: number;
};

export type FactBand = "A" | "B" | "C" | "D" | "E";

const MIN_FACTOR = 1;
const MAX_FACTOR = 10;

export function createFact(a: number, b: number): MultiplicationFact {
  if (!isValidFactor(a) || !isValidFactor(b)) {
    throw new RangeError("Fatores devem estar entre 1 e 10");
  }

  return { a, b, answer: a * b };
}

export function listFacts(maxFactor = MAX_FACTOR): MultiplicationFact[] {
  const facts: MultiplicationFact[] = [];
  for (let a = MIN_FACTOR; a <= maxFactor; a += 1) {
    for (let b = MIN_FACTOR; b <= maxFactor; b += 1) {
      facts.push(createFact(a, b));
    }
  }
  return facts;
}

export function factKey(fact: MultiplicationFact): string {
  return `${fact.a}x${fact.b}`;
}

export function commutativeKey(fact: MultiplicationFact): string {
  return `${Math.min(fact.a, fact.b)}x${Math.max(fact.a, fact.b)}`;
}

export function bandForFact(fact: MultiplicationFact): FactBand {
  const largestFactor = Math.max(fact.a, fact.b);
  if (largestFactor <= 2) return "A";
  if (largestFactor <= 4) return "B";
  if (largestFactor === 6) return "C";
  if (largestFactor <= 9) return "D";
  return "E";
}

function isValidFactor(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_FACTOR && value <= MAX_FACTOR;
}
