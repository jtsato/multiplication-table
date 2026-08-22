import { describe, expect, it } from 'vitest';
import { vec3 } from '../../shared/vec';
import {
  AMBIENT,
  birdOffset,
  createAmbient,
  fleeVector,
  flutterOffset,
} from './ambient.logic';

describe('createAmbient', () => {
  it('gera borboletas e pássaros para todas as regiões', () => {
    const criaturas = createAmbient(42);
    const borboletas = criaturas.filter((c) => c.kind === 'borboleta');
    const passaros = criaturas.filter((c) => c.kind === 'passaro');

    expect(borboletas.length).toBe(9 * AMBIENT.butterfliesPerRegion);
    expect(passaros.length).toBe(9 * AMBIENT.birdsPerRegion);
    expect(criaturas.length).toBe(borboletas.length + passaros.length);
  });

  it('é determinística para a mesma semente', () => {
    expect(createAmbient(7)).toEqual(createAmbient(7));
  });
});

describe('flutterOffset', () => {
  it('mantém a borboleta perto da âncora', () => {
    for (let t = 0; t < 10; t += 0.5) {
      const offset = flutterOffset(3, t);
      expect(Math.hypot(offset.x, offset.z)).toBeLessThanOrEqual(AMBIENT.flutterRadius + 0.001);
    }
  });

  it('nunca leva a borboleta para baixo do chão', () => {
    const offset = flutterOffset(3, 0);
    expect(offset.y).toBeGreaterThanOrEqual(0);
  });
});

describe('fleeVector', () => {
  it('longe do jogador, não foge', () => {
    const flee = fleeVector(vec3(10, 0, 10), vec3(0, 0, 0));
    expect(flee.x).toBe(0);
    expect(flee.z).toBe(0);
  });

  it('perto do jogador, empurra para longe', () => {
    const ancora = vec3(1, 0, 0);
    const flee = fleeVector(ancora, vec3(0, 0, 0));
    expect(flee.x).toBeGreaterThan(0);
  });
});

describe('birdOffset', () => {
  it('circula num raio fixo e numa altura positiva', () => {
    const offset = birdOffset(5, 2);
    expect(Math.hypot(offset.x, offset.z)).toBeCloseTo(AMBIENT.birdRadius, 5);
    expect(offset.y).toBeGreaterThan(-1);
  });
});
