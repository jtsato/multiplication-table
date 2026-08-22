import { beforeEach, describe, expect, it } from 'vitest';
import { currentFps, resetFps, tickFps } from './fps';

describe('fps', () => {
  beforeEach(() => {
    resetFps();
  });

  it('calcula FPS a partir do intervalo medido', () => {
    // 60 quadros começando em t=1000 e terminando exatamente em t=2000.
    for (let i = 0; i < 60; i += 1) {
      tickFps(1000 + i * (1000 / 59));
    }
    expect(currentFps()).toBe(60);
  });

  it('não atualiza antes de fechar a janela de 1 segundo', () => {
    tickFps(1000);
    tickFps(1100);
    expect(currentFps()).toBe(0);
  });

  it('reinicia com resetFps', () => {
    tickFps(1000);
    tickFps(2000);
    expect(currentFps()).toBe(2);
    resetFps();
    expect(currentFps()).toBe(0);
  });
});
