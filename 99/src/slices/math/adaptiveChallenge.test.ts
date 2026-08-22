import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { factKey } from '../economy/economy.logic';

const state = () => useGameStore.getState();

describe('seleção adaptativa no desafio de coleta', () => {
  beforeEach(() => {
    state().resetResources();
    state().resetEconomy();
    state().cancelChallenge();
  });

  it('mantém a região do nó e escolhe um fator da tabuada regional', () => {
    const node = state().nodes.find((candidate) => candidate.id === 'praia-0')!;
    state().startChallenge(node);

    const challenge = state().activeChallenge!;
    expect(challenge.targetId).toBe(node.id);
    expect(challenge.perGroup).toBe(2);
    expect(challenge.groups).toBeGreaterThanOrEqual(1);
    expect(challenge.groups).toBeLessThanOrEqual(10);
  });

  it('um erro registra o fato adaptativamente e agenda revisão', () => {
    const node = state().nodes[0];
    state().startChallenge(node);
    const challenge = state().activeChallenge!;
    const wrong = challenge.options.find((option) => option !== challenge.answer)!;

    state().answerChallenge(wrong);

    const progress = state().factProgress[factKey(challenge.perGroup, challenge.groups)];
    expect(progress.wrong).toBe(1);
    expect(progress.dueAt).toBeGreaterThan(state().learningStep);
  });

  it('cancelar restaura a geometria original do nó', () => {
    const node = state().nodes[0];
    const original = { groups: node.groups, perGroup: node.perGroup };
    state().startChallenge(node);
    state().cancelChallenge();

    const restored = state().nodes.find((candidate) => candidate.id === node.id)!;
    expect(restored.groups).toBe(original.groups);
    expect(restored.perGroup).toBe(original.perGroup);
    expect(state().activeChallenge).toBeNull();
  });
});
