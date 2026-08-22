import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { factKey } from '../economy/economy.logic';
import { masteryLevel } from './pedagogy.logic';

const state = () => useGameStore.getState();

describe('pedagogy store', () => {
  beforeEach(() => {
    state().resetEconomy();
    state().resetPedagogy();
  });

  it('usa um unico estado pedagógico para acerto e projeções legadas', () => {
    state().rewardCorrect(2, 8);
    const key = factKey(2, 8);

    expect(state().factProgress[key].correct).toBe(1);
    expect(state().knownFacts).toContain(key);
    expect(state().factCounts[key]).toBe(1);
  });

  it('registra erro no fato sem apagar acertos anteriores', () => {
    state().rewardCorrect(2, 8);
    state().breakStreak(factKey(2, 8));

    expect(state().factProgress['2x8'].correct).toBe(1);
    expect(state().factProgress['2x8'].wrong).toBe(1);
    expect(masteryLevel(state().factProgress['2x8'])).toBe('review');
    expect(state().knownFacts).toContain('2x8');
  });

  it('resetEconomy limpa o progresso pedagógico junto com a partida', () => {
    state().rewardCorrect(2, 8);
    state().resetEconomy();

    expect(state().factProgress).toEqual({});
    expect(state().knownFacts).toEqual([]);
    expect(state().factCounts).toEqual({});
  });
});
