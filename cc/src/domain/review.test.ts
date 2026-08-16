import { describe, expect, it } from 'vitest';
import {
  applyCooldown,
  COOLDOWN_WINDOW,
  factWeight,
  NEW_FACT_WEIGHT,
  pendingReviewFacts,
  pushRecentKey,
  selectNextFact,
} from './review';
import { recordAttempt } from './mastery';
import { createSeededRng } from './rng';
import { factKey, factsForTable } from './facts';
import type { FactStats } from './types';

const NOW = new Date('2026-01-01T10:00:00.000Z');

function withOutcomes(key: string, outcomes: boolean[], base: FactStats = {}): FactStats {
  return outcomes.reduce((stats, outcome) => recordAttempt(stats, key, outcome, NOW), base);
}

describe('factWeight', () => {
  it('da peso normal para conta nunca vista', () => {
    expect(factWeight({}, '4x7')).toBe(NEW_FACT_WEIGHT);
  });

  it('da peso maior para dominio baixo do que para dominio alto', () => {
    const weak = withOutcomes('7x3', [false, false, false]);
    const strong = withOutcomes('7x4', [true, true, true]);
    expect(factWeight(weak, '7x3')).toBeGreaterThan(factWeight(strong, '7x4'));
  });

  it('aumenta o peso quando o ultimo resultado foi erro', () => {
    const missedLast = withOutcomes('6x8', [true, true, false]);
    const hitLast = withOutcomes('6x9', [true, false, true]);
    expect(factWeight(missedLast, '6x8')).toBeGreaterThan(factWeight(hitLast, '6x9'));
  });

  it('reduz o peso de contas dominadas abaixo do peso de conteudo novo', () => {
    const mastered = withOutcomes('2x2', [true, true, true, true, true]);
    expect(factWeight(mastered, '2x2')).toBeLessThan(NEW_FACT_WEIGHT);
  });

  it('nunca devolve peso negativo ou zero', () => {
    const mastered = withOutcomes('10x10', [true, true, true, true, true, true, true, true]);
    expect(factWeight(mastered, '10x10')).toBeGreaterThan(0);
  });
});

describe('applyCooldown', () => {
  it('remove as contas perguntadas recentemente', () => {
    const facts = factsForTable(3);
    const recent = ['3x1', '3x2', '3x3'];
    const allowed = applyCooldown(facts, recent).map(factKey);
    expect(allowed).not.toContain('3x1');
    expect(allowed).not.toContain('3x2');
    expect(allowed).not.toContain('3x3');
    expect(allowed).toHaveLength(facts.length - 3);
  });

  it('bloqueia no maximo a janela de cooldown', () => {
    const facts = factsForTable(5);
    const recent = ['5x1', '5x2', '5x3', '5x4', '5x5', '5x6'];
    const allowed = applyCooldown(facts, recent);
    expect(allowed.length).toBe(facts.length - COOLDOWN_WINDOW);
  });

  it('nunca esvazia o conjunto quando ha poucas contas', () => {
    const facts = factsForTable(2).slice(0, 2);
    const allowed = applyCooldown(facts, ['2x1', '2x2']);
    expect(allowed.length).toBeGreaterThan(0);
  });

  it('devolve o conjunto inteiro quando nao ha historico', () => {
    const facts = factsForTable(4);
    expect(applyCooldown(facts, [])).toHaveLength(facts.length);
  });
});

describe('pushRecentKey', () => {
  it('mantem apenas a janela de cooldown', () => {
    let recent: string[] = [];
    for (const key of ['a', 'b', 'c', 'd', 'e']) {
      recent = pushRecentKey(recent, key);
    }
    expect(recent).toEqual(['c', 'd', 'e']);
    expect(recent).toHaveLength(COOLDOWN_WINDOW);
  });
});

describe('selectNextFact', () => {
  const baseContext = {
    table: 3,
    unlockedTables: [2, 3],
    stats: {} as FactStats,
    recentKeys: [] as string[],
  };

  it('sorteia apenas contas da tabuada atual quando nao ha revisao pendente', () => {
    const rng = createSeededRng(5);
    for (let i = 0; i < 100; i += 1) {
      const fact = selectNextFact(rng, baseContext);
      expect(fact.a).toBe(3);
      expect(fact.b).toBeGreaterThanOrEqual(1);
      expect(fact.b).toBeLessThanOrEqual(10);
    }
  });

  it('nunca repete uma conta que esta em cooldown', () => {
    const rng = createSeededRng(8);
    let recentKeys: string[] = [];
    for (let i = 0; i < 300; i += 1) {
      const fact = selectNextFact(rng, { ...baseContext, recentKeys });
      const key = factKey(fact);
      expect(recentKeys).not.toContain(key);
      recentKeys = pushRecentKey(recentKeys, key);
    }
  });

  it('mostra com mais frequencia a conta errada repetidamente', () => {
    let stats: FactStats = {};
    stats = withOutcomes('3x7', [false, false, false, false], stats);
    // As demais contas da tabuada foram bem respondidas.
    for (const fact of factsForTable(3)) {
      const key = factKey(fact);
      if (key !== '3x7') {
        stats = withOutcomes(key, [true, true, true], stats);
      }
    }

    const rng = createSeededRng(2026);
    let recentKeys: string[] = [];
    const counts = new Map<string, number>();
    const draws = 2000;
    for (let i = 0; i < draws; i += 1) {
      const fact = selectNextFact(rng, { ...baseContext, stats, recentKeys });
      const key = factKey(fact);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      recentKeys = pushRecentKey(recentKeys, key);
    }

    const uniformShare = draws / 10;
    const struggling = counts.get('3x7') ?? 0;
    expect(struggling).toBeGreaterThan(uniformShare * 1.8);
    // ...mas sem monopolizar a sessao.
    expect(struggling).toBeLessThan(draws * 0.5);
  });

  it('nao sorteia revisao quando as tabuadas anteriores estao dominadas', () => {
    let stats: FactStats = {};
    for (const fact of factsForTable(2)) {
      stats = withOutcomes(factKey(fact), [true, true, true, true], stats);
    }
    expect(pendingReviewFacts({ ...baseContext, stats })).toHaveLength(0);

    const rng = createSeededRng(77);
    for (let i = 0; i < 200; i += 1) {
      expect(selectNextFact(rng, { ...baseContext, stats }).a).toBe(3);
    }
  });

  it('traz contas fracas de tabuadas anteriores para revisao', () => {
    let stats: FactStats = {};
    stats = withOutcomes('2x9', [false, false, false], stats);

    const rng = createSeededRng(31);
    let sawReview = false;
    for (let i = 0; i < 300; i += 1) {
      const fact = selectNextFact(rng, { ...baseContext, stats });
      if (fact.a === 2) {
        sawReview = true;
        expect(factKey(fact)).toBe('2x9');
      }
    }
    expect(sawReview).toBe(true);
  });

  it('respeita reviewRatio zero', () => {
    let stats: FactStats = {};
    stats = withOutcomes('2x9', [false, false, false], stats);
    const rng = createSeededRng(4);
    for (let i = 0; i < 200; i += 1) {
      const fact = selectNextFact(rng, { ...baseContext, stats, reviewRatio: 0 });
      expect(fact.a).toBe(3);
    }
  });
});
