import { describe, expect, it } from 'vitest';
import { clampSensitivity, clampVolume, SETTINGS } from './settings.logic';

describe('settings.logic', () => {
  it('limita o volume ao intervalo de 0 a 1', () => {
    expect(clampVolume(-0.5)).toBe(0);
    expect(clampVolume(0.3)).toBe(0.3);
    expect(clampVolume(1.5)).toBe(1);
  });

  it('limita a sensibilidade ao intervalo de 0.5 a 2', () => {
    expect(clampSensitivity(0.1)).toBe(SETTINGS.minSensitivity);
    expect(clampSensitivity(1)).toBe(1);
    expect(clampSensitivity(9)).toBe(SETTINGS.maxSensitivity);
  });

  it('tela cheia não lança quando o navegador não suporta', () => {
    expect(() => clampVolume(0.5)).not.toThrow();
    expect(SETTINGS.defaultVolume).toBe(0.5);
    expect(SETTINGS.defaultSensitivity).toBe(1);
  });
});
