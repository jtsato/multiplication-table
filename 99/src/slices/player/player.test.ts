import { describe, expect, it } from 'vitest';
import {
  PLAYER,
  axesToDirection,
  facingAngle,
  followCameraTarget,
  inputToDirection,
  lerpAngle,
  smoothingFactor,
  type MoveInput,
} from './player.logic';
import { vec3 } from '../../shared/vec';

const NONE: MoveInput = { forward: false, back: false, left: false, right: false };
const input = (partial: Partial<MoveInput>): MoveInput => ({ ...NONE, ...partial });

describe('inputToDirection', () => {
  it('devolve vetor zero quando nenhuma tecla esta pressionada', () => {
    expect(inputToDirection(NONE, 0)).toEqual(vec3());
  });

  it('anda para -Z quando o yaw e zero (fundo da tela)', () => {
    const dir = inputToDirection(input({ forward: true }), 0);
    expect(dir.x).toBeCloseTo(0);
    expect(dir.z).toBeCloseTo(-1);
  });

  it('inverte a direcao ao andar para tras', () => {
    const dir = inputToDirection(input({ back: true }), 0);
    expect(dir.z).toBeCloseTo(1);
  });

  it('mapeia direita para +X quando o yaw e zero', () => {
    const dir = inputToDirection(input({ right: true }), 0);
    expect(dir.x).toBeCloseTo(1);
    expect(dir.z).toBeCloseTo(0);
  });

  it('normaliza a diagonal — andar em diagonal nao e mais rapido', () => {
    const dir = inputToDirection(input({ forward: true, right: true }), 0);
    expect(Math.hypot(dir.x, dir.z)).toBeCloseTo(1);
  });

  it('cancela teclas opostas', () => {
    expect(inputToDirection(input({ forward: true, back: true }), 0)).toEqual(vec3());
    expect(inputToDirection(input({ left: true, right: true }), 1.2)).toEqual(vec3());
  });

  it('gira o movimento junto com a camera', () => {
    // Com a camera girada 90 graus, "para frente" passa a apontar para -X.
    const dir = inputToDirection(input({ forward: true }), Math.PI / 2);
    expect(dir.x).toBeCloseTo(-1);
    expect(dir.z).toBeCloseTo(0);
  });

  it('mantem magnitude 1 para qualquer yaw', () => {
    for (let yaw = -Math.PI; yaw <= Math.PI; yaw += 0.3) {
      const dir = inputToDirection(input({ forward: true, left: true }), yaw);
      expect(Math.hypot(dir.x, dir.z)).toBeCloseTo(1);
    }
  });

  it('nunca produz componente vertical', () => {
    const dir = inputToDirection(input({ forward: true, right: true }), 0.7);
    expect(dir.y).toBe(0);
  });
});

describe('axesToDirection — caminho analogico do joystick', () => {
  it('devolve zero com os eixos zerados', () => {
    expect(axesToDirection(0, 0, 0)).toEqual(vec3());
  });

  it('concorda com o teclado na mesma direcao', () => {
    // Frente no joystick e z negativo, igual ao que o teclado produz.
    const teclado = inputToDirection(input({ forward: true }), 0.8);
    const analogico = axesToDirection(0, -1, 0.8);
    expect(analogico.x).toBeCloseTo(teclado.x);
    expect(analogico.z).toBeCloseTo(teclado.z);
  });

  it('preserva a intensidade — meio joystick anda pela metade', () => {
    const meio = axesToDirection(0, -0.5, 0);
    expect(Math.hypot(meio.x, meio.z)).toBeCloseTo(0.5);
  });

  it('limita a magnitude a 1 quando os eixos passam do circulo', () => {
    // Diagonal do teclado: (1, 1) tem magnitude 1.41.
    const diagonal = axesToDirection(1, 1, 0);
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1);
  });

  it('nunca produz componente vertical', () => {
    expect(axesToDirection(0.4, -0.7, 1.1).y).toBe(0);
  });

  it('gira junto com a camera preservando a intensidade', () => {
    for (let yaw = -Math.PI; yaw <= Math.PI; yaw += 0.4) {
      const direcao = axesToDirection(0.3, -0.4, yaw);
      expect(Math.hypot(direcao.x, direcao.z)).toBeCloseTo(0.5);
    }
  });
});

describe('followCameraTarget', () => {
  it('mantem exatamente a distancia pedida no plano XZ', () => {
    const player = vec3(3, 0, -4);
    for (let yaw = -Math.PI; yaw <= Math.PI; yaw += 0.4) {
      const target = followCameraTarget(player, yaw, 10, 5);
      expect(Math.hypot(target.x - player.x, target.z - player.z)).toBeCloseTo(10);
    }
  });

  it('fica acima do jogador pela altura pedida', () => {
    const target = followCameraTarget(vec3(0, 2, 0), 0, 10, 5);
    expect(target.y).toBeCloseTo(7);
  });

  it('posiciona a camera atras do jogador — no lado oposto ao movimento', () => {
    // Com yaw 0 o jogador anda para -Z, logo a camera deve ficar em +Z.
    const target = followCameraTarget(vec3(0, 0, 0), 0, 10, 5);
    expect(target.z).toBeCloseTo(10);
    expect(target.x).toBeCloseTo(0);
  });

  it('usa os valores padrao de PLAYER quando nao recebe distancia e altura', () => {
    const target = followCameraTarget(vec3(0, 0, 0), 0);
    expect(target.z).toBeCloseTo(PLAYER.cameraDistance);
    expect(target.y).toBeCloseTo(PLAYER.cameraHeight);
  });
});

describe('smoothingFactor', () => {
  it('fica entre 0 e 1', () => {
    for (const delta of [1 / 144, 1 / 60, 1 / 30, 0.5]) {
      const factor = smoothingFactor(PLAYER.cameraStiffness, delta);
      expect(factor).toBeGreaterThan(0);
      expect(factor).toBeLessThan(1);
    }
  });

  it('e zero quando nao passa tempo', () => {
    expect(smoothingFactor(8, 0)).toBe(0);
  });

  it('converge mais por quadro quanto maior o delta — independencia de framerate', () => {
    expect(smoothingFactor(8, 1 / 30)).toBeGreaterThan(smoothingFactor(8, 1 / 60));
  });

  it('dois passos de meio delta aproximam um passo inteiro', () => {
    const full = smoothingFactor(8, 1 / 30);
    const half = smoothingFactor(8, 1 / 60);
    // Aplicar duas vezes o fator de meio passo: 1 - (1-h)^2
    expect(1 - (1 - half) ** 2).toBeCloseTo(full, 10);
  });
});

describe('facingAngle', () => {
  it('devolve 0 olhando para +Z e PI/2 olhando para +X', () => {
    expect(facingAngle(vec3(0, 0, 1))).toBeCloseTo(0);
    expect(facingAngle(vec3(1, 0, 0))).toBeCloseTo(Math.PI / 2);
  });
});

describe('lerpAngle', () => {
  it('interpola pelo caminho curto ao cruzar PI', () => {
    // De 170 graus para -170 graus sao 20 graus pela direita, nao 340 pela esquerda.
    const from = (170 * Math.PI) / 180;
    const to = (-170 * Math.PI) / 180;
    const mid = lerpAngle(from, to, 0.5);
    expect(Math.abs(mid)).toBeCloseTo(Math.PI, 2);
  });

  it('devolve a origem com t=0 e o destino com t=1', () => {
    expect(lerpAngle(0.3, 1.2, 0)).toBeCloseTo(0.3);
    expect(lerpAngle(0.3, 1.2, 1)).toBeCloseTo(1.2);
  });

  it('nunca da uma volta maior que meia circunferencia em um passo', () => {
    for (let from = -Math.PI; from < Math.PI; from += 0.5) {
      for (let to = -Math.PI; to < Math.PI; to += 0.5) {
        expect(Math.abs(lerpAngle(from, to, 1) - from)).toBeLessThanOrEqual(Math.PI + 1e-9);
      }
    }
  });
});
