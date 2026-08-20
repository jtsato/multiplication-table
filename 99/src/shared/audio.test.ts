import { describe, expect, it } from 'vitest';
import { SOUND_PRESETS, playSound, setAudioEnabled, unlockAudio } from './audio';

describe('SOUND_PRESETS', () => {
  it('o acerto é um xilofone ascendente, com pelo menos três notas', () => {
    const frequencias = SOUND_PRESETS.correct.tones.map((tom) => tom.frequency);
    expect(frequencias.length).toBeGreaterThanOrEqual(3);
    expect([...frequencias].sort((a, b) => a - b)).toEqual(frequencias);
  });

  it('o erro desce de tom e é mais grave que o acerto', () => {
    const erro = SOUND_PRESETS.wrong.tones.map((tom) => tom.frequency);
    expect(erro.length).toBeGreaterThanOrEqual(2);
    expect(erro[0]).toBeGreaterThan(erro[erro.length - 1]);
    expect(erro[erro.length - 1]).toBeLessThan(SOUND_PRESETS.correct.tones[0].frequency);
  });

  it('cada superfície de passo tem ruído filtrado próprio', () => {
    for (const nome of ['step-sand', 'step-grass', 'step-wood', 'step-stone'] as const) {
      expect(SOUND_PRESETS[nome].noises.length, nome).toBeGreaterThan(0);
    }
  });

  it('todos os efeitos têm pelo menos um tom ou um ruído', () => {
    for (const preset of Object.values(SOUND_PRESETS)) {
      expect(preset.tones.length + preset.noises.length).toBeGreaterThan(0);
    }
  });
});

describe('playSound', () => {
  it('não lança sem AudioContext (node/jsdom)', () => {
    expect(() => playSound('correct')).not.toThrow();
    expect(() => unlockAudio()).not.toThrow();
  });

  it('respeita setAudioEnabled(false)', () => {
    setAudioEnabled(false);
    expect(() => playSound('wrong')).not.toThrow();
    setAudioEnabled(true);
    expect(() => playSound('wrong')).not.toThrow();
  });
});
