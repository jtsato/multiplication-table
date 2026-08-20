import { describe, expect, it } from 'vitest';
import { renderScene } from '../../test/sceneHarness';
import { WorldView } from './WorldView';

/**
 * Smoke test do grafo de cena.
 *
 * Cobre o que o TypeScript nao cobre e que, sem isto, so apareceria abrindo o
 * navegador: que a arvore monta de fato, que as luzes existem e que o cenario
 * instanciado e reproduzivel a partir da semente.
 */
describe('WorldView', () => {
  it('monta a ilha e o cenario sem lancar', async () => {
    const renderer = await renderScene(<WorldView seed={20260816} />);

    // Mar, faixa de areia e o disco de terra, no minimo.
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(3);

    await renderer.unmount();
  });

  it('nao traz luz nenhuma — a iluminacao pertence ao ciclo dia/noite', async () => {
    const renderer = await renderScene(<WorldView seed={1} />);

    expect(renderer.scene.findAllByType('HemisphereLight')).toHaveLength(0);
    expect(renderer.scene.findAllByType('DirectionalLight')).toHaveLength(0);

    await renderer.unmount();
  });

  it('recria o mesmo cenario para a mesma semente', async () => {
    const countFor = async (seed: number) => {
      const renderer = await renderScene(<WorldView seed={seed} />);
      const count = renderer.scene.findAllByType('Mesh').length;
      await renderer.unmount();
      return count;
    };

    const [first, second] = [await countFor(4242), await countFor(4242)];
    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(3);
  });

  it('planta uma placa de navegação em cada região', async () => {
    const renderer = await renderScene(<WorldView seed={20260816} />);

    const nomes = renderer.scene
      .findAllByType('Group')
      .map((no) => no.instance as unknown as { name: string })
      .map((grupo) => grupo.name);
    for (const id of ['praia', 'porto', 'bosque', 'cachoeira', 'pomar', 'pico']) {
      expect(nomes).toContain(`placa-${id}`);
    }

    await renderer.unmount();
  });
});
