import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  createInitialAchievements,
  evaluateAchievements,
  reconcileAchievements,
} from '../domain/achievements';
import { createInitialProgress } from '../domain/progression';
import { createDefaultStatistics } from '../persistence/schema';

const NOW = '2026-01-01T10:00:00.000Z';

describe('conquistas', () => {
  it('começam todas bloqueadas', () => {
    expect(createInitialAchievements().every((a) => !a.unlocked)).toBe(true);
  });

  it('desbloqueia a primeira multiplicação correta', () => {
    const stats = { ...createDefaultStatistics(), totalCorrect: 1 };
    const result = evaluateAchievements(createInitialAchievements(), {
      stats,
      progress: createInitialProgress(),
    }, NOW);
    expect(result.newlyUnlocked).toContain('firstCorrect');
    expect(result.achievements.find((a) => a.id === 'firstCorrect')!.unlockedAt).toBe(NOW);
  });

  it('não desbloqueia duas vezes', () => {
    const stats = { ...createDefaultStatistics(), totalCorrect: 1 };
    const ctx = { stats, progress: createInitialProgress() };
    const first = evaluateAchievements(createInitialAchievements(), ctx, NOW);
    const second = evaluateAchievements(first.achievements, ctx, NOW);
    expect(second.newlyUnlocked).toHaveLength(0);
  });

  it('reconcilia saves antigos com o catálogo atual', () => {
    const reconciled = reconcileAchievements([{ id: 'firstCorrect', unlocked: true, unlockedAt: NOW }]);
    expect(reconciled).toHaveLength(ACHIEVEMENTS.length);
    expect(reconciled.find((a) => a.id === 'firstCorrect')!.unlocked).toBe(true);
  });
});
