import { describe, expect, it } from 'vitest';
import {
  applyAttempt,
  computeMasteryScore,
  createEmptyFactStat,
  isMastered,
  isStruggling,
  recordAttempt,
  weakestFacts,
} from './mastery';
import type { FactStats } from './types';

const NOW = new Date('2026-01-01T10:00:00.000Z');

function replay(outcomes: boolean[]) {
  let stat = createEmptyFactStat();
  for (const outcome of outcomes) {
    stat = applyAttempt(stat, outcome, NOW);
  }
  return stat;
}

describe('computeMasteryScore', () => {
  it('e zero quando nunca houve tentativa', () => {
    expect(computeMasteryScore(0, 0, 0)).toBe(0);
  });

  it('e 1 quando tudo foi acertado', () => {
    expect(computeMasteryScore(5, 5, 1)).toBe(1);
  });

  it('fica entre 0 e 1 em qualquer combinacao', () => {
    for (let attempts = 1; attempts <= 20; attempts += 1) {
      for (let correct = 0; correct <= attempts; correct += 1) {
        const score = computeMasteryScore(attempts, correct, correct / attempts);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('applyAttempt', () => {
  it('conta tentativas, acertos e erros', () => {
    const stat = replay([true, false, true, true, false]);
    expect(stat.attempts).toBe(5);
    expect(stat.correct).toBe(3);
    expect(stat.incorrect).toBe(2);
    expect(stat.lastWasCorrect).toBe(false);
    expect(stat.lastSeenAt).toBe(NOW.toISOString());
  });

  it('nao muta o stat original', () => {
    const original = createEmptyFactStat();
    const updated = applyAttempt(original, true, NOW);
    expect(original.attempts).toBe(0);
    expect(updated.attempts).toBe(1);
  });

  it('mantem o dominio moderado com desempenho misto', () => {
    // 8 tentativas, 5 acertos: proximo de 0.6, nunca "dominado".
    const stat = replay([true, false, true, true, false, true, false, true]);
    expect(stat.attempts).toBe(8);
    expect(stat.correct).toBe(5);
    expect(stat.masteryScore).toBeGreaterThan(0.4);
    expect(stat.masteryScore).toBeLessThan(0.85);
  });

  it('reage a melhora recente', () => {
    const struggling = replay([false, false, false]);
    const recovering = replay([false, false, false, true, true, true, true]);
    expect(recovering.masteryScore).toBeGreaterThan(struggling.masteryScore);
  });

  it('cai quando a crianca comeca a errar', () => {
    const good = replay([true, true, true, true]);
    const worsening = replay([true, true, true, true, false, false]);
    expect(worsening.masteryScore).toBeLessThan(good.masteryScore);
  });
});

describe('classificacao de fatos', () => {
  it('marca como fraco quem erra muito', () => {
    const stats: FactStats = recordAttempt(recordAttempt({}, '7x3', false, NOW), '7x3', false, NOW);
    expect(isStruggling(stats, '7x3')).toBe(true);
    expect(isMastered(stats, '7x3')).toBe(false);
  });

  it('marca como dominado quem acerta consistentemente', () => {
    let stats: FactStats = {};
    for (let i = 0; i < 4; i += 1) {
      stats = recordAttempt(stats, '2x5', true, NOW);
    }
    expect(isMastered(stats, '2x5')).toBe(true);
    expect(isStruggling(stats, '2x5')).toBe(false);
  });

  it('nao considera fraco um fato nunca visto', () => {
    expect(isStruggling({}, '9x9')).toBe(false);
  });

  it('ordena os fatos mais fracos primeiro', () => {
    let stats: FactStats = {};
    stats = recordAttempt(stats, '2x2', true, NOW);
    stats = recordAttempt(stats, '2x2', true, NOW);
    stats = recordAttempt(stats, '7x8', false, NOW);
    stats = recordAttempt(stats, '7x8', false, NOW);
    stats = recordAttempt(stats, '6x6', true, NOW);
    stats = recordAttempt(stats, '6x6', false, NOW);
    expect(weakestFacts(stats, 2)).toEqual(['7x8', '6x6']);
  });
});
