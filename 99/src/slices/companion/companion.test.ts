import { describe, expect, it } from 'vitest';
import { vec3 } from '../../shared/vec';
import { PET, petAnchor, petFollow, petRestAmount, sniffAngle, stepToward } from './companion.logic';

describe('stepToward', () => {
  it('nunca ultrapassa o alvo, mesmo com passo maior que a distancia', () => {
    const saida = stepToward(vec3(0, 0, 0), vec3(10, 0, 0), 100);

    expect(saida.x).toBe(10);
    expect(saida.z).toBe(0);
  });

  it('anda exatamente o passo quando o alvo esta longe', () => {
    const saida = stepToward(vec3(0, 0, 0), vec3(10, 0, 0), 3);

    expect(saida.x).toBe(3);
  });

  it('preserva a altura atual', () => {
    const saida = stepToward(vec3(0, 7, 0), vec3(10, 0, 0), 2);

    expect(saida.y).toBe(7);
  });
});

describe('petFollow', () => {
  it('o pet se acomoda atras do jogador e nao o ultrapassa', () => {
    const jogador = vec3(0, 0, 0);
    const ancora = petAnchor(jogador, 0);

    // Um passo enorme chega exatamente na ancora, nunca alem dela.
    const saida = petFollow(vec3(-10, 0, 0), jogador, 0, 100);

    expect(saida.x).toBeCloseTo(ancora.x);
    expect(saida.z).toBeCloseTo(ancora.z);
  });

  it('a ancora fica a `followDistance` atras do jogador', () => {
    const ancora = petAnchor(vec3(0, 0, 0), 0);

    expect(Math.hypot(ancora.x, ancora.z)).toBeCloseTo(PET.followDistance);
    // Com yaw 0, a frente e -Z, entao atras e +Z.
    expect(ancora.z).toBeGreaterThan(0);
  });

  it('com o pet ja na ancora, ele nao se mexe', () => {
    const jogador = vec3(0, 0, 0);
    const ancora = petAnchor(jogador, 0);

    const saida = petFollow(ancora, jogador, 0, 1 / 60);

    expect(saida.x).toBeCloseTo(ancora.x);
    expect(saida.z).toBeCloseTo(ancora.z);
  });
});

describe('sniffAngle', () => {
  it('aponta para o leste quando o no esta a leste', () => {
    expect(sniffAngle(vec3(0, 0, 0), vec3(1, 0, 0))).toBeCloseTo(Math.PI / 2);
  });

  it('aponta para a frente (+Z) quando o no esta adiante do pet', () => {
    expect(sniffAngle(vec3(0, 0, 0), vec3(0, 0, 1))).toBeCloseTo(0);
  });
});

describe('petRestAmount', () => {
  it('começa em zero e sobe até 1 com o tempo parado', () => {
    expect(petRestAmount(0)).toBe(0);
    expect(petRestAmount(PET.idleRestSeconds / 2)).toBeCloseTo(0.5);
    expect(petRestAmount(PET.idleRestSeconds)).toBe(1);
    expect(petRestAmount(PET.idleRestSeconds * 2)).toBe(1);
  });

  it('nunca fica negativa', () => {
    expect(petRestAmount(-1)).toBe(0);
  });
});
