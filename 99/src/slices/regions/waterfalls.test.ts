import { describe, expect, it } from 'vitest';
import { WATERFALLS, WATERFALL, dropletHeight, waterfallsFor } from './waterfalls.logic';
import { REGIONS, regionById } from './regions.logic';

describe('onde caem as cachoeiras', () => {
  it('so existe cachoeira onde ha desnivel de verdade', () => {
    for (const queda of WATERFALLS) {
      expect(queda.topY).toBeGreaterThan(queda.bottomY + WATERFALL.minDrop - 1e-9);
    }
  });

  /**
   * A cachoeira e a explicacao visual do desnivel. Uma regiao alta sem queda
   * nenhuma parece um degrau sem motivo; por isso toda regiao acima do minimo
   * ganha a sua.
   */
  it('toda regiao alta o bastante tem cachoeira', () => {
    for (const regiao of REGIONS) {
      const alta = regiao.groundY - WATERFALL.seaLevel >= WATERFALL.minDrop;
      expect(waterfallsFor(regiao.id).length > 0, `${regiao.id}`).toBe(alta);
    }
  });

  it('a praia e o porto ficam sem cachoeira — estao no nivel do mar', () => {
    expect(waterfallsFor('praia')).toEqual([]);
    expect(waterfallsFor('porto')).toEqual([]);
  });

  it('a queda nasce na beira da regiao dela', () => {
    for (const queda of WATERFALLS) {
      const regiao = regionById(queda.region);
      const distancia = Math.hypot(queda.x - regiao.center.x, queda.z - regiao.center.z);
      expect(distancia).toBeCloseTo(regiao.radius);
    }
  });

  it('cai do chao da regiao ate abaixo do mar', () => {
    for (const queda of WATERFALLS) {
      expect(queda.topY).toBe(regionById(queda.region).groundY);
      expect(queda.bottomY).toBeLessThanOrEqual(WATERFALL.seaLevel);
    }
  });
});

describe('dropletHeight', () => {
  const queda = () => WATERFALLS[0];

  it('mantem toda gota dentro da queda', () => {
    const { topY, bottomY } = queda();
    for (let t = 0; t < 40; t += 0.37) {
      for (let i = 0; i < WATERFALL.droplets; i += 1) {
        const y = dropletHeight(t, i, topY, bottomY);
        expect(y).toBeLessThanOrEqual(topY + 1e-9);
        expect(y).toBeGreaterThanOrEqual(bottomY - 1e-9);
      }
    }
  });

  it('desce com o tempo', () => {
    const { topY, bottomY } = queda();
    const antes = dropletHeight(0, 0, topY, bottomY);
    const depois = dropletHeight(0.1, 0, topY, bottomY);
    expect(depois).toBeLessThan(antes);
  });

  it('espalha as gotas ao longo da queda, sem amontoar', () => {
    const { topY, bottomY } = queda();
    const alturas = Array.from({ length: WATERFALL.droplets }, (_, i) =>
      dropletHeight(0, i, topY, bottomY),
    );
    expect(new Set(alturas.map((y) => y.toFixed(3))).size).toBe(WATERFALL.droplets);
  });

  /**
   * O laco vem do relogio por modulo, e nao de somar delta a cada quadro.
   *
   * Somando, o menor erro de ponto flutuante se acumula e depois de alguns
   * minutos as gotas saem da queda — um defeito que nenhum teste curto pega e
   * que so aparece para quem deixou o jogo aberto. Aqui, a posicao no instante
   * `t` e sempre a mesma, tenha o jogo rodado um segundo ou uma hora.
   */
  it('nao acumula deriva: a mesma hora do laco da sempre a mesma altura', () => {
    const { topY, bottomY } = queda();
    const periodo = (topY - bottomY) / WATERFALL.speed;

    // Medido no meio da volta, e nao na fronteira dela: exatamente no fecho do
    // laco o topo e a base sao o mesmo instante do ciclo, e qual dos dois sai
    // depende do ultimo bit do ponto flutuante. A ambiguidade e do teste, nao um
    // defeito da queda.
    const meio = periodo * 0.37;
    const referencia = dropletHeight(meio, 0, topY, bottomY);

    for (let volta = 1; volta <= 500; volta += 1) {
      expect(dropletHeight(meio + volta * periodo, 0, topY, bottomY)).toBeCloseTo(referencia, 4);
    }
  });

  it('a gota que chega embaixo reaparece em cima', () => {
    const { topY, bottomY } = queda();
    const periodo = (topY - bottomY) / WATERFALL.speed;
    // Um instante antes de fechar a volta esta la embaixo; logo depois, no topo.
    expect(dropletHeight(periodo - 0.01, 0, topY, bottomY)).toBeLessThan(bottomY + 0.5);
    expect(dropletHeight(0.01, 0, topY, bottomY)).toBeGreaterThan(topY - 0.5);
  });
});
