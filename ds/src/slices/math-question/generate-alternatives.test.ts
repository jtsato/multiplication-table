import { describe, expect, it } from "vitest";
import { generateAlternatives } from "./generate-alternatives";
import { seededRng } from "../../shared/test/rng";

const FACT = { a: 6, b: 4, answer: 24 };

describe("generateAlternatives", () => {
  it("retorna o número padrão de alternativas distintas", () => {
    const alternatives = generateAlternatives(FACT, seededRng(1));
    expect(alternatives).toHaveLength(4);
    expect(new Set(alternatives).size).toBe(4);
  });

  it("inclui a resposta correta exatamente uma vez", () => {
    const alternatives = generateAlternatives(FACT, seededRng(1));
    expect(alternatives.filter((n) => n === FACT.answer)).toHaveLength(1);
  });

  it("não gera alternativas negativas", () => {
    const alternatives = generateAlternatives(FACT, seededRng(1));
    expect(alternatives.every((n) => n >= 0)).toBe(true);
  });

  it("respeita o parâmetro count", () => {
    expect(generateAlternatives(FACT, seededRng(1), 3)).toHaveLength(3);
  });

  it("é determinístico para a mesma semente", () => {
    expect(generateAlternatives(FACT, seededRng(2))).toEqual(
      generateAlternatives(FACT, seededRng(2)),
    );
  });

  // Ordem esperada para as sementes — pinada para detectar mutações no
  // shuffle (a invariância de conteúdo sozinha não mata mutantes de ordem).
  it("decide o sinal do distrator no limite exato 0.5", () => {
    // Sequência: strategy=0 (delta 1), sign=0.5 (>= 0.5 → +1), shuffle.
    let i = 0;
    const scripted = () => [0, 0.5, 0][i++] ?? 0;
    expect(generateAlternatives(FACT, scripted, 2)).toEqual([25, 24]);
  });

  it("ordena (embaralha) conforme a semente 1", () => {
    expect(generateAlternatives(FACT, seededRng(1))).toEqual([30, 28, 23, 24]);
  });

  it("ordena (embaralha) conforme a semente 2", () => {
    expect(generateAlternatives(FACT, seededRng(2))).toEqual([20, 25, 23, 24]);
  });

  it("com espaço de distratores limitado, entrega o que existe sem travar", () => {
    const limitado = generateAlternatives({ a: 1, b: 1, answer: 1 }, seededRng(5));
    expect(limitado).toHaveLength(3);
    expect(new Set(limitado)).toEqual(new Set([0, 1, 2]));
  });
});
