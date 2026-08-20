import { describe, expect, it } from 'vitest';
import { vec3 } from '../../shared/vec';
import { createWindTufts, tuftPose, WIND } from './wind.logic';

describe('createWindTufts', () => {
  it('gera seis tufos por região, determinísticos', () => {
    expect(createWindTufts(42)).toHaveLength(6 * WIND.tuftsPerRegion);
    expect(createWindTufts(42)).toEqual(createWindTufts(42));
  });
});

describe('tuftPose', () => {
  it('longe do jogador, só balança com o vento e mantém a altura', () => {
    const pose = tuftPose(vec3(0, 0, 0), vec3(10, 0, 10), 1, 5);
    expect(pose.scaleY).toBe(1);
    expect(Math.abs(pose.rotationX)).toBeLessThan(0.1);
    expect(Math.abs(pose.rotationZ)).toBeLessThan(0.1);
  });

  it('perto do jogador, dobra para o lado oposto e encolhe um pouco', () => {
    // Jogador a leste do tufo: ele deve dobrar para oeste (rotação negativa em X).
    const pose = tuftPose(vec3(0, 0, 0), vec3(0.5, 0, 0), 0, 0);
    expect(pose.scaleY).toBeLessThan(1);
    expect(Math.abs(pose.rotationX)).toBeGreaterThan(0.1);
  });

  it('a dobra é mais forte quanto mais perto o jogador está', () => {
    const perto = tuftPose(vec3(0, 0, 0), vec3(0.3, 0, 0), 0, 0);
    const meio = tuftPose(vec3(0, 0, 0), vec3(0.9, 0, 0), 0, 0);
    expect(Math.hypot(perto.rotationX, perto.rotationZ)).toBeGreaterThan(
      Math.hypot(meio.rotationX, meio.rotationZ),
    );
  });
});
