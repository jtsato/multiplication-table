import { describe, expect, it } from 'vitest';
import type { Object3D } from 'three';
import { renderScene } from '../../test/sceneHarness';
import { WaterfallView } from './WaterfallView';
import { WATERFALL, WATERFALLS } from './waterfalls.logic';

/** Todas as malhas da cena da cachoeira. */
function gotasNaCena(scene: { findAllByType: (t: string) => { instance: unknown }[] }) {
  return scene.findAllByType('Mesh').map((n) => n.instance as Object3D);
}

describe('WaterfallView', () => {
  it('desenha uma gota para cada posicao de cada queda', async () => {
    const renderer = await renderScene(<WaterfallView />);

    const gotas = gotasNaCena(renderer.scene);
    expect(gotas.length).toBeGreaterThanOrEqual(WATERFALLS.length * WATERFALL.droplets);

    await renderer.unmount();
  });

  /**
   * O teste que importa: as gotas tem que **preencher a queda**, de cima a
   * baixo. Uma cortina que existe so no fim do laco nao le como cachoeira — le
   * como duas lajotas boiando, que foi exatamente o que apareceu na tela.
   */
  it('espalha as gotas ao longo de todo o desnivel', async () => {
    const renderer = await renderScene(<WaterfallView />);

    const alturas = gotasNaCena(renderer.scene).map((o) => o.position.y);
    const queda = WATERFALLS[0];
    const alturaTotal = queda.topY - queda.bottomY;

    const dentro = alturas.filter((y) => y <= queda.topY + 0.01 && y >= queda.bottomY - 0.01);
    expect(dentro.length).toBeGreaterThan(0);

    // O terco de cima e o terco de baixo tem que ter gota.
    const acima = dentro.filter((y) => y > queda.topY - alturaTotal / 3);
    const abaixo = dentro.filter((y) => y < queda.bottomY + alturaTotal / 3);
    expect(acima.length, 'nenhuma gota no terco de cima').toBeGreaterThan(0);
    expect(abaixo.length, 'nenhuma gota no terco de baixo').toBeGreaterThan(0);

    await renderer.unmount();
  });

  it('a cortina fica na beira da regiao, e nao no centro dela', async () => {
    const renderer = await renderScene(<WaterfallView />);

    const posicoes = gotasNaCena(renderer.scene).map((o) => ({ x: o.position.x, z: o.position.z }));
    for (const queda of WATERFALLS) {
      const naQueda = posicoes.filter(
        (p) => Math.hypot(p.x - queda.x, p.z - queda.z) < WATERFALL.width,
      );
      expect(naQueda.length, `nenhuma gota em ${queda.id}`).toBeGreaterThan(0);
    }

    await renderer.unmount();
  });
});
