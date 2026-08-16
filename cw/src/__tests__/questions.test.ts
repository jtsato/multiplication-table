import { describe, expect, it } from 'vitest';
import { createRng } from '../domain/random';
import {
  buildDistractors,
  buildQuestion,
  factKey,
  factsForTable,
  optionCountForTable,
  parseFactKey,
} from '../domain/questions';

describe('factKey', () => {
  it('gera e interpreta a chave canônica', () => {
    expect(factKey(7, 3)).toBe('7x3');
    expect(parseFactKey('7x3')).toEqual({ a: 7, b: 3 });
  });

  it('rejeita chave inválida', () => {
    expect(() => parseFactKey('abc')).toThrow();
  });
});

describe('factsForTable', () => {
  it('cria as 10 multiplicações da tabuada', () => {
    const facts = factsForTable(4);
    expect(facts).toHaveLength(10);
    expect(facts[0]).toEqual({ a: 4, b: 1 });
    expect(facts[9]).toEqual({ a: 4, b: 10 });
  });
});

describe('buildDistractors', () => {
  it('gera distratores plausíveis e positivos', () => {
    const rng = createRng(42);
    const distractors = buildDistractors({ a: 7, b: 6 }, 3, rng);
    expect(distractors).toHaveLength(3);
    for (const value of distractors) {
      expect(value).toBeGreaterThan(0);
      expect(value).not.toBe(42);
      expect(Math.abs(value - 42)).toBeLessThanOrEqual(42);
    }
  });

  it('nunca repete valores', () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const distractors = buildDistractors({ a: 3, b: 4 }, 3, createRng(seed));
      expect(new Set(distractors).size).toBe(distractors.length);
    }
  });

  it('funciona no caso extremo de resultado pequeno', () => {
    const distractors = buildDistractors({ a: 2, b: 1 }, 3, createRng(7));
    expect(distractors).toHaveLength(3);
    expect(distractors.every((d) => d > 0)).toBe(true);
    expect(distractors.includes(2)).toBe(false);
  });
});

describe('buildQuestion', () => {
  it('inclui a resposta correta entre as alternativas', () => {
    const question = buildQuestion({ a: 4, b: 6 }, 4, createRng(1));
    expect(question.answer).toBe(24);
    expect(question.options).toHaveLength(4);
    expect(question.options).toContain(24);
    expect(new Set(question.options).size).toBe(4);
  });

  it('distribui a resposta correta em posições variadas', () => {
    const positions = new Set<number>();
    for (let seed = 0; seed < 60; seed += 1) {
      const question = buildQuestion({ a: 6, b: 7 }, 4, createRng(seed));
      positions.add(question.options.indexOf(42));
    }
    expect(positions.size).toBeGreaterThan(2);
  });

  it('usa 3 alternativas nas tabuadas iniciais e 4 nas demais', () => {
    expect(optionCountForTable(2)).toBe(3);
    expect(optionCountForTable(9)).toBe(4);
  });
});
