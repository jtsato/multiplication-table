import { describe, expect, it } from 'vitest';
import { createDefaultState } from './defaultState';
import { TABLES } from './facts';
import { buildJourneySummary, findToughestVictory } from './journey';
import { recordAnswer } from './statistics';
import type { GameState } from './types';

/** Datas embaralhadas: a maior nao e a ultima da lista, de proposito. */
const COMPLETION_DATES = [
  '2026-01-10T10:00:00.000Z',
  '2026-01-20T10:00:00.000Z',
  '2026-05-30T10:00:00.000Z',
  '2026-02-01T10:00:00.000Z',
  '2026-02-08T10:00:00.000Z',
  '2026-03-03T10:00:00.000Z',
  '2026-03-09T10:00:00.000Z',
  '2026-04-01T10:00:00.000Z',
  '2026-04-15T10:00:00.000Z',
];

const LATEST_COMPLETION = '2026-05-30T10:00:00.000Z';

function completeAll(state: GameState, stars = 3): GameState {
  const islands = { ...state.progress.islands };
  TABLES.forEach((table, index) => {
    islands[String(table)] = {
      ...(islands[String(table)] ?? {
        table,
        unlocked: true,
        completedMissionIds: [],
        questionsAnswered: 0,
        firstTryCorrect: 0,
      }),
      table,
      unlocked: true,
      completed: true,
      stars,
      questionsAnswered: 20,
      firstTryCorrect: 18,
      completedMissionIds: [],
      completedAt: COMPLETION_DATES[index] ?? LATEST_COMPLETION,
    };
  });
  return { ...state, progress: { ...state.progress, islands } };
}

/** Aplica uma sequencia de acertos/erros a uma conta. */
function answer(state: GameState, key: string, outcomes: boolean[]): GameState {
  return outcomes.reduce(
    (current, wasCorrect) => ({
      ...current,
      statistics: recordAnswer(current.statistics, key, wasCorrect),
    }),
    state,
  );
}

describe('buildJourneySummary', () => {
  it('reporta o arquipelago incompleto enquanto faltar ilha', () => {
    const summary = buildJourneySummary(createDefaultState('pt-BR'));
    expect(summary.complete).toBe(false);
    expect(summary.totalStars).toBe(0);
    expect(summary.maxStars).toBe(TABLES.length * 3);
  });

  it('soma estrelas e fecha a jornada na ilha concluida mais tarde', () => {
    const summary = buildJourneySummary(completeAll(createDefaultState('pt-BR')));

    expect(summary.complete).toBe(true);
    expect(summary.islands).toHaveLength(TABLES.length);
    expect(summary.totalStars).toBe(TABLES.length * 3);
    expect(summary.finishedAt).toBe(LATEST_COMPLETION);
  });

  it('espelha as estatisticas globais do jogador', () => {
    let state = completeAll(createDefaultState('pt-BR'));
    state = answer(state, '7x8', [false, true, true]);

    const summary = buildJourneySummary(state);
    expect(summary.totalQuestions).toBe(3);
    expect(summary.totalCorrect).toBe(2);
    expect(summary.accuracy).toBeCloseTo(2 / 3);
    expect(summary.bestStreak).toBe(2);
  });
});

describe('findToughestVictory', () => {
  it('não aponta vitória quando a conta difícil ainda não foi dominada', () => {
    const state = answer(createDefaultState('pt-BR'), '7x8', [false, false, true]);
    expect(findToughestVictory(state)).toBeNull();
  });

  it('escolhe a conta mais errada entre as que hoje estão dominadas', () => {
    const wrong = (times: number) => Array.from({ length: times }, () => false);
    const right = (times: number) => Array.from({ length: times }, () => true);

    let state = createDefaultState('pt-BR');
    // 6x7: um erro e depois dominada.
    state = answer(state, '6x7', [...wrong(1), ...right(9)]);
    // 7x8: tres erros e tambem dominada — vence por ter custado mais.
    state = answer(state, '7x8', [...wrong(3), ...right(12)]);
    // 9x9: muitos erros, mas segue fraca — nao pode ser chamada de vitoria.
    state = answer(state, '9x9', [...wrong(5), ...right(1)]);

    const victory = findToughestVictory(state);
    expect(victory?.key).toBe('7x8');
    expect(victory?.fact).toEqual({ a: 7, b: 8 });
    expect(victory?.mistakes).toBe(3);
  });

  it('ignora contas dominadas sem nenhum erro', () => {
    const state = answer(createDefaultState('pt-BR'), '2x2', [true, true, true]);
    expect(findToughestVictory(state)).toBeNull();
  });
});
