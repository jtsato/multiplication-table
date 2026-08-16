import { describe, expect, it } from 'vitest';
import { COOLDOWN, factWeight, reviewPool, selectFacts } from '../domain/adaptive';
import { emptyFactStat, recordAnswer } from '../domain/mastery';
import { factKey } from '../domain/questions';
import { createRng } from '../domain/random';
import { createDefaultStatistics } from '../persistence/schema';
import type { PlayerStatistics } from '../domain/types';

const NOW = '2026-01-01T10:00:00.000Z';

function statsWith(entries: Array<[number, number, boolean[]]>): PlayerStatistics {
  let stats = createDefaultStatistics();
  for (const [a, b, results] of entries) {
    for (const result of results) stats = recordAnswer(stats, { a, b }, result, NOW);
  }
  return stats;
}

describe('factWeight', () => {
  it('dá peso base para conteúdo novo', () => {
    expect(factWeight(emptyFactStat())).toBeGreaterThan(1);
  });

  it('aumenta o peso após erro recente', () => {
    const wrong = statsWith([[7, 3, [true, true, false]]]).facts['7x3']!;
    const right = statsWith([[7, 4, [true, true, true]]]).facts['7x4']!;
    expect(factWeight(wrong)).toBeGreaterThan(factWeight(right) * 2);
  });

  it('reduz o peso de multiplicações dominadas', () => {
    const mastered = statsWith([[2, 2, [true, true, true, true, true]]]).facts['2x2']!;
    expect(factWeight(mastered)).toBeLessThan(1);
  });
});

describe('selectFacts', () => {
  const ctx = (stats: PlayerStatistics, table = 7) => ({
    table,
    stats,
    unlockedTables: [2, 3, 4, 5, 6, 7],
  });

  it('retorna a quantidade pedida', () => {
    const facts = selectFacts(ctx(createDefaultStatistics()), 6, createRng(3));
    expect(facts).toHaveLength(6);
  });

  it('nunca repete o mesmo fato dentro da janela de cooldown', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const facts = selectFacts(ctx(createDefaultStatistics()), 8, createRng(seed));
      const keys = facts.map((f) => factKey(f.a, f.b));
      for (let i = 1; i < keys.length; i += 1) {
        const window = keys.slice(Math.max(0, i - COOLDOWN), i);
        expect(window).not.toContain(keys[i]);
      }
    }
  });

  it('faz multiplicações erradas aparecerem com mais frequência', () => {
    const stats = statsWith([
      [7, 3, [false, false, false]],
      [7, 4, [true, true, true, true, true]],
      [7, 5, [true, true, true, true, true]],
      [7, 6, [true, true, true, true, true]],
    ]);
    let hard = 0;
    let easy = 0;
    for (let seed = 0; seed < 120; seed += 1) {
      for (const fact of selectFacts(ctx(stats), 6, createRng(seed))) {
        const key = factKey(fact.a, fact.b);
        if (key === '7x3') hard += 1;
        if (key === '7x4') easy += 1;
      }
    }
    expect(hard).toBeGreaterThan(easy * 2);
  });

  it('respeita a semente de fatos recentes vindos da pergunta anterior', () => {
    const facts = selectFacts(ctx(createDefaultStatistics()), 3, createRng(9), ['7x1', '7x2']);
    const keys = facts.map((f) => factKey(f.a, f.b));
    expect(keys[0]).not.toBe('7x2');
    expect(keys[0]).not.toBe('7x1');
  });

  it('injeta revisão de tabuadas anteriores em dificuldade', () => {
    const stats = statsWith([[3, 8, [false, false, false]]]);
    let reviewSeen = 0;
    for (let seed = 0; seed < 60; seed += 1) {
      for (const fact of selectFacts(ctx(stats), 8, createRng(seed))) {
        if (fact.a === 3) reviewSeen += 1;
      }
    }
    expect(reviewSeen).toBeGreaterThan(0);
  });

  it('não injeta revisão quando não há tabuada anterior jogada', () => {
    const pool = reviewPool({ table: 2, stats: createDefaultStatistics(), unlockedTables: [2] });
    expect(pool).toHaveLength(0);
    const facts = selectFacts(
      { table: 2, stats: createDefaultStatistics(), unlockedTables: [2] },
      7,
      createRng(5),
    );
    expect(facts.every((f) => f.a === 2)).toBe(true);
  });

  it('mantém a revisão como minoria das perguntas', () => {
    const stats = statsWith([
      [3, 8, [false, false, false]],
      [4, 7, [false, false, false]],
    ]);
    for (let seed = 0; seed < 40; seed += 1) {
      const facts = selectFacts(ctx(stats), 8, createRng(seed));
      const review = facts.filter((f) => f.a !== 7).length;
      expect(review).toBeLessThanOrEqual(2);
    }
  });
});
