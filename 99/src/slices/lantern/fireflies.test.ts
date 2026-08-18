import { beforeEach, describe, expect, it } from 'vitest';
import {
  FIREFLY,
  createSwarms,
  firefliesAreOut,
  motePosition,
  swarmAt,
  swarmCount,
} from './fireflies.logic';
import { LANTERN, chargeRemaining, lanternChargeSeconds } from './lantern.logic';
import { REGIONS, regionAt } from '../regions/regions.logic';
import { useGameStore } from '../../app/store';
import { createRng } from '../../shared/rng';
import { vec3 } from '../../shared/vec';

const state = () => useGameStore.getState();

describe('onde nascem os enxames', () => {
  it('espalha dois por regiao, todos em terra firme', () => {
    const enxames = createSwarms(createRng(3));
    expect(enxames).toHaveLength(swarmCount());
    expect(enxames).toHaveLength(REGIONS.length * FIREFLY.perRegion);

    for (const enxame of enxames) {
      expect(regionAt(enxame.position), enxame.id).not.toBeNull();
    }
  });

  it('toda regiao recebe socorro — nenhuma fica sem enxame', () => {
    const enxames = createSwarms(createRng(9));
    for (const regiao of REGIONS) {
      const daRegiao = enxames.filter((e) => regionAt(e.position)?.id === regiao.id);
      expect(daRegiao.length, `${regiao.id} sem vaga-lume`).toBeGreaterThan(0);
    }
  });

  it('e reprodutivel para a mesma semente', () => {
    expect(createSwarms(createRng(42))).toEqual(createSwarms(createRng(42)));
  });

  it('ids unicos', () => {
    const enxames = createSwarms(createRng(11));
    expect(new Set(enxames.map((e) => e.id)).size).toBe(enxames.length);
  });
});

describe('firefliesAreOut', () => {
  /**
   * So a noite, e isso importa para a economia do jogo: liberar a recarga de dia
   * esvaziaria a fogueira, que e onde a conta acontece.
   */
  it('so aparece de noite', () => {
    expect(firefliesAreOut('noite')).toBe(true);
    expect(firefliesAreOut('dia')).toBe(false);
    expect(firefliesAreOut('entardecer')).toBe(false);
    expect(firefliesAreOut('amanhecer')).toBe(false);
  });
});

describe('swarmAt', () => {
  const enxames = [{ id: 'a', position: vec3(10, 0, 10) }];

  it('reconhece quem esta dentro do alcance', () => {
    expect(swarmAt(vec3(10, 0, 10), enxames)?.id).toBe('a');
    expect(swarmAt(vec3(10 + FIREFLY.radius - 0.1, 0, 10), enxames)?.id).toBe('a');
  });

  it('devolve null fora do alcance', () => {
    expect(swarmAt(vec3(10 + FIREFLY.radius + 0.5, 0, 10), enxames)).toBeNull();
  });

  it('ignora a altura — o enxame paira sobre o chao', () => {
    expect(swarmAt(vec3(10, 40, 10), enxames)?.id).toBe('a');
  });
});

describe('motePosition', () => {
  const origem = vec3(0, 0, 0);

  it('mantem os pontinhos em volta do enxame', () => {
    for (let t = 0; t < 30; t += 0.4) {
      for (let i = 0; i < FIREFLY.motes; i += 1) {
        const p = motePosition(t, i, origem);
        expect(Math.hypot(p.x, p.z)).toBeLessThanOrEqual(FIREFLY.spread + 1e-9);
        expect(p.y).toBeGreaterThan(0);
      }
    }
  });

  it('nao amontoa todos no mesmo ponto', () => {
    const pontos = Array.from({ length: FIREFLY.motes }, (_, i) => motePosition(0, i, origem));
    const chaves = pontos.map((p) => `${p.x.toFixed(3)}|${p.z.toFixed(3)}`);
    expect(new Set(chaves).size).toBe(FIREFLY.motes);
  });

  /** Mesmo motivo da cachoeira: a posicao vem do relogio, nao de somar delta. */
  it('nao acumula deriva ao longo do tempo', () => {
    const periodo = 1 / FIREFLY.drift;
    const referencia = motePosition(periodo * 0.31, 0, origem);
    for (let volta = 1; volta <= 300; volta += 1) {
      const agora = motePosition(periodo * 0.31 + volta * periodo, 0, origem);
      expect(agora.x).toBeCloseTo(referencia.x, 3);
      expect(agora.z).toBeCloseTo(referencia.z, 3);
    }
  });
});

describe('o enxame enche a lanterna', () => {
  const AGORA = 100;

  beforeEach(() => {
    state().resetLantern();
    state().resetEconomy();
  });

  it('encostar recarrega sem pedir conta nenhuma', () => {
    state().keepLanternTopped(AGORA, 1);

    expect(chargeRemaining(state().lantern, AGORA)).toBeGreaterThan(0);
    // O ponto da mecanica: nenhum desafio foi aberto.
    expect(state().activeChallenge).toBeNull();
  });

  it('nunca passa do teto de carga', () => {
    const cheia = lanternChargeSeconds(false);
    for (let i = 0; i < 500; i += 1) state().keepLanternTopped(AGORA, 1);

    expect(chargeRemaining(state().lantern, AGORA)).toBeLessThanOrEqual(cheia);
    expect(chargeRemaining(state().lantern, AGORA)).toBe(cheia);
  });

  it('a lanterna melhorada tem teto maior, e o enxame respeita os dois', () => {
    useGameStore.setState({ owned: ['lanterna-maior'] });
    for (let i = 0; i < 500; i += 1) state().keepLanternTopped(AGORA, 1);

    expect(chargeRemaining(state().lantern, AGORA)).toBe(LANTERN.upgradedChargeSeconds);
  });
});
