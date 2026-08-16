import { beforeEach, describe, expect, it } from 'vitest';
import {
  LocalStorageProgressRepository,
  StorageService,
  type KeyValueStore,
} from '../persistence/storageService';
import {
  CURRENT_SCHEMA_VERSION,
  createDefaultState,
  detectLocale,
  normalizeState,
} from '../persistence/schema';
import { applyMissionOutcome } from '../domain/progression';
import { recordAnswer } from '../domain/mastery';

function fakeStore(): KeyValueStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe('StorageService', () => {
  let store: ReturnType<typeof fakeStore>;
  let service: StorageService;

  beforeEach(() => {
    store = fakeStore();
    service = new StorageService(store, 'test.key');
  });

  it('primeiro acesso devolve o estado inicial', () => {
    const state = service.read();
    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(state.player).toBe(null);
    expect(state.progress.islands['2']!.status).toBe('available');
  });

  it('salva e recupera o progresso', () => {
    const state = createDefaultState();
    state.progress = applyMissionOutcome(state.progress, {
      table: 2,
      missionId: 't2-m1',
      correct: 5,
      total: 5,
    }).progress;
    state.statistics = recordAnswer(state.statistics, { a: 2, b: 3 }, true, '2026-01-01');
    service.write(state);

    const loaded = service.read();
    expect(loaded.progress.islands['2']!.missions['t2-m1']!.completed).toBe(true);
    expect(loaded.statistics.facts['2x3']!.correct).toBe(1);
  });

  it('dados corrompidos voltam ao estado inicial sem lançar erro', () => {
    store.map.set('test.key', '{ isso não é json ');
    expect(() => service.read()).not.toThrow();
    expect(service.read().progress.islands['2']!.status).toBe('available');
  });

  it('dados parciais são completados com os padrões', () => {
    store.map.set('test.key', JSON.stringify({ schemaVersion: 1, progress: {} }));
    const state = service.read();
    expect(state.settings.locale).toBeDefined();
    expect(state.achievements.length).toBeGreaterThan(0);
  });

  it('remove o save no reset', () => {
    service.write(createDefaultState());
    service.remove();
    expect(store.map.has('test.key')).toBe(false);
  });

  it('sobrevive a um store que lança exceções', () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cota cheia');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    };
    const brokenService = new StorageService(broken, 'k');
    expect(() => brokenService.write(createDefaultState())).not.toThrow();
    expect(brokenService.read().player).toBe(null);
  });
});

describe('normalizeState', () => {
  it('descarta lixo e mantém o formato válido', () => {
    const state = normalizeState({ schemaVersion: 1, statistics: { facts: { lixo: {}, '2x3': { attempts: 2, correct: 2 } } } });
    expect(state.statistics.facts['lixo']).toBeUndefined();
    expect(state.statistics.facts['2x3']!.attempts).toBe(2);
  });

  it('migra um save sem schemaVersion', () => {
    const state = normalizeState({ progress: { tutorialSeen: true } });
    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(state.progress.tutorialSeen).toBe(true);
  });

  it('rejeita valores fora do intervalo', () => {
    const state = normalizeState({
      schemaVersion: 1,
      progress: { islands: { '2': { status: 'invalido', stars: 99 } } },
    });
    expect(state.progress.islands['2']!.stars).toBe(3);
    expect(state.progress.islands['2']!.status).toBe('available');
  });

  it('aceita entradas totalmente inválidas', () => {
    expect(normalizeState(null).player).toBe(null);
    expect(normalizeState(42).progress.islands['2']!.status).toBe('available');
  });
});

describe('detectLocale', () => {
  it('reconhece variantes do navegador', () => {
    expect(detectLocale('pt-BR')).toBe('pt-BR');
    expect(detectLocale('pt')).toBe('pt-BR');
    expect(detectLocale('en-GB')).toBe('en-US');
    expect(detectLocale('ja-JP')).toBe('pt-BR');
    expect(detectLocale(undefined)).toBe('pt-BR');
  });
});

describe('LocalStorageProgressRepository', () => {
  it('implementa o contrato assíncrono', async () => {
    const repo = new LocalStorageProgressRepository(new StorageService(fakeStore(), 'repo.key'));
    const state = await repo.load();
    state.progress.tutorialSeen = true;
    await repo.save(state);
    expect((await repo.load()).progress.tutorialSeen).toBe(true);
    await repo.clear();
    expect((await repo.load()).progress.tutorialSeen).toBe(false);
  });
});
