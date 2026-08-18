import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { ECONOMY, coinsFor, factKey } from './economy.logic';

const state = () => useGameStore.getState();

describe('factKey', () => {
  it('identifica o fato pela dupla de fatores', () => {
    expect(factKey(2, 4)).toBe('2x4');
  });

  it('trata 2x4 e 4x2 como o mesmo fato', () => {
    expect(factKey(4, 2)).toBe(factKey(2, 4));
  });
});

describe('coinsFor', () => {
  it('o acerto paga o numero da tabuada', () => {
    expect(coinsFor({ perGroup: 2, streak: 1, factIsNew: false })).toBe(2);
    expect(coinsFor({ perGroup: 9, streak: 1, factIsNew: false })).toBe(9);
  });

  it('a cada tres seguidos vem o bonus', () => {
    expect(coinsFor({ perGroup: 2, streak: 3, factIsNew: false })).toBe(2 + ECONOMY.streakBonus);
    expect(coinsFor({ perGroup: 2, streak: 6, factIsNew: false })).toBe(2 + ECONOMY.streakBonus);
  });

  it('fora do multiplo de tres nao ha bonus de sequencia', () => {
    expect(coinsFor({ perGroup: 2, streak: 1, factIsNew: false })).toBe(2);
    expect(coinsFor({ perGroup: 2, streak: 4, factIsNew: false })).toBe(2);
  });

  it('fato novo paga o bonus grande', () => {
    expect(coinsFor({ perGroup: 2, streak: 1, factIsNew: true })).toBe(2 + ECONOMY.newFactBonus);
  });

  it('os bonus se somam', () => {
    expect(coinsFor({ perGroup: 2, streak: 3, factIsNew: true })).toBe(
      2 + ECONOMY.streakBonus + ECONOMY.newFactBonus,
    );
  });

  it('nunca paga menos que o numero da tabuada', () => {
    for (let streak = 1; streak <= 12; streak += 1) {
      expect(coinsFor({ perGroup: 5, streak, factIsNew: false })).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('slice da economia', () => {
  beforeEach(() => {
    state().resetEconomy();
  });

  it('comeca sem moeda, sem sequencia e sem fato conhecido', () => {
    expect(state().coins).toBe(0);
    expect(state().streak).toBe(0);
    expect(state().knownFacts).toEqual([]);
  });

  it('o acerto credita moedas e conta a sequencia', () => {
    state().rewardCorrect(2, 4);

    expect(state().streak).toBe(1);
    // 2 da tabuada + 10 por ser fato novo.
    expect(state().coins).toBe(2 + ECONOMY.newFactBonus);
    expect(state().knownFacts).toEqual(['2x4']);
  });

  it('o mesmo fato so paga o bonus de novidade uma vez', () => {
    state().rewardCorrect(2, 4);
    const depoisDoPrimeiro = state().coins;
    state().rewardCorrect(2, 4);

    expect(state().coins - depoisDoPrimeiro).toBe(2);
    expect(state().knownFacts).toEqual(['2x4']);
  });

  it('4x2 nao conta como fato novo depois de 2x4', () => {
    state().rewardCorrect(2, 4);
    state().rewardCorrect(4, 2);

    expect(state().knownFacts).toEqual(['2x4']);
  });

  it('o erro zera a sequencia e nao tira moeda', () => {
    state().rewardCorrect(2, 4);
    const antes = state().coins;
    state().breakStreak();

    expect(state().streak).toBe(0);
    expect(state().coins).toBe(antes);
  });

  it('o resumo do dia zera, mas as moedas e os fatos atravessam', () => {
    state().rewardCorrect(2, 4);
    const moedas = state().coins;
    state().resetDaily();

    expect(state().correctToday).toBe(0);
    expect(state().coinsToday).toBe(0);
    expect(state().newFactsToday).toEqual([]);
    expect(state().coins).toBe(moedas);
    expect(state().knownFacts).toEqual(['2x4']);
  });
});
