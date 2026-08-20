// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import * as audio from '../../shared/audio';
import type { ChallengeFeedback } from '../math/math.store';
import { JuiceView } from './JuiceView';

const state = () => useGameStore.getState();

function feedback(partial: Partial<ChallengeFeedback>): ChallengeFeedback {
  return {
    targetId: 'alvo',
    purpose: 'colher',
    correct: true,
    answer: 8,
    reward: 8,
    coins: 2,
    ...partial,
  };
}

describe('JuiceView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    state().resetResources();
    state().cancelChallenge();
    state().clearFeedback();
  });

  it('abre partículas e toca o som de colheita no acerto', async () => {
    const spy = vi.spyOn(audio, 'playSound').mockImplementation(() => {});
    const alvo = state().nodes[0];
    const renderer = await renderScene(<JuiceView />);

    act(() => {
      useGameStore.setState({ feedback: feedback({ targetId: alvo.id }) });
    });
    await renderer.advanceFrames(3, 1 / 60);

    const pontos = renderer.scene.findAllByType('Points')[0]?.instance as unknown as
      | { geometry: { drawRange: { count: number } } }
      | undefined;
    expect(pontos?.geometry.drawRange.count).toBeGreaterThan(0);
    expect(spy).toHaveBeenCalledWith('harvest');

    await renderer.unmount();
  });

  it('erro toca a mola e gera partículas de erro', async () => {
    const spy = vi.spyOn(audio, 'playSound').mockImplementation(() => {});
    const alvo = state().nodes[0];
    const renderer = await renderScene(<JuiceView />);

    act(() => {
      useGameStore.setState({
        feedback: feedback({ targetId: alvo.id, correct: false, reward: 2, coins: 0 }),
      });
    });
    await renderer.advanceFrames(3, 1 / 60);

    expect(spy).toHaveBeenCalledWith('wrong');
    const pontos = renderer.scene.findAllByType('Points')[0]?.instance as unknown as
      | { geometry: { drawRange: { count: number } } }
      | undefined;
    expect(pontos?.geometry.drawRange.count).toBeGreaterThan(0);

    await renderer.unmount();
  });
});
