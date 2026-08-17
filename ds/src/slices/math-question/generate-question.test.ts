import { describe, expect, it } from "vitest";
import { DEFAULT_TABLES, generateQuestion } from "./generate-question";
import { seededRng } from "../../shared/test/rng";

describe("generateQuestion", () => {
  it("DEFAULT_TABLES cobre as tabuadas de 2 a 9", () => {
    expect(DEFAULT_TABLES).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it("gera um fato com resposta igual ao produto", () => {
    const fact = generateQuestion([2, 3, 4], seededRng(42));
    expect(fact.answer).toBe(fact.a * fact.b);
    expect([2, 3, 4]).toContain(fact.a);
    expect([2, 3, 4]).toContain(fact.b);
  });

  it("com rng 0 escolhe o primeiro elemento das tabelas", () => {
    expect(generateQuestion([2, 3], () => 0)).toEqual({ a: 2, b: 2, answer: 4 });
  });

  it("com rng 1 escolhe o último elemento das tabelas (clamp)", () => {
    expect(generateQuestion([2, 3, 5], () => 1)).toEqual({ a: 5, b: 5, answer: 25 });
  });

  it("com rng 0.5 escolhe o elemento do meio", () => {
    expect(generateQuestion([2, 3, 5], () => 0.5)).toEqual({ a: 3, b: 3, answer: 9 });
  });

  it("é determinístico para a mesma semente", () => {
    expect(generateQuestion([2, 4, 6, 8], seededRng(7))).toEqual(
      generateQuestion([2, 4, 6, 8], seededRng(7)),
    );
  });
});
