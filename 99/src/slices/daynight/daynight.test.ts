import { describe, expect, it } from 'vitest';
import {
  DAYNIGHT,
  PHASE_BOUNDS,
  advanceClock,
  cyclePosition,
  dayNumber,
  isDangerous,
  mixHex,
  phaseFor,
  phaseProgress,
  secondsUntilNextPhase,
  skyConfigFor,
  type DayPhase,
} from './daynight.logic';

const CICLO = DAYNIGHT.cycleSeconds;

/**
 * Meio de uma fase, derivado das fronteiras.
 *
 * Os testes nao usam posicoes literais (0.25, 0.55...) de proposito: o ritmo do
 * ciclo e um numero de ajuste de jogabilidade e ja mudou uma vez — o dia era
 * curto demais para montar o acampamento. Derivando das constantes, ajustar o
 * ritmo nao quebra dezenas de testes que nao tem nada a ver com isso.
 */
const meio = (fase: DayPhase) => (PHASE_BOUNDS[fase].start + PHASE_BOUNDS[fase].end) / 2;

describe('advanceClock', () => {
  it('soma o delta ao relogio', () => {
    expect(advanceClock(10, 0.5)).toBeCloseTo(10.5);
  });

  it('ignora delta zero, negativo ou invalido', () => {
    expect(advanceClock(10, 0)).toBe(10);
    expect(advanceClock(10, -5)).toBe(10);
    expect(advanceClock(10, NaN)).toBe(10);
    expect(advanceClock(10, Infinity)).toBe(10);
  });

  it('muitos deltas pequenos equivalem a um grande', () => {
    let miudo = 0;
    for (let i = 0; i < 600; i += 1) miudo = advanceClock(miudo, 1 / 60);
    expect(miudo).toBeCloseTo(advanceClock(0, 10), 6);
  });
});

describe('cyclePosition', () => {
  it('vai de 0 a 1 ao longo do ciclo', () => {
    expect(cyclePosition(0)).toBe(0);
    expect(cyclePosition(CICLO / 2)).toBeCloseTo(0.5);
  });

  it('da a volta ao passar do fim do ciclo', () => {
    expect(cyclePosition(CICLO)).toBeCloseTo(0);
    expect(cyclePosition(CICLO * 1.25)).toBeCloseTo(0.25);
    expect(cyclePosition(CICLO * 7.5)).toBeCloseTo(0.5);
  });

  it('nunca sai do intervalo [0, 1)', () => {
    for (let clock = 0; clock < CICLO * 5; clock += 7.3) {
      const p = cyclePosition(clock);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
    }
  });
});

describe('dayNumber', () => {
  it('comeca no dia 1 e vira no fim do ciclo', () => {
    expect(dayNumber(0)).toBe(1);
    expect(dayNumber(CICLO - 0.1)).toBe(1);
    expect(dayNumber(CICLO)).toBe(2);
    expect(dayNumber(CICLO * 3.5)).toBe(4);
  });
});

describe('phaseFor', () => {
  it('reconhece cada fase no meio dela', () => {
    for (const fase of ['dia', 'entardecer', 'noite', 'amanhecer'] as const) {
      expect(phaseFor(meio(fase))).toBe(fase);
    }
  });

  it('o dia e a fase mais longa — e nele que se colhe e constroi', () => {
    const duracao = (fase: DayPhase) => PHASE_BOUNDS[fase].end - PHASE_BOUNDS[fase].start;
    for (const outra of ['entardecer', 'noite', 'amanhecer'] as const) {
      expect(duracao('dia')).toBeGreaterThan(duracao(outra));
    }
    // Em segundos: o dia precisa dar tempo de varias colheitas e uma construcao.
    expect(duracao('dia') * CICLO).toBeGreaterThanOrEqual(150);
  });

  it('o entardecer avisa com folga antes do perigo', () => {
    const aviso = (PHASE_BOUNDS.entardecer.end - PHASE_BOUNDS.entardecer.start) * CICLO;
    expect(aviso).toBeGreaterThanOrEqual(20);
  });

  it('trata a fronteira exata como inicio da fase seguinte', () => {
    expect(phaseFor(PHASE_BOUNDS.dia.end)).toBe('entardecer');
    expect(phaseFor(PHASE_BOUNDS.entardecer.end)).toBe('noite');
    expect(phaseFor(PHASE_BOUNDS.noite.end)).toBe('amanhecer');
  });

  it('comeca e termina o ciclo coerentemente', () => {
    expect(phaseFor(0)).toBe('dia');
    expect(phaseFor(0.999)).toBe('amanhecer');
    // Uma volta completa volta ao dia.
    expect(phaseFor(1)).toBe('dia');
  });

  it('cobre o ciclo inteiro sem buraco', () => {
    const fases = new Set<DayPhase>();
    for (let t = 0; t < 1; t += 0.001) fases.add(phaseFor(t));
    expect(fases).toEqual(new Set(['dia', 'entardecer', 'noite', 'amanhecer']));
  });
});

describe('phaseProgress', () => {
  it('vai de 0 no inicio a quase 1 no fim da fase', () => {
    expect(phaseProgress(PHASE_BOUNDS.noite.start)).toBeCloseTo(0);
    expect(phaseProgress(PHASE_BOUNDS.noite.end - 0.0001)).toBeGreaterThan(0.99);
  });

  it('fica sempre entre 0 e 1', () => {
    for (let t = 0; t < 1; t += 0.005) {
      const p = phaseProgress(t);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe('secondsUntilNextPhase', () => {
  it('conta o tempo ate a virada', () => {
    const meioDia = PHASE_BOUNDS.dia.end / 2;
    expect(secondsUntilNextPhase(meioDia * CICLO)).toBeCloseTo(meioDia * CICLO);
  });

  it('chega a zero na fronteira', () => {
    expect(secondsUntilNextPhase(PHASE_BOUNDS.dia.end * CICLO - 0.001)).toBeLessThan(0.01);
  });

  it('nunca e negativo', () => {
    for (let clock = 0; clock < CICLO * 2; clock += 3.7) {
      expect(secondsUntilNextPhase(clock)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('mixHex', () => {
  it('devolve os extremos em t=0 e t=1', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('interpola canal a canal', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#ff0000', '#0000ff', 0.5)).toBe('#800080');
  });

  it('limita t fora do intervalo', () => {
    expect(mixHex('#000000', '#ffffff', -3)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 9)).toBe('#ffffff');
  });

  it('sempre devolve hex de 6 digitos', () => {
    for (let t = 0; t <= 1; t += 0.05) {
      expect(mixHex('#010203', '#040506', t)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('skyConfigFor', () => {
  it('e mais claro de dia do que de noite', () => {
    const dia = skyConfigFor(meio('dia'));
    const noite = skyConfigFor(meio('noite'));
    expect(dia.sunIntensity).toBeGreaterThan(noite.sunIntensity);
    expect(dia.ambientIntensity).toBeGreaterThan(noite.ambientIntensity);
    expect(dia.elevation).toBeGreaterThan(noite.elevation);
  });

  it('escurece de forma monotonica do entardecer ate a noite fechada', () => {
    let anterior = Infinity;
    for (let t = PHASE_BOUNDS.entardecer.start; t < PHASE_BOUNDS.noite.end; t += 0.005) {
      const atual = skyConfigFor(t).sunIntensity;
      expect(atual).toBeLessThanOrEqual(anterior + 1e-9);
      anterior = atual;
    }
  });

  it('clareia de forma monotonica no amanhecer', () => {
    let anterior = -Infinity;
    for (let t = PHASE_BOUNDS.amanhecer.start; t < 1; t += 0.002) {
      const atual = skyConfigFor(t).sunIntensity;
      expect(atual).toBeGreaterThanOrEqual(anterior - 1e-9);
      anterior = atual;
    }
  });

  it('nunca apaga a luz por completo — o jogo tem que continuar jogavel', () => {
    for (let t = 0; t < 1; t += 0.002) {
      expect(skyConfigFor(t).sunIntensity).toBeGreaterThan(0);
      expect(skyConfigFor(t).ambientIntensity).toBeGreaterThan(0);
    }
  });

  it('emenda sem salto na virada de cada fase', () => {
    for (const bound of [
      PHASE_BOUNDS.dia.end,
      PHASE_BOUNDS.entardecer.end,
      PHASE_BOUNDS.noite.end,
    ]) {
      const antes = skyConfigFor(bound - 0.0005);
      const depois = skyConfigFor(bound + 0.0005);
      // Sem descontinuidade: as fases compartilham os valores de fronteira.
      expect(Math.abs(depois.sunIntensity - antes.sunIntensity)).toBeLessThan(0.1);
    }
  });

  it('fecha o ciclo — o fim do amanhecer bate com o comeco do dia', () => {
    const fimDoCiclo = skyConfigFor(0.9999);
    const inicioDoCiclo = skyConfigFor(0);
    expect(fimDoCiclo.sunIntensity).toBeCloseTo(inicioDoCiclo.sunIntensity, 1);
    expect(fimDoCiclo.skyColor).toBe(inicioDoCiclo.skyColor);
  });

  it('devolve sempre cores hexadecimais validas', () => {
    for (let t = 0; t < 1; t += 0.01) {
      const config = skyConfigFor(t);
      expect(config.skyColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(config.sunColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('isDangerous', () => {
  it('so a noite traz inimigos', () => {
    expect(isDangerous('noite')).toBe(true);
    expect(isDangerous('dia')).toBe(false);
    expect(isDangerous('entardecer')).toBe(false);
    expect(isDangerous('amanhecer')).toBe(false);
  });
});
