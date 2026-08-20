// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { BRIDGES } from './bridges.logic';
import { RegionsView } from './RegionsView';

function guardias(renderer: Awaited<ReturnType<typeof renderScene>>): { name: string }[] {
  return renderer.scene
    .findAllByType('Group')
    .map((no) => no.instance as unknown as { name: string })
    .filter((grupo) => grupo.name.startsWith('guard-'));
}

describe('RegionsView — guardias nas pontes', () => {
  beforeEach(() => {
    useGameStore.getState().resetRegions();
  });

  it('cada ponte fechada tem a guardia visivel', async () => {
    const renderer = await renderScene(<RegionsView />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(guardias(renderer)).toHaveLength(BRIDGES.length);

    await renderer.unmount();
  });

  it('ponte aberta nao tem guardia — o pedagio acabou', async () => {
    useGameStore.setState({ openBridges: [BRIDGES[0].id] });
    const renderer = await renderScene(<RegionsView />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(guardias(renderer)).toHaveLength(BRIDGES.length - 1);
    expect(guardias(renderer).map((g) => g.name)).not.toContain(`guard-${BRIDGES[0].id}`);

    await renderer.unmount();
  });

  it('ponte aberta ganha luzes de progresso nas pontas', async () => {
    useGameStore.setState({ openBridges: [BRIDGES[0].id] });
    const renderer = await renderScene(<RegionsView />);
    await renderer.advanceFrames(2, 1 / 60);

    // As luzes usam MeshBasicMaterial (emissivo de verdade); o resto do jogo usa
    // Lambert. Ponta aberta = pelo menos duas luzes.
    expect(renderer.scene.findAllByType('MeshBasicMaterial').length).toBeGreaterThanOrEqual(2);

    await renderer.unmount();
  });

  it('nenhuma ponte aberta nao tem luz', async () => {
    const renderer = await renderScene(<RegionsView />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(renderer.scene.findAllByType('MeshBasicMaterial')).toHaveLength(0);

    await renderer.unmount();
  });
});
