import { STORAGE_KEY, createDefaultState, detectLocale, normalizeState } from './schema';
import type { ProgressRepository } from './ProgressRepository';
import type { GameState, Locale } from '../domain/types';

/**
 * Único ponto do projeto que fala com localStorage.
 * Nenhum outro arquivo deve importar `window.localStorage` diretamente.
 */

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function memoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

/** Detecta localStorage com segurança (modo privado, iframes, SSR). */
export function resolveStore(): KeyValueStore {
  try {
    if (typeof globalThis.localStorage === 'undefined') return memoryStore();
    const probe = '__bloquilha_probe__';
    globalThis.localStorage.setItem(probe, '1');
    globalThis.localStorage.removeItem(probe);
    return globalThis.localStorage;
  } catch {
    return memoryStore();
  }
}

export function browserLocale(): Locale {
  const nav = (globalThis as { navigator?: { language?: string } }).navigator;
  return detectLocale(nav?.language);
}

export class StorageService {
  constructor(
    private readonly store: KeyValueStore = resolveStore(),
    private readonly key: string = STORAGE_KEY,
  ) {}

  read(): GameState {
    const fallbackLocale = browserLocale();
    let raw: string | null = null;
    try {
      raw = this.store.getItem(this.key);
    } catch {
      return createDefaultState(fallbackLocale);
    }
    // Primeiro acesso: não existe save.
    if (!raw) return createDefaultState(fallbackLocale);
    try {
      // Dados corrompidos: JSON.parse falha -> volta ao default.
      return normalizeState(JSON.parse(raw) as unknown, fallbackLocale);
    } catch {
      return createDefaultState(fallbackLocale);
    }
  }

  write(state: GameState): void {
    try {
      this.store.setItem(this.key, JSON.stringify(state));
    } catch {
      // Cota cheia ou storage bloqueado: o jogo continua em memória.
    }
  }

  remove(): void {
    try {
      this.store.removeItem(this.key);
    } catch {
      /* ignora */
    }
  }
}

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(private readonly service: StorageService = new StorageService()) {}

  async load(): Promise<GameState> {
    return this.service.read();
  }

  async save(state: GameState): Promise<void> {
    this.service.write(state);
  }

  async clear(): Promise<void> {
    this.service.remove();
  }
}
