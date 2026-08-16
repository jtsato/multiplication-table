import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JOYSTICK_DEADZONE,
  KEY_BINDINGS,
  applyDeadzone,
  emitAction,
  joystickVector,
  resetTouchAxes,
  subscribeAction,
  touchAxes,
} from './input';

describe('joystickVector', () => {
  const centro = { x: 100, y: 100 };
  const raio = 50;

  it('devolve zero com o dedo exatamente no centro', () => {
    expect(joystickVector(centro, centro, raio)).toEqual({ x: 0, z: 0, magnitude: 0 });
  });

  it('empurrar para cima anda para frente (-Z)', () => {
    // Y da tela cresce para baixo, entao "para cima" e y menor.
    const v = joystickVector(centro, { x: 100, y: 50 }, raio);
    expect(v.z).toBeCloseTo(-1);
    expect(v.x).toBeCloseTo(0);
  });

  it('empurrar para baixo anda para tras (+Z)', () => {
    expect(joystickVector(centro, { x: 100, y: 150 }, raio).z).toBeCloseTo(1);
  });

  it('empurrar para a direita anda para +X', () => {
    const v = joystickVector(centro, { x: 150, y: 100 }, raio);
    expect(v.x).toBeCloseTo(1);
    expect(v.z).toBeCloseTo(0);
  });

  it('nunca passa de magnitude 1, por mais longe que o dedo va', () => {
    const v = joystickVector(centro, { x: 900, y: 900 }, raio);
    expect(v.magnitude).toBeCloseTo(1);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(1);
  });

  it('a diagonal nao anda mais rapido que a reta', () => {
    const reta = joystickVector(centro, { x: 100, y: 40 }, raio);
    const diagonal = joystickVector(centro, { x: 160, y: 40 }, raio);
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeLessThanOrEqual(
      Math.hypot(reta.x, reta.z) + 1e-9,
    );
  });

  it('e analogico — meio caminho anda pela metade', () => {
    const v = joystickVector(centro, { x: 100, y: 75 }, raio);
    expect(v.magnitude).toBeCloseTo(0.5);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(0.5);
  });

  it('devolve zero com raio invalido em vez de dividir por zero', () => {
    expect(joystickVector(centro, { x: 150, y: 100 }, 0)).toEqual({ x: 0, z: 0, magnitude: 0 });
  });

  it('mantem magnitude coerente com as componentes em qualquer angulo', () => {
    for (let angulo = 0; angulo < Math.PI * 2; angulo += 0.3) {
      const ponto = {
        x: centro.x + Math.cos(angulo) * 30,
        y: centro.y + Math.sin(angulo) * 30,
      };
      const v = joystickVector(centro, ponto, raio);
      expect(Math.hypot(v.x, v.z)).toBeCloseTo(v.magnitude);
    }
  });
});

describe('applyDeadzone', () => {
  it('zera toques minimos — o dedo apoiado nao pode fazer o jogador derivar', () => {
    const leve = joystickVector({ x: 0, y: 0 }, { x: 2, y: 0 }, 100);
    expect(applyDeadzone(leve)).toEqual({ x: 0, z: 0, magnitude: 0 });
  });

  it('preserva o vetor acima da zona morta', () => {
    const forte = joystickVector({ x: 0, y: 0 }, { x: 80, y: 0 }, 100);
    expect(applyDeadzone(forte)).toBe(forte);
  });

  it('trata a borda exata da zona morta como parado', () => {
    const naBorda = { x: JOYSTICK_DEADZONE, z: 0, magnitude: JOYSTICK_DEADZONE };
    expect(applyDeadzone(naBorda).magnitude).toBe(0);
  });
});

describe('acoes do jogo', () => {
  beforeEach(() => {
    resetTouchAxes();
  });

  it('entrega a acao a quem estiver escutando', () => {
    const ouvinte = vi.fn();
    const cancelar = subscribeAction('interagir', ouvinte);

    emitAction('interagir');

    expect(ouvinte).toHaveBeenCalledTimes(1);
    cancelar();
  });

  it('nao entrega a acao errada', () => {
    const ouvinte = vi.fn();
    const cancelar = subscribeAction('interagir', ouvinte);

    emitAction('cancelar');

    expect(ouvinte).not.toHaveBeenCalled();
    cancelar();
  });

  it('para de entregar depois de cancelar a inscricao', () => {
    const ouvinte = vi.fn();
    subscribeAction('confirmar', ouvinte)();

    emitAction('confirmar');

    expect(ouvinte).not.toHaveBeenCalled();
  });

  it('emitir sem ninguem escutando nao quebra', () => {
    expect(() => emitAction('responder-1')).not.toThrow();
  });

  it('entrega a todos os inscritos na mesma acao', () => {
    const a = vi.fn();
    const b = vi.fn();
    const cancelarA = subscribeAction('cancelar', a);
    const cancelarB = subscribeAction('cancelar', b);

    emitAction('cancelar');

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    cancelarA();
    cancelarB();
  });
});

describe('KEY_BINDINGS', () => {
  it('cobre as tres alternativas do desafio', () => {
    expect(KEY_BINDINGS.Digit1).toBe('responder-1');
    expect(KEY_BINDINGS.Digit2).toBe('responder-2');
    expect(KEY_BINDINGS.Digit3).toBe('responder-3');
  });

  it('nao usa as teclas de movimento nem as de camera', () => {
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowLeft', 'ArrowRight']) {
      expect(KEY_BINDINGS[code]).toBeUndefined();
    }
  });

  it('mapeia cada tecla para uma acao unica', () => {
    const acoes = Object.values(KEY_BINDINGS);
    expect(new Set(acoes).size).toBe(acoes.length);
  });
});

describe('touchAxes', () => {
  it('comeca zerado e volta a zero no reset', () => {
    touchAxes.x = 0.8;
    touchAxes.z = -0.4;
    resetTouchAxes();
    expect(touchAxes).toEqual({ x: 0, z: 0 });
  });
});
