import { describe, expect, it } from 'vitest';
import { WHALE, whaleHeight, whaleIsSpouting, whaleMidWindow, whaleState } from './whale.logic';

describe('a baleia', () => {
  it('fica escondida fora da janela', () => {
    expect(whaleState(0).active).toBe(false);
    expect(whaleState(WHALE.windowStart - 1).active).toBe(false);
    expect(whaleState(WHALE.windowEnd + 1).active).toBe(false);
  });

  it('aparece dentro da janela, com progresso crescendo', () => {
    const inicio = whaleState(WHALE.windowStart + 1);
    const meio = whaleState(whaleMidWindow());
    const fim = whaleState(WHALE.windowEnd - 1);

    expect(inicio.active).toBe(true);
    expect(meio.active).toBe(true);
    expect(fim.active).toBe(true);
    expect(meio.progress).toBeCloseTo(0.5);
    expect(fim.progress).toBeGreaterThan(inicio.progress);
  });

  it('sobe na primeira metade e mergulha na segunda', () => {
    const inicio = whaleState(whaleMidWindow() - 5);
    const meio = whaleState(whaleMidWindow());
    const fim = whaleState(whaleMidWindow() + 5);

    expect(whaleHeight(meio)).toBeGreaterThan(whaleHeight(inicio));
    expect(whaleHeight(meio)).toBeGreaterThan(whaleHeight(fim));
    expect(whaleHeight(meio)).toBeCloseTo(WHALE.riseHeight);
  });

  it('o esguicho so existe no meio da janela', () => {
    expect(whaleIsSpouting(whaleState(WHALE.windowStart + 1))).toBe(false);
    expect(whaleIsSpouting(whaleState(whaleMidWindow()))).toBe(true);
    expect(whaleIsSpouting(whaleState(WHALE.windowEnd - 1))).toBe(false);
  });
});
