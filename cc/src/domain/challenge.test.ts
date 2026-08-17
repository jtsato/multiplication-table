import { describe, expect, it } from 'vitest';
import {
  applyChallengeResult,
  CHALLENGE_QUESTION_COUNT,
  createInitialChallenge,
  formatDuration,
  isChallengeUnlocked,
  isPerfectRun,
  selectChallengeFact,
  type ChallengeRunResult,
} from './challenge';
import { createDefaultState } from './defaultState';
import { factKey, TABLES } from './facts';
import { recordAttempt } from './mastery';
import { createSeededRng } from './rng';
import type { FactStats } from './types';

const run = (
  score: number,
  elapsedMs: number,
  completedAt = '2026-06-01T10:00:00.000Z',
): ChallengeRunResult => ({
  score,
  total: CHALLENGE_QUESTION_COUNT,
  elapsedMs,
  completedAt,
});

describe('desbloqueio do desafio', () => {
  it('fica trancado enquanto houver ilha pendente', () => {
    expect(isChallengeUnlocked(createDefaultState('pt-BR').progress)).toBe(false);
  });

  it('abre quando todas as ilhas estao concluidas', () => {
    const state = createDefaultState('pt-BR');
    for (const table of TABLES) {
      state.progress.islands[String(table)] = {
        table,
        unlocked: true,
        completed: true,
        completedMissionIds: [],
        stars: 3,
        questionsAnswered: 10,
        firstTryCorrect: 9,
        completedAt: '2026-05-30T10:00:00.000Z',
      };
    }
    expect(isChallengeUnlocked(state.progress)).toBe(true);
  });
});

describe('selectChallengeFact', () => {
  it('sorteia de todas as tabuadas, e nao de uma so', () => {
    const rng = createSeededRng(7);
    const tables = new Set<number>();
    for (let i = 0; i < 300; i += 1) {
      tables.add(selectChallengeFact(rng, {}, []).a);
    }
    expect(tables.size).toBe(TABLES.length);
  });

  it('devolve as contas fracas com mais frequencia que as dominadas', () => {
    // 7x8 errada varias vezes; 2x2 sempre certa.
    let stats: FactStats = {};
    for (let i = 0; i < 6; i += 1) {
      stats = recordAttempt(stats, '7x8', false);
      stats = recordAttempt(stats, '2x2', true);
    }

    const rng = createSeededRng(42);
    let weak = 0;
    let strong = 0;
    for (let i = 0; i < 2000; i += 1) {
      const key = factKey(selectChallengeFact(rng, stats, []));
      if (key === '7x8') {
        weak += 1;
      }
      if (key === '2x2') {
        strong += 1;
      }
    }

    expect(weak).toBeGreaterThan(strong * 2);
  });

  it('respeita o cooldown das contas recentes', () => {
    const rng = createSeededRng(3);
    const recent = ['5x5', '6x6', '7x7'];
    for (let i = 0; i < 200; i += 1) {
      expect(recent).not.toContain(factKey(selectChallengeFact(rng, {}, recent)));
    }
  });
});

describe('applyChallengeResult', () => {
  it('registra a primeira corrida como recorde, qualquer que seja o placar', () => {
    const outcome = applyChallengeResult(createInitialChallenge(), run(4, 90_000));

    expect(outcome.isNewRecord).toBe(true);
    expect(outcome.record).toMatchObject({ bestScore: 4, bestTimeMs: 90_000, runs: 1 });
  });

  it('troca o recorde por mais acertos, mesmo demorando mais', () => {
    const first = applyChallengeResult(createInitialChallenge(), run(8, 60_000)).record;
    const outcome = applyChallengeResult(first, run(10, 120_000));

    expect(outcome.isNewRecord).toBe(true);
    expect(outcome.record.bestScore).toBe(10);
    expect(outcome.record.bestTimeMs).toBe(120_000);
  });

  it('usa o tempo apenas como desempate entre placares iguais', () => {
    const first = applyChallengeResult(createInitialChallenge(), run(10, 120_000)).record;

    const faster = applyChallengeResult(first, run(10, 90_000));
    expect(faster.isNewRecord).toBe(true);
    expect(faster.record.bestTimeMs).toBe(90_000);

    const slower = applyChallengeResult(faster.record, run(10, 150_000));
    expect(slower.isNewRecord).toBe(false);
    expect(slower.record.bestTimeMs).toBe(90_000);
  });

  it('nao deixa uma corrida rapida e errada virar recorde', () => {
    const first = applyChallengeResult(createInitialChallenge(), run(11, 120_000)).record;
    const outcome = applyChallengeResult(first, run(3, 10_000));

    expect(outcome.isNewRecord).toBe(false);
    expect(outcome.record.bestScore).toBe(11);
  });

  it('conta todas as corridas, inclusive as que nao batem recorde', () => {
    let record = createInitialChallenge();
    record = applyChallengeResult(record, run(10, 60_000)).record;
    record = applyChallengeResult(record, run(2, 200_000)).record;
    record = applyChallengeResult(record, run(5, 90_000, '2026-06-05T10:00:00.000Z')).record;

    expect(record.runs).toBe(3);
    expect(record.bestScore).toBe(10);
    expect(record.lastPlayedAt).toBe('2026-06-05T10:00:00.000Z');
  });

  it('so chama de perfeita a corrida sem nenhum erro', () => {
    const quase = applyChallengeResult(
      createInitialChallenge(),
      run(CHALLENGE_QUESTION_COUNT - 1, 60_000),
    ).record;
    expect(isPerfectRun(quase)).toBe(false);

    const perfeita = applyChallengeResult(quase, run(CHALLENGE_QUESTION_COUNT, 70_000)).record;
    expect(isPerfectRun(perfeita)).toBe(true);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [9_400, '0:09'],
    [67_000, '1:07'],
    [605_000, '10:05'],
    [-50, '0:00'],
  ])('formata %ims como %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});
