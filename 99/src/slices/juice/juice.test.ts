import { describe, expect, it } from 'vitest';
import type { ChallengeFeedback } from '../math/math.store';
import { burstForFeedback, STEP_DISTANCE_METERS, stepSoundFor } from './juice.logic';

function feedback(partial: Partial<ChallengeFeedback>): ChallengeFeedback {
  return {
    targetId: 'alvo',
    purpose: 'colher',
    correct: true,
    answer: 8,
    groups: 4,
    perGroup: 2,
    reward: 8,
    coins: 2,
    ...partial,
  };
}

describe('burstForFeedback', () => {
  it('acerto de colheita usa poeira dourada e som de colheita', () => {
    const burst = burstForFeedback(feedback({ purpose: 'colher', correct: true }));
    expect(burst.kind).toBe('correct');
    expect(burst.sound).toBe('harvest');
    expect(burst.color).toMatch(/^#/);
    expect(burst.shake).toBe(0);
    expect(burst.count).toBeGreaterThan(0);
  });

  it('erro é acolhedor: tremor sutil e som de mola, nunca de recompensa', () => {
    const burst = burstForFeedback(
      feedback({ purpose: 'colher', correct: false, reward: 2, coins: 0 }),
    );
    expect(burst.kind).toBe('wrong');
    expect(burst.sound).toBe('wrong');
    expect(burst.shake).toBeGreaterThan(0);
    expect(burst.shake).toBeLessThan(0.2);
  });

  it('abastecer acende com brilho quente e som de lanterna', () => {
    const burst = burstForFeedback(feedback({ purpose: 'abastecer', correct: true }));
    expect(burst.kind).toBe('lantern');
    expect(burst.sound).toBe('lantern');
    expect(burst.count).toBeGreaterThanOrEqual(20);
  });

  it('cada propósito de acerto tem um som próprio', () => {
    const sons = (['colher', 'abastecer', 'alimentar', 'encomenda', 'pedagio'] as const).map(
      (purpose) => burstForFeedback(feedback({ purpose, correct: true })).sound,
    );
    expect(new Set(sons).size).toBe(sons.length);
  });
});

describe('stepSoundFor', () => {
  it('mapeia cada região para a superfície do pé', () => {
    expect(stepSoundFor('praia')).toBe('step-sand');
    expect(stepSoundFor('porto')).toBe('step-wood');
    expect(stepSoundFor('bosque')).toBe('step-grass');
    expect(stepSoundFor('pomar')).toBe('step-grass');
    expect(stepSoundFor('cachoeira')).toBe('step-stone');
    expect(stepSoundFor('pico')).toBe('step-stone');
  });

  it('fora de terra não há passo', () => {
    expect(stepSoundFor(null)).toBeNull();
    expect(stepSoundFor('desconhecida')).toBeNull();
  });

  it('o passo tem distância fixa e positiva', () => {
    expect(STEP_DISTANCE_METERS).toBeGreaterThan(0);
  });
});
