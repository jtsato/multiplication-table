import { describe, expect, it } from 'vitest';
import {
  advance,
  buildProgress,
  createLevelState,
  currentQuestionNumber,
  levelAccuracy,
  REVEAL_AFTER_WRONG_ATTEMPTS,
  retryQuestion,
  startQuestions,
  submitAnswer,
  toMissionResult,
  type LevelContext,
  type LevelState,
} from './levelSession';
import { createSeededRng } from '../domain/rng';
import { getMission } from '../domain/missions';
import { recordAttempt } from '../domain/mastery';
import type { FactStats } from '../domain/types';

function makeContext(overrides: Partial<LevelContext> = {}): LevelContext {
  const mission = getMission('t2-m1');
  if (!mission) {
    throw new Error('missao de teste inexistente');
  }
  return {
    mission,
    optionCount: 3,
    stats: {},
    unlockedTables: [2],
    ...overrides,
  };
}

/** Joga a missao inteira respondendo sempre certo ou sempre errado. */
function playThrough(context: LevelContext, seed: number, alwaysCorrect: boolean): LevelState {
  const rng = createSeededRng(seed);
  let state = startQuestions(createLevelState(context), rng, context);

  let guard = 0;
  while (state.phase !== 'finished' && guard < 200) {
    guard += 1;
    if (state.phase === 'question' && state.question) {
      const correctIndex = state.question.correctIndex;
      const wrongIndex = correctIndex === 0 ? 1 : 0;
      const shouldAnswerRight = alwaysCorrect || state.revealAnswer;
      state = submitAnswer(state, shouldAnswerRight ? correctIndex : wrongIndex, rng).state;
    } else if (state.phase === 'wrong') {
      state = retryQuestion(state);
    } else if (state.phase === 'correct') {
      state = advance(state, rng, context);
    }
  }
  return state;
}

describe('createLevelState', () => {
  it('comeca no briefing, sem pergunta e sem progresso', () => {
    const state = createLevelState(makeContext());
    expect(state.phase).toBe('briefing');
    expect(state.question).toBeNull();
    expect(state.resolved).toBe(0);
    expect(buildProgress(state)).toBe(0);
  });

  it('usa a quantidade de perguntas da missao', () => {
    const state = createLevelState(makeContext());
    expect(state.totalQuestions).toBe(5);
  });
});

describe('startQuestions', () => {
  it('apresenta a primeira pergunta da tabuada da ilha', () => {
    const context = makeContext();
    const state = startQuestions(createLevelState(context), createSeededRng(1), context);
    expect(state.phase).toBe('question');
    expect(state.question?.fact.a).toBe(2);
    expect(state.question?.options).toHaveLength(3);
  });
});

describe('submitAnswer', () => {
  const context = makeContext();

  it('avanca a construcao no acerto', () => {
    const rng = createSeededRng(2);
    const state = startQuestions(createLevelState(context), rng, context);
    const outcome = submitAnswer(state, state.question!.correctIndex, rng);

    expect(outcome.wasCorrect).toBe(true);
    expect(outcome.firstTry).toBe(true);
    expect(outcome.state.phase).toBe('correct');
    expect(outcome.state.resolved).toBe(1);
    expect(buildProgress(outcome.state)).toBeCloseTo(0.2);
  });

  it('nao remove progresso no erro', () => {
    const rng = createSeededRng(3);
    let state = startQuestions(createLevelState(context), rng, context);
    state = submitAnswer(state, state.question!.correctIndex, rng).state;
    state = advance(state, rng, context);

    const wrongIndex = state.question!.correctIndex === 0 ? 1 : 0;
    const outcome = submitAnswer(state, wrongIndex, rng);

    expect(outcome.wasCorrect).toBe(false);
    expect(outcome.state.resolved).toBe(1);
    expect(buildProgress(outcome.state)).toBeCloseTo(0.2);
  });

  it('mostra a ajuda visual depois do erro', () => {
    const rng = createSeededRng(4);
    const state = startQuestions(createLevelState(context), rng, context);
    const wrongIndex = state.question!.correctIndex === 0 ? 1 : 0;
    const outcome = submitAnswer(state, wrongIndex, rng);

    expect(outcome.state.phase).toBe('wrong');
    expect(outcome.state.showHint).toBe(true);
    expect(outcome.state.revealAnswer).toBe(false);
  });

  it('revela a resposta apos erros repetidos, sem travar a crianca', () => {
    const rng = createSeededRng(5);
    let state = startQuestions(createLevelState(context), rng, context);
    const wrongIndex = state.question!.correctIndex === 0 ? 1 : 0;

    for (let i = 0; i < REVEAL_AFTER_WRONG_ATTEMPTS; i += 1) {
      state = submitAnswer(state, wrongIndex, rng).state;
      state = retryQuestion(state);
    }
    expect(state.revealAnswer).toBe(true);
    expect(state.question).not.toBeNull();
  });

  it('nao conta acerto de primeira depois de errar', () => {
    const rng = createSeededRng(6);
    let state = startQuestions(createLevelState(context), rng, context);
    const correctIndex = state.question!.correctIndex;
    const wrongIndex = correctIndex === 0 ? 1 : 0;

    state = submitAnswer(state, wrongIndex, rng).state;
    state = retryQuestion(state);
    const outcome = submitAnswer(state, correctIndex, rng);

    expect(outcome.wasCorrect).toBe(true);
    expect(outcome.firstTry).toBe(false);
    expect(outcome.state.firstTryCorrect).toBe(0);
    expect(outcome.state.resolved).toBe(1);
  });

  it('ignora respostas fora da fase de pergunta', () => {
    const state = createLevelState(context);
    expect(submitAnswer(state, 0, createSeededRng(7)).state).toBe(state);
  });

  it('mantem a mesma pergunta ao repetir a tentativa', () => {
    const rng = createSeededRng(8);
    let state = startQuestions(createLevelState(context), rng, context);
    const key = state.question!.key;
    state = submitAnswer(state, state.question!.correctIndex === 0 ? 1 : 0, rng).state;
    state = retryQuestion(state);
    expect(state.question!.key).toBe(key);
    expect(state.phase).toBe('question');
  });
});

describe('missao completa', () => {
  it('termina depois de acertar todas as perguntas', () => {
    const context = makeContext();
    const state = playThrough(context, 10, true);

    expect(state.phase).toBe('finished');
    expect(state.resolved).toBe(state.totalQuestions);
    expect(state.firstTryCorrect).toBe(state.totalQuestions);
    expect(buildProgress(state)).toBe(1);
    expect(levelAccuracy(state)).toBe(1);
  });

  it('termina mesmo quando a crianca erra bastante', () => {
    const context = makeContext();
    const state = playThrough(context, 11, false);

    expect(state.phase).toBe('finished');
    expect(state.resolved).toBe(state.totalQuestions);
    expect(state.firstTryCorrect).toBe(0);
    expect(state.wrongAttempts).toBeGreaterThan(0);
  });

  it('nunca repete a mesma conta em perguntas seguidas', () => {
    const context = makeContext({ mission: getMission('t2-final')! });
    const rng = createSeededRng(12);
    let state = startQuestions(createLevelState(context), rng, context);
    const seen: string[] = [state.question!.key];

    while (state.phase !== 'finished') {
      state = submitAnswer(state, state.question!.correctIndex, rng).state;
      state = advance(state, rng, context);
      if (state.question) {
        expect(seen[seen.length - 1]).not.toBe(state.question.key);
        seen.push(state.question.key);
      }
    }
    expect(seen.length).toBe(context.mission.questionCount);
  });

  it('nao coloca a resposta certa duas vezes seguidas na mesma posicao', () => {
    const context = makeContext({ mission: getMission('t2-final')! });
    const rng = createSeededRng(13);
    let state = startQuestions(createLevelState(context), rng, context);
    let previousIndex = state.question!.correctIndex;

    while (state.phase !== 'finished') {
      state = submitAnswer(state, state.question!.correctIndex, rng).state;
      state = advance(state, rng, context);
      if (state.question) {
        expect(state.question.correctIndex).not.toBe(previousIndex);
        previousIndex = state.question.correctIndex;
      }
    }
  });

  it('prioriza as contas fracas da tabuada dentro da missao', () => {
    let stats: FactStats = {};
    for (let i = 0; i < 4; i += 1) {
      stats = recordAttempt(stats, '2x7', false, new Date('2026-01-01T00:00:00.000Z'));
    }
    const context = makeContext({ mission: getMission('t2-final')!, stats });

    let appearances = 0;
    for (let seed = 0; seed < 40; seed += 1) {
      const rng = createSeededRng(seed);
      let state = startQuestions(createLevelState(context), rng, context);
      while (state.phase !== 'finished') {
        if (state.question?.key === '2x7') {
          appearances += 1;
        }
        state = submitAnswer(state, state.question!.correctIndex, rng).state;
        state = advance(state, rng, context);
      }
    }
    // 8 perguntas por missao em 10 contas possiveis: o esperado uniforme e 32.
    expect(appearances).toBeGreaterThan(32);
  });

  it('gera o resultado da missao para o progresso', () => {
    const context = makeContext();
    const state = playThrough(context, 14, true);
    const result = toMissionResult(state, '2026-03-01T12:00:00.000Z');

    expect(result).toEqual({
      missionId: 't2-m1',
      table: 2,
      questionsAnswered: 5,
      firstTryCorrect: 5,
      completedAt: '2026-03-01T12:00:00.000Z',
    });
  });
});

describe('contadores de tela', () => {
  it('numera as perguntas a partir de 1 e nao passa do total', () => {
    const context = makeContext();
    const rng = createSeededRng(15);
    let state = startQuestions(createLevelState(context), rng, context);
    expect(currentQuestionNumber(state)).toBe(1);

    state = submitAnswer(state, state.question!.correctIndex, rng).state;
    state = advance(state, rng, context);
    expect(currentQuestionNumber(state)).toBe(2);

    const finished = playThrough(context, 15, true);
    expect(currentQuestionNumber(finished)).toBe(finished.totalQuestions);
  });
});
