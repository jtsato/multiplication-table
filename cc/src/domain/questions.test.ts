import { describe, expect, it } from 'vitest';
import { buildDistractors, createQuestion } from './questions';
import { createSeededRng } from './rng';
import { factsForTables, TABLES } from './facts';

describe('buildDistractors', () => {
  it('nunca devolve a resposta correta como distrator', () => {
    const rng = createSeededRng(1);
    for (const fact of factsForTables(TABLES)) {
      const distractors = buildDistractors(rng, fact, 3);
      expect(distractors).not.toContain(fact.a * fact.b);
    }
  });

  it('devolve valores distintos e positivos', () => {
    const rng = createSeededRng(7);
    for (const fact of factsForTables(TABLES)) {
      const distractors = buildDistractors(rng, fact, 3);
      expect(distractors).toHaveLength(3);
      expect(new Set(distractors).size).toBe(3);
      for (const value of distractors) {
        expect(value).toBeGreaterThan(0);
        expect(Number.isInteger(value)).toBe(true);
      }
    }
  });

  it('mantem os distratores plausiveis, perto da resposta', () => {
    const rng = createSeededRng(99);
    for (const fact of factsForTables(TABLES)) {
      const answer = fact.a * fact.b;
      const spread = Math.max(10, Math.round(answer * 0.6));
      for (const value of buildDistractors(rng, fact, 3)) {
        expect(value).toBeGreaterThanOrEqual(answer - spread);
        expect(value).toBeLessThanOrEqual(answer + spread);
      }
    }
  });

  it('para 7x6 usa vizinhos reais da tabuada', () => {
    const rng = createSeededRng(3);
    const distractors = buildDistractors(rng, { a: 7, b: 6 }, 3);
    // 42 +- 7 e 42 +- 6 sao os candidatos de primeiro tier.
    for (const value of distractors) {
      expect([36, 35, 48, 49]).toContain(value);
    }
  });

  it('preenche a quantidade pedida mesmo para fatos minusculos', () => {
    const rng = createSeededRng(4);
    for (const fact of [
      { a: 1, b: 1 },
      { a: 2, b: 1 },
      { a: 1, b: 2 },
    ]) {
      for (const count of [3, 4]) {
        const distractors = buildDistractors(rng, fact, count);
        expect(distractors).toHaveLength(count);
        expect(new Set(distractors).size).toBe(count);
        expect(distractors).not.toContain(fact.a * fact.b);
        for (const value of distractors) {
          expect(value).toBeGreaterThan(0);
          expect(Number.isInteger(value)).toBe(true);
        }
      }
    }
  });
});

describe('createQuestion', () => {
  it('inclui exatamente uma resposta correta', () => {
    const rng = createSeededRng(11);
    for (const fact of factsForTables(TABLES)) {
      const question = createQuestion(rng, fact, 4);
      const answer = fact.a * fact.b;
      expect(question.options).toHaveLength(4);
      expect(question.options.filter((option) => option === answer)).toHaveLength(1);
      expect(question.options[question.correctIndex]).toBe(answer);
    }
  });

  it('respeita a quantidade de alternativas pedida', () => {
    const rng = createSeededRng(12);
    expect(createQuestion(rng, { a: 2, b: 3 }, 3).options).toHaveLength(3);
    expect(createQuestion(rng, { a: 2, b: 3 }, 4).options).toHaveLength(4);
  });

  it('limita a quantidade de alternativas ao intervalo permitido', () => {
    const rng = createSeededRng(12);
    expect(createQuestion(rng, { a: 2, b: 3 }, 2).options).toHaveLength(3);
    expect(createQuestion(rng, { a: 2, b: 3 }, 0).options).toHaveLength(3);
    expect(createQuestion(rng, { a: 2, b: 3 }, 99).options).toHaveLength(4);
  });

  it('nunca repete a posicao da correta informada em avoidCorrectIndex', () => {
    const rng = createSeededRng(13);
    for (let i = 0; i < 200; i += 1) {
      const question = createQuestion(rng, { a: 4, b: 7 }, 4, 2);
      expect(question.correctIndex).not.toBe(2);
      expect(question.options[question.correctIndex]).toBe(28);
    }
  });

  it('distribui a resposta correta por todas as posicoes', () => {
    const rng = createSeededRng(21);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 400; i += 1) {
      const question = createQuestion(rng, { a: 6, b: 8 }, 4);
      counts[question.correctIndex] = (counts[question.correctIndex] ?? 0) + 1;
    }
    for (const count of counts) {
      // Distribuicao uniforme daria 100; exigimos apenas que nenhuma posicao
      // seja ignorada ou dominante.
      expect(count).toBeGreaterThan(50);
      expect(count).toBeLessThan(160);
    }
  });

  it('e deterministico para a mesma seed', () => {
    const a = createQuestion(createSeededRng(42), { a: 8, b: 9 }, 4);
    const b = createQuestion(createSeededRng(42), { a: 8, b: 9 }, 4);
    expect(a.options).toEqual(b.options);
  });
});
