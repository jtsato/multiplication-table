import { describe, expect, it } from 'vitest';
import { createRng } from '../../shared/rng';
import { factKey } from '../economy/economy.logic';
import {
  SMALL_REVIEW,
  buildFactCandidates,
  createFactProgress,
  factFactorForTable,
  factPriority,
  masteryLevel,
  migrateToProgress,
  recordAnswer,
  reviewInterval,
  selectNextFact,
  type FactProgress,
} from './pedagogy.logic';

const fatos = (...pares: Array<[number, number]>): FactProgress[] =>
  pares.map(([a, b]) => createFactProgress(factKey(a, b)));

describe('createFactProgress', () => {
  it('comeca sem acertos, sem erros e ja revisavel', () => {
    const p = createFactProgress('2x4');
    expect(p.correct).toBe(0);
    expect(p.wrong).toBe(0);
    expect(p.streak).toBe(0);
    expect(p.lastSeen).toBeNull();
    expect(p.dueAt).toBe(0);
  });
});

describe('recordAnswer — acerto', () => {
  it('conta o acerto e agenda a proxima revisao a frente', () => {
    const p = recordAnswer(createFactProgress('2x4'), true, 10);
    expect(p.correct).toBe(1);
    expect(p.streak).toBe(1);
    expect(p.lastSeen).toBe(10);
    expect(p.dueAt).toBe(10 + reviewInterval(1));
  });

  it('nao apaga o historico de erros anteriores', () => {
    let p = createFactProgress('2x8');
    p = recordAnswer(p, false, 1);
    p = recordAnswer(p, true, 2);
    expect(p.wrong).toBe(1);
    expect(p.correct).toBe(1);
  });

  it('recuperacoes sucessivas aumentam o intervalo ate a proxima revisao', () => {
    let p = createFactProgress('2x8');
    const intervalos: number[] = [];
    for (let sessao = 1; sessao <= 4; sessao += 1) {
      p = recordAnswer(p, true, sessao);
      intervalos.push(p.dueAt - sessao);
    }
    for (let i = 1; i < intervalos.length; i += 1) {
      expect(intervalos[i]).toBeGreaterThan(intervalos[i - 1]);
    }
  });
});

describe('recordAnswer — erro', () => {
  it('zera a sequencia mas mantem o total de acertos', () => {
    let p = createFactProgress('2x8');
    p = recordAnswer(p, true, 1);
    p = recordAnswer(p, true, 2);
    p = recordAnswer(p, false, 3);
    expect(p.streak).toBe(0);
    expect(p.correct).toBe(2);
    expect(p.wrong).toBe(1);
  });

  it('agenda o fato para voltar depois de poucos outros', () => {
    const p = recordAnswer(createFactProgress('2x8'), false, 5);
    expect(p.dueAt).toBe(5 + SMALL_REVIEW);
    expect(p.dueAt - 5).toBeLessThanOrEqual(SMALL_REVIEW);
  });
});

describe('masteryLevel', () => {
  it('erro reduz o dominio sem apagar o historico', () => {
    let p = createFactProgress('2x8');
    for (let s = 1; s <= 5; s += 1) p = recordAnswer(p, true, s);
    const dominado = masteryLevel(p);
    p = recordAnswer(p, false, 6);
    expect(p.correct).toBe(5);
    expect(masteryLevel(p)).not.toBe(dominado);
    expect(masteryLevel(p) === 'mastered').toBe(false);
  });
});

describe('factPriority', () => {
  it('erro aumenta a prioridade futura do fato', () => {
    const semErro = recordAnswer(createFactProgress('2x8'), true, 1);
    const comErro = recordAnswer(createFactProgress('2x8'), false, 1);
    expect(factPriority(comErro)).toBeGreaterThan(factPriority(semErro));
  });

  it('dificuldade individual pode superar a dificuldade teorica', () => {
    let facilMuitoErrado = createFactProgress('2x8');
    for (let i = 0; i < 6; i += 1) facilMuitoErrado = recordAnswer(facilMuitoErrado, false, i);
    const dificilLimpo = recordAnswer(createFactProgress('9x9'), true, 1);
    expect(factPriority(facilMuitoErrado)).toBeGreaterThan(factPriority(dificilLimpo));
  });
});

describe('reviewInterval', () => {
  it('cresce a cada acerto consecutivo', () => {
    expect(reviewInterval(1)).toBe(2);
    expect(reviewInterval(2)).toBe(4);
    expect(reviewInterval(3)).toBe(8);
    expect(reviewInterval(4)).toBe(16);
    expect(reviewInterval(5)).toBe(32);
    expect(reviewInterval(6)).toBe(64);
    expect(reviewInterval(10)).toBe(64);
    expect(reviewInterval(100)).toBe(64);
  });
});

describe('reviewInterval — limites', () => {
  it('trava no menor intervalo antes do primeiro acerto e no maior apos muitos', () => {
    expect(reviewInterval(0)).toBe(2);
    expect(reviewInterval(100)).toBe(64);
  });
});

describe('factPriority — dificuldade por tabuada', () => {
  it('tabuadas faceis pesam menos que as dificies', () => {
    const nova2 = { ...createFactProgress('2x2'), correct: 1, streak: 1 };
    const nova9 = { ...createFactProgress('9x9'), correct: 1, streak: 1 };
    expect(factPriority(nova9)).toBeGreaterThan(factPriority(nova2));
    expect(factPriority(nova9) - factPriority(nova2)).toBe(2);
  });

  it('dominar reduz a prioridade do fato', () => {
    const nova = { ...createFactProgress('9x9'), correct: 1, streak: 1 };
    const dominada = { ...createFactProgress('9x9'), correct: 6, streak: 6 };
    expect(factPriority(dominada)).toBeLessThan(factPriority(nova));
  });

  it('separa as tres faixas de dificuldade teorica em passos de 1', () => {
    const facil = { ...createFactProgress('2x2'), correct: 1, streak: 1 };
    const medio = { ...createFactProgress('3x3'), correct: 1, streak: 1 };
    const dificil = { ...createFactProgress('6x6'), correct: 1, streak: 1 };
    expect(factPriority(medio) - factPriority(facil)).toBe(1);
    expect(factPriority(dificil) - factPriority(medio)).toBe(1);
  });

  it('tabuadas 1, 2, 5 e 10 caem na mesma faixa facil', () => {
    const prioridades = ['1x1', '2x2', '5x5', '10x10'].map((key) =>
      factPriority({ ...createFactProgress(key), correct: 1, streak: 1 }),
    );
    expect(new Set(prioridades).size).toBe(1);
  });
});

describe('factFactorForTable', () => {
  it('seleciona um fator da tabuada e é determinístico', () => {
    const a = factFactorForTable(2, {}, 0, createRng(10));
    const b = factFactorForTable(2, {}, 0, createRng(10));
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(1);
    expect(a).toBeLessThanOrEqual(10);
  });

  it('evita imediatamente o fato informado como último', () => {
    const fator = factFactorForTable(2, {}, 0, createRng(1), '1x2');
    expect(fator).not.toBe(1);
  });
});

describe('buildFactCandidates', () => {
  it('cobre todos os fatores das tabuadas da regiao', () => {
    const progresso = createFactProgress('2x8');
    const candidatos = buildFactCandidates([2, 5], { '2x8': progresso });
    expect(candidatos).toHaveLength(19);
    expect(candidatos.find((fact) => fact.key === '2x8')).toBe(progresso);
    expect(candidatos.map((fact) => fact.key)).toContain('5x10');
    expect(new Set(candidatos.map((fact) => fact.key)).size).toBe(candidatos.length);
  });
});

describe('selectNextFact', () => {
  it('e deterministico para a mesma semente e sessao', () => {
    const candidatos = fatos([2, 4], [2, 8], [3, 7], [9, 9]);
    const a = selectNextFact(candidatos, 10, createRng(123), '2x4');
    const b = selectNextFact(candidatos, 10, createRng(123), '2x4');
    expect(a.key).toBe(b.key);
  });

  it('nao repete mecanicamente o fato que acabou de ser respondido', () => {
    const candidatos = fatos([2, 4], [2, 8], [3, 7]);
    for (let seed = 1; seed <= 20; seed += 1) {
      const escolhido = selectNextFact(candidatos, 10, createRng(seed), '2x8');
      expect(escolhido.key).not.toBe('2x8');
    }
  });

  it('prioriza fatos vencidos a manutencao de fatos dominados', () => {
    const dificil = recordAnswer(createFactProgress('2x8'), false, 1);
    const dominado = { ...createFactProgress('9x9'), correct: 6, wrong: 0, streak: 6, dueAt: 999 };
    for (let seed = 1; seed <= 20; seed += 1) {
      const escolhido = selectNextFact([dificil, dominado], 4, createRng(seed));
      expect(escolhido.key).toBe('2x8');
    }
  });

  it('fato errado reaparece quando sua revisao vence', () => {
    const errado = recordAnswer(createFactProgress('2x8'), false, 5);
    const outro = createFactProgress('3x7');
    const escolhido = selectNextFact([errado, outro], errado.dueAt, createRng(1));
    expect(escolhido.key).toBe('2x8');
  });

  it('quando nada esta vencido, ainda sorteia um fato para manutencao', () => {
    const dominado = createFactProgress('9x9');
    const outro = createFactProgress('2x4');
    const escolhido = selectNextFact([dominado, outro], 0, createRng(7));
    expect(['9x9', '2x4']).toContain(escolhido.key);
  });

  it('nao quebra quando so ha um fato disponivel', () => {
    const unico = createFactProgress('2x8');
    expect(selectNextFact([unico], 3, createRng(1), '2x8').key).toBe('2x8');
  });
});

describe('migrateToProgress', () => {
  it('converte knownFacts/factCounts num estado inicial razoavel', () => {
    const progresso = migrateToProgress(['2x4', '3x7'], { '2x4': 3, '3x7': 1 });
    expect(progresso['2x4'].correct).toBe(3);
    expect(progresso['2x4'].dueAt).toBe(0);
    expect(progresso['3x7'].correct).toBe(1);
  });

  it('preserva fatos aprendidos mesmo sem contagem detalhada', () => {
    const progresso = migrateToProgress(['2x4'], {});
    expect(progresso['2x4'].correct).toBeGreaterThanOrEqual(1);
  });
});
