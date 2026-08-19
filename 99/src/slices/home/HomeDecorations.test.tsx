// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { HomeDecorations } from './HomeDecorations';
import { HOME_DECORATION_KINDS } from './home.logic';

const state = () => useGameStore.getState();

function gruposPorNome(
  renderer: Awaited<ReturnType<typeof renderScene>>,
  nome: string,
): { name: string }[] {
  return renderer.scene
    .findAllByType('Group')
    .map((no) => no.instance as unknown as { name: string })
    .filter((grupo) => grupo.name === nome);
}

describe('HomeDecorations', () => {
  beforeEach(() => {
    state().resetEconomy();
  });

  it('sem nada comprado, nao desenha decoracao nenhuma', async () => {
    const renderer = await renderScene(<HomeDecorations />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(renderer.scene.findAllByType('Mesh')).toHaveLength(0);
    expect(gruposPorNome(renderer, 'decoracoes')).toHaveLength(0);

    await renderer.unmount();
  });

  it('nao desenha ferramentas nem consumiveis — so a categoria casa', async () => {
    useGameStore.setState({ owned: ['lanterna-maior', 'botas', 'dica'] });
    const renderer = await renderScene(<HomeDecorations />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(renderer.scene.findAllByType('Mesh')).toHaveLength(0);

    await renderer.unmount();
  });

  it('cada decoracao comprada aparece na cena', async () => {
    for (const kind of HOME_DECORATION_KINDS) {
      useGameStore.setState({ owned: [kind] });
      const renderer = await renderScene(<HomeDecorations />);
      await renderer.advanceFrames(2, 1 / 60);

      expect(gruposPorNome(renderer, kind), kind).toHaveLength(1);
      // Cada peca tem pelo menos uma malha visivel.
      expect(
        renderer.scene.findAllByType('Mesh').length,
        `${kind} nao desenhou malha nenhuma`,
      ).toBeGreaterThan(0);

      await renderer.unmount();
    }
  });

  it('comprar todas desenha as seis pecas de uma vez', async () => {
    useGameStore.setState({ owned: [...HOME_DECORATION_KINDS] });
    const renderer = await renderScene(<HomeDecorations />);
    await renderer.advanceFrames(2, 1 / 60);

    for (const kind of HOME_DECORATION_KINDS) {
      expect(gruposPorNome(renderer, kind), kind).toHaveLength(1);
    }

    await renderer.unmount();
  });
});
