import { describe, expect, it } from "vitest";
import { createFact } from "./facts";
import { generateAlternatives } from "./distractors";

describe("pedagogical distractors", () => {
  it("creates three unique alternatives with one correct answer", () => {
    const alternatives = generateAlternatives(createFact(6, 7), 42);

    expect(alternatives).toHaveLength(3);
    expect(new Set(alternatives.map((alternative) => alternative.value)).size).toBe(3);
    expect(alternatives.filter((alternative) => alternative.isCorrect)).toHaveLength(1);
    expect(alternatives.find((alternative) => alternative.isCorrect)?.value).toBe(42);
  });

  it("uses meaningful neighboring facts for a common multiplication", () => {
    const alternatives = generateAlternatives(createFact(6, 7), 42);
    const wrongValues = alternatives.filter((alternative) => !alternative.isCorrect).map((alternative) => alternative.value);

    expect(wrongValues).toEqual(expect.arrayContaining([36, 49]));
  });
});
