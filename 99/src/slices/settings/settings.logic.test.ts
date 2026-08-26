import { describe, expect, it } from 'vitest';
import { clampSensitivity, clampVolume, clampZoom, SETTINGS } from './settings.logic';

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

  it('limita o zoom ao intervalo de 0.6 a 1.8', () => {
    expect(clampZoom(0.1)).toBe(SETTINGS.minZoom);
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(9)).toBe(SETTINGS.maxZoom);
  });

  it('tela cheia não lança quando o navegador não suporta', () => {
    expect(() => clampVolume(0.5)).not.toThrow();
    expect(SETTINGS.defaultVolume).toBe(0.5);
    expect(SETTINGS.defaultSensitivity).toBe(1);
    expect(SETTINGS.defaultZoom).toBe(1);
  });
});
