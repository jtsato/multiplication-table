import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageProgressRepository, STORAGE_KEY } from './localStorageRepository';
import { createMemoryStorage, createStorageService } from './storageService';
import { migrate, readSchemaVersion } from './migrations';
import { normalizeState } from './schema';
import { CHALLENGE_QUESTION_COUNT } from '../domain/challenge';
import { CURRENT_SCHEMA_VERSION, createDefaultState } from '../domain/defaultState';
import { applyMissionResult, getIslandProgress, islandStatus } from '../domain/progression';
import { recordAnswer } from '../domain/statistics';
import type { GameState } from '../domain/types';

function makeRepository() {
  const backend = createMemoryStorage();
  const storage = createStorageService(backend);
  const repository = new LocalStorageProgressRepository({
    storage,
    fallbackLocale: 'pt-BR',
  });
  return { backend, storage, repository };
}

describe('storageService', () => {
  it('le e escreve JSON', () => {
    const storage = createStorageService(createMemoryStorage());
    expect(storage.writeJson('k', { a: 1 })).toBe(true);
    expect(storage.readJson<{ a: number }>('k')).toEqual({ a: 1 });
  });

  it('devolve null para JSON invalido em vez de lancar', () => {
    const backend = createMemoryStorage();
    backend.setItem('k', '{quebrado');
    const storage = createStorageService(backend);
    expect(storage.readJson('k')).toBeNull();
  });

  it('nao quebra quando o storage do navegador falha', () => {
    const failing = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    };
    const storage = createStorageService(failing);
    expect(storage.readText('k')).toBeNull();
    expect(storage.writeText('k', 'v')).toBe(false);
    expect(() => storage.remove('k')).not.toThrow();
  });

  it('marca indisponibilidade quando nao ha storage nativo', () => {
    expect(createStorageService(null).available).toBe(false);
    expect(createStorageService(createMemoryStorage()).available).toBe(true);
  });
});

describe('migracao de schema', () => {
  it('trata save sem schemaVersion como versao 0', () => {
    expect(readSchemaVersion({})).toBe(0);
    expect(readSchemaVersion({ schemaVersion: 3 })).toBe(3);
    expect(readSchemaVersion({ schemaVersion: 'x' })).toBe(0);
  });

  it('migra um save antigo ate a versao atual', () => {
    const result = migrate({ player: {} });
    expect(result.fromVersion).toBe(0);
    expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.migrated).toBe(true);
    expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('nao mexe num save que ja esta na versao atual', () => {
    const data = { schemaVersion: CURRENT_SCHEMA_VERSION, player: {} };
    const result = migrate(data);
    expect(result.migrated).toBe(false);
    expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('preserva os dados do save durante a migracao', () => {
    const result = migrate({ statistics: { totalCorrect: 12 } });
    expect(result.data.statistics).toEqual({ totalCorrect: 12 });
  });

  it('1 -> 2 acrescenta o recorde zerado do Modo Desafio', () => {
    const result = migrate({ schemaVersion: 1, statistics: { totalCorrect: 12 } });

    expect(result.migrated).toBe(true);
    expect(result.data.challenge).toEqual({
      bestScore: 0,
      bestTimeMs: null,
      runs: 0,
      lastPlayedAt: null,
    });
    // O progresso de quem ja jogava continua intacto.
    expect(result.data.statistics).toEqual({ totalCorrect: 12 });
  });
});

describe('normalizeState', () => {
  it('aceita um estado padrao sem reparos', () => {
    const defaults = createDefaultState('pt-BR');
    const result = normalizeState(JSON.parse(JSON.stringify(defaults)), 'pt-BR');
    expect(result.repaired).toBe(false);
    expect(result.state).toEqual(defaults);
  });

  it('conserta um recorde de desafio impossivel', () => {
    const { state, repaired } = normalizeState(
      {
        // Placar acima do maximo, tempo negativo e um "recorde" sem placar.
        challenge: { bestScore: 999, bestTimeMs: -5, runs: 2, lastPlayedAt: 'ontem' },
      },
      'pt-BR',
    );

    expect(repaired).toBe(true);
    expect(state.challenge.bestScore).toBe(CHALLENGE_QUESTION_COUNT);
    expect(state.challenge.bestTimeMs).toBe(0);
    expect(state.challenge.runs).toBe(2);
    expect(state.challenge.lastPlayedAt).toBeNull();
  });

  it('nao inventa tempo de recorde para quem nunca pontuou', () => {
    const { state } = normalizeState(
      { challenge: { bestScore: 0, bestTimeMs: 42_000, runs: 1, lastPlayedAt: null } },
      'pt-BR',
    );
    expect(state.challenge.bestTimeMs).toBeNull();
  });

  it('devolve o padrao quando o dado nao e um objeto', () => {
    expect(normalizeState(null, 'pt-BR').repaired).toBe(true);
    expect(normalizeState('texto', 'pt-BR').repaired).toBe(true);
    expect(normalizeState([1, 2], 'pt-BR').state.progress.currentTable).toBe(2);
  });

  it('repara campos corrompidos mantendo o que da para aproveitar', () => {
    const corrupted = {
      schemaVersion: 1,
      player: { avatar: { base: 'alien', hair: 'short' }, onboardingCompleted: true },
      settings: { locale: 'klingon', musicEnabled: 'sim' },
      progress: { islands: {}, currentTable: 99 },
      statistics: { totalQuestions: 10, totalCorrect: 40 },
      achievements: 'nada',
    };
    const { state, repaired } = normalizeState(corrupted, 'en-US');
    expect(repaired).toBe(true);
    expect(state.player.onboardingCompleted).toBe(true);
    expect(state.player.avatar.hair).toBe('short');
    expect(state.player.avatar.base).toBe('boy');
    expect(state.settings.locale).toBe('en-US');
    expect(state.settings.musicEnabled).toBe(false);
    expect(state.progress.currentTable).toBe(2);
    // Acertos nunca podem passar do total de tentativas.
    expect(state.statistics.totalCorrect).toBe(10);
    expect(state.achievements.length).toBeGreaterThan(0);
  });

  it('recria as 9 ilhas quando o save veio incompleto', () => {
    const { state } = normalizeState(
      { progress: { islands: { '2': { unlocked: true } } } },
      'pt-BR',
    );
    expect(Object.keys(state.progress.islands)).toHaveLength(9);
    expect(islandStatus(state.progress, 10)).toBe('locked');
  });

  it('nunca deixa a primeira ilha trancada', () => {
    const { state } = normalizeState(
      { progress: { islands: { '2': { unlocked: false } } } },
      'pt-BR',
    );
    expect(getIslandProgress(state.progress, 2).unlocked).toBe(true);
  });

  it('descarta ids de missao desconhecidos', () => {
    const { state } = normalizeState(
      {
        progress: {
          islands: { '2': { unlocked: true, completedMissionIds: ['t2-m1', 'missao-fantasma'] } },
        },
      },
      'pt-BR',
    );
    expect(getIslandProgress(state.progress, 2).completedMissionIds).toEqual(['t2-m1']);
  });

  it('descarta chaves de multiplicacao invalidas', () => {
    const { state } = normalizeState(
      {
        statistics: {
          facts: {
            '7x3': { attempts: 2, correct: 1, masteryScore: 0.5, recentScore: 0.5 },
            'nao-e-conta': { attempts: 5, correct: 5 },
          },
        },
      },
      'pt-BR',
    );
    expect(Object.keys(state.statistics.facts)).toEqual(['7x3']);
  });

  it('mantem apenas as conquistas que existem no codigo', () => {
    const { state } = normalizeState(
      {
        achievements: [
          { id: 'firstCorrect', unlocked: true, unlockedAt: '2026-01-01T00:00:00.000Z' },
          { id: 'conquista-removida', unlocked: true },
        ],
      },
      'pt-BR',
    );
    const first = state.achievements.find((entry) => entry.id === 'firstCorrect');
    expect(first?.unlocked).toBe(true);
    const knownIds: string[] = state.achievements.map((entry) => entry.id);
    expect(knownIds).not.toContain('conquista-removida');
  });
});

describe('LocalStorageProgressRepository', () => {
  let context = makeRepository();

  beforeEach(() => {
    context = makeRepository();
  });

  it('devolve estado novo no primeiro acesso', async () => {
    const outcome = await context.repository.load();
    expect(outcome.source).toBe('fresh');
    expect(outcome.state.player.onboardingCompleted).toBe(false);
    expect(islandStatus(outcome.state.progress, 2)).toBe('available');
    expect(islandStatus(outcome.state.progress, 3)).toBe('locked');
  });

  it('salva e recarrega o progresso exatamente igual', async () => {
    const initial = (await context.repository.load()).state;
    const played: GameState = {
      ...initial,
      player: { ...initial.player, onboardingCompleted: true },
      statistics: recordAnswer(initial.statistics, '2x3', true, new Date('2026-02-01T09:00:00Z')),
      progress: applyMissionResult(initial.progress, {
        missionId: 't2-m1',
        table: 2,
        questionsAnswered: 5,
        firstTryCorrect: 5,
        completedAt: '2026-02-01T09:05:00.000Z',
      }).progress,
    };

    await context.repository.save(played);
    const reloaded = await context.repository.load();

    expect(reloaded.source).toBe('stored');
    expect(reloaded.state).toEqual(played);
    expect(getIslandProgress(reloaded.state.progress, 2).completedMissionIds).toEqual(['t2-m1']);
    expect(reloaded.state.statistics.totalCorrect).toBe(1);
  });

  it('preserva o desbloqueio de ilhas entre sessoes', async () => {
    const initial = (await context.repository.load()).state;
    let progress = initial.progress;
    for (const missionId of ['t2-m1', 't2-m2', 't2-m3', 't2-final']) {
      progress = applyMissionResult(progress, {
        missionId,
        table: 2,
        questionsAnswered: 6,
        firstTryCorrect: 6,
        completedAt: '2026-02-01T09:05:00.000Z',
      }).progress;
    }
    await context.repository.save({ ...initial, progress });

    const reloaded = await context.repository.load();
    expect(islandStatus(reloaded.state.progress, 2)).toBe('completed');
    expect(islandStatus(reloaded.state.progress, 3)).toBe('available');
  });

  it('recupera de um save corrompido sem perder a jogabilidade', async () => {
    context.backend.setItem(STORAGE_KEY, '{"player": {oops}');
    const outcome = await context.repository.load();
    expect(outcome.source).toBe('recovered');
    expect(islandStatus(outcome.state.progress, 2)).toBe('available');
  });

  it('marca como migrado um save sem schemaVersion', async () => {
    context.backend.setItem(
      STORAGE_KEY,
      JSON.stringify({
        player: {
          name: '',
          avatar: { base: 'girl', skin: 'skin1', hair: 'long', outfit: 'pink', accessory: 'crown' },
          mascotId: 'bloco',
          createdAt: '2026-01-01T00:00:00.000Z',
          onboardingCompleted: true,
          tutorialSeen: true,
        },
        settings: {
          locale: 'en-US',
          musicEnabled: false,
          soundEffectsEnabled: true,
          reducedMotion: false,
        },
        progress: createDefaultState('en-US').progress,
        statistics: createDefaultState('en-US').statistics,
        achievements: createDefaultState('en-US').achievements,
      }),
    );

    const outcome = await context.repository.load();
    expect(outcome.source).toBe('migrated');
    expect(outcome.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(outcome.state.player.avatar.base).toBe('girl');
    expect(outcome.state.settings.locale).toBe('en-US');
  });

  it('apaga o progresso e volta ao primeiro acesso', async () => {
    const initial = (await context.repository.load()).state;
    await context.repository.save({
      ...initial,
      player: { ...initial.player, onboardingCompleted: true },
    });
    await context.repository.clear();

    const outcome = await context.repository.load();
    expect(outcome.source).toBe('fresh');
    expect(outcome.state.player.onboardingCompleted).toBe(false);
  });

  it('grava sempre a versao atual do schema', async () => {
    const initial = (await context.repository.load()).state;
    await context.repository.save({ ...initial, schemaVersion: 0 });
    const stored = JSON.parse(context.backend.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});
