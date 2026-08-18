import { describe, expect, it } from 'vitest';
import {
  LANTERN,
  chargeRemaining,
  isGlowing,
  lanternIntensity,
  rechargeUntil,
  type Lantern,
} from './lantern.logic';

const apagada: Lantern = { chargedUntil: 0 };

describe('chargeRemaining', () => {
  it('conta o que falta ate o prazo', () => {
    expect(chargeRemaining({ chargedUntil: 100 }, 70)).toBe(30);
  });

  it('nunca e negativo', () => {
    expect(chargeRemaining({ chargedUntil: 100 }, 180)).toBe(0);
  });
});

describe('isGlowing', () => {
  it('acesa enquanto ha carga', () => {
    expect(isGlowing({ chargedUntil: 100 }, 99)).toBe(true);
  });

  it('apagada no instante em que a carga acaba', () => {
    expect(isGlowing({ chargedUntil: 100 }, 100)).toBe(false);
  });
});

describe('rechargeUntil', () => {
  it('o acerto rende uma carga inteira', () => {
    expect(rechargeUntil(apagada, 10, 1)).toBe(10 + LANTERN.chargeSeconds);
  });

  it('o erro rende uma fracao da carga, e nao zero', () => {
    const prazo = rechargeUntil(apagada, 10, 0.25);
    expect(prazo).toBeGreaterThan(10);
    expect(prazo).toBeLessThan(10 + LANTERN.chargeSeconds);
  });

  it('recarregar cedo soma ao que restava', () => {
    const meia: Lantern = { chargedUntil: 40 };
    expect(rechargeUntil(meia, 10, 1)).toBe(10 + 30 + LANTERN.chargeSeconds);
  });

  it('nao passa do teto de duas cargas', () => {
    const cheia: Lantern = { chargedUntil: 10 + LANTERN.chargeSeconds * LANTERN.maxCharges };
    expect(rechargeUntil(cheia, 10, 1)).toBe(10 + LANTERN.chargeSeconds * LANTERN.maxCharges);
  });

  it('ignora proporcao fora de 0 a 1', () => {
    expect(rechargeUntil(apagada, 10, 5)).toBe(10 + LANTERN.chargeSeconds);
    expect(rechargeUntil(apagada, 10, -3)).toBe(10);
  });
});

describe('lanternIntensity', () => {
  it('e zero sem carga', () => {
    expect(lanternIntensity(apagada, 10)).toBe(0);
  });

  it('esmaece no fim da carga em vez de apagar de uma vez', () => {
    const fim: Lantern = { chargedUntil: 10 + LANTERN.lowChargeSeconds / 2 };
    const cheia: Lantern = { chargedUntil: 10 + LANTERN.chargeSeconds };
    const fraca = lanternIntensity(fim, 10);

    expect(fraca).toBeGreaterThan(0);
    expect(fraca).toBeLessThan(lanternIntensity(cheia, 10));
  });

  it('fica estavel enquanto a carga esta acima do aviso', () => {
    const cheia: Lantern = { chargedUntil: 10 + LANTERN.chargeSeconds };
    const meia: Lantern = { chargedUntil: 10 + LANTERN.lowChargeSeconds + 1 };

    expect(lanternIntensity(meia, 10)).toBe(lanternIntensity(cheia, 10));
  });
});
