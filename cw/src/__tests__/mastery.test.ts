import { describe, expect, it } from 'vitest';
import { computeMastery, emptyFactStat, recordAnswer, weakestFacts } from '../domain/mastery';
import { createDefaultStatistics } from '../persistence/schema';

const NOW = '2026-01-01T10:00:00.000Z';

describe('computeMastery', () => {
  it('vale 0 sem tentativas', () => {
    expect(computeMastery(emptyFactStat())).toBe(0);
  });

  it('cresce com acertos consecutivos', () => {
    let stats = createDefaultStatistics();
    const scores: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      stats = recordAnswer(stats, { a: 3, b: 4 }, true, NOW);
      scores.push(stats.facts['3x4']!.masteryScore);
    }
    expect(scores[0]).toBeLessThan(scores[4]!);
    expect(scores[4]).toBeGreaterThan(0.9);
  });

  it('cai depois de erros recentes', () => {
    let stats = createDefaultStatistics();
    for (let i = 0; i < 5; i += 1) stats = recordAnswer(stats, { a: 7, b: 3 }, true, NOW);
    const before = stats.facts['7x3']!.masteryScore;
    stats = recordAnswer(stats, { a: 7, b: 3 }, false, NOW);
    stats = recordAnswer(stats, { a: 7, b: 3 }, false, NOW);
    expect(stats.facts['7x3']!.masteryScore).toBeLessThan(before);
  });

  it('não dá domínio alto com uma única tentativa', () => {
    const stats = recordAnswer(createDefaultStatistics(), { a: 9, b: 9 }, true, NOW);
    expect(stats.facts['9x9']!.masteryScore).toBeLessThan(0.5);
  });
});

describe('recordAnswer', () => {
  it('atualiza totais, sequência e melhor sequência', () => {
    let stats = createDefaultStatistics();
    stats = recordAnswer(stats, { a: 2, b: 2 }, true, NOW);
    stats = recordAnswer(stats, { a: 2, b: 3 }, true, NOW);
    expect(stats.currentStreak).toBe(2);
    expect(stats.bestStreak).toBe(2);
    stats = recordAnswer(stats, { a: 2, b: 4 }, false, NOW);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(2);
    expect(stats.totalQuestions).toBe(3);
    expect(stats.totalCorrect).toBe(2);
    expect(stats.totalIncorrect).toBe(1);
  });

  it('registra desempenho por multiplicação específica', () => {
    let stats = createDefaultStatistics();
    stats = recordAnswer(stats, { a: 7, b: 3 }, false, NOW);
    stats = recordAnswer(stats, { a: 7, b: 3 }, true, NOW);
    const stat = stats.facts['7x3']!;
    expect(stat.attempts).toBe(2);
    expect(stat.correct).toBe(1);
    expect(stat.incorrect).toBe(1);
    expect(stat.lastSeenAt).toBe(NOW);
  });

  it('não muta o estado anterior', () => {
    const stats = createDefaultStatistics();
    const next = recordAnswer(stats, { a: 5, b: 5 }, true, NOW);
    expect(stats.totalQuestions).toBe(0);
    expect(next.totalQuestions).toBe(1);
  });
});

describe('weakestFacts', () => {
  it('lista as multiplicações com mais dificuldade', () => {
    let stats = createDefaultStatistics();
    for (let i = 0; i < 4; i += 1) stats = recordAnswer(stats, { a: 7, b: 3 }, false, NOW);
    for (let i = 0; i < 4; i += 1) stats = recordAnswer(stats, { a: 2, b: 2 }, true, NOW);
    expect(weakestFacts(stats)[0]).toBe('7x3');
  });
});
