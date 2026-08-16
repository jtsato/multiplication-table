import { createDefaultState, CURRENT_SCHEMA_VERSION } from '../domain/defaultState';
import type { GameState, Locale } from '../domain/types';
import { migrate, readSchemaVersion, type JsonRecord } from './migrations';
import { normalizeState } from './schema';
import type { LoadOutcome, LoadSource, ProgressRepository } from './ProgressRepository';
import { browserStorageService, type StorageService } from './storageService';

export const STORAGE_KEY = 'ilhas-da-tabuada:state';

export interface LocalStorageRepositoryOptions {
  storage?: StorageService;
  storageKey?: string;
  /** Idioma usado quando nao ha save (primeiro acesso). */
  fallbackLocale: Locale;
  now?: () => Date;
}

/**
 * Persistencia do MVP: um unico registro JSON no localStorage.
 *
 * A leitura tem tres etapas, nesta ordem:
 *   JSON.parse -> migracao de schema -> normalizacao/reparo.
 * Qualquer falha em qualquer etapa termina num estado jogavel.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  private readonly storage: StorageService;
  private readonly storageKey: string;
  private readonly fallbackLocale: Locale;
  private readonly now: () => Date;

  constructor(options: LocalStorageRepositoryOptions) {
    this.storage = options.storage ?? browserStorageService;
    this.storageKey = options.storageKey ?? STORAGE_KEY;
    this.fallbackLocale = options.fallbackLocale;
    this.now = options.now ?? (() => new Date());
  }

  async load(): Promise<LoadOutcome> {
    const raw = this.storage.readText(this.storageKey);

    if (raw === null) {
      return { state: createDefaultState(this.fallbackLocale, this.now()), source: 'fresh' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // JSON quebrado: nao ha nada a aproveitar.
      return { state: createDefaultState(this.fallbackLocale, this.now()), source: 'recovered' };
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { state: createDefaultState(this.fallbackLocale, this.now()), source: 'recovered' };
    }

    const record = parsed as JsonRecord;
    const savedVersion = readSchemaVersion(record);
    const migration = migrate(record);
    const { state, repaired } = normalizeState(migration.data, this.fallbackLocale, this.now());

    let source: LoadSource = 'stored';
    if (repaired || migration.toVersion !== CURRENT_SCHEMA_VERSION) {
      source = 'recovered';
    } else if (migration.migrated || savedVersion !== CURRENT_SCHEMA_VERSION) {
      source = 'migrated';
    }

    return { state, source };
  }

  async save(state: GameState): Promise<void> {
    this.storage.writeJson(this.storageKey, {
      ...state,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  }

  async clear(): Promise<void> {
    this.storage.remove(this.storageKey);
  }
}
