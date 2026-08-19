// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderScene } from '../../test/sceneHarness';
import { BridgeGuardView } from './BridgeGuardView';
import { bridgeFor } from './bridges.logic';

function gruposPorNome(
  renderer: Awaited<ReturnType<typeof renderScene>>,
  nome: string,
): { name: string }[] {
  return renderer.scene
    .findAllByType('Group')
    .map((no) => no.instance as unknown as { name: string })
    .filter((grupo) => grupo.name === nome);
}

describe('BridgeGuardView', () => {
  it('desenha a guardia da ponte com corpo visivel', async () => {
    const ponte = bridgeFor('praia', 'porto')!;
    const renderer = await renderScene(<BridgeGuardView ponte={ponte} />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(gruposPorNome(renderer, `guard-${ponte.id}`)).toHaveLength(1);
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0);

    await renderer.unmount();
  });
});
