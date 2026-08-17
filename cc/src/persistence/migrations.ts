import { createInitialChallenge } from '../domain/challenge';
import { CURRENT_SCHEMA_VERSION } from '../domain/defaultState';

/**
 * Migracoes de schema.
 *
 * Cada entrada leva o save da versao `N` para `N + 1`. Elas rodam em cadeia,
 * entao um save da versao 1 chega na versao 4 passando por 1->2, 2->3, 3->4.
 * A funcao recebe e devolve JSON cru: `normalizeState` cuida da validacao
 * depois, o que mantem as migracoes curtas e focadas na mudanca de forma.
 *
 * Ao subir CURRENT_SCHEMA_VERSION, adicione aqui a migracao correspondente.
 */

export type JsonRecord = Record<string, unknown>;
export type Migration = (state: JsonRecord) => JsonRecord;

export const MIGRATIONS: Record<number, Migration> = {
  // Versao 0 = saves sem `schemaVersion` (antes do versionamento existir).
  0: (state) => ({ ...state, schemaVersion: 1 }),

  // 1 -> 2: chegou o Modo Desafio. O save antigo nao tem o bloco `challenge`;
  // um recorde zerado e a leitura correta de quem nunca correu o desafio.
  1: (state) => ({ ...state, challenge: createInitialChallenge(), schemaVersion: 2 }),
};

export interface MigrationResult {
  data: JsonRecord;
  /** Versao encontrada no save, antes de migrar. */
  fromVersion: number;
  /** Versao alcancada. Menor que a atual = faltou migracao. */
  toVersion: number;
  migrated: boolean;
}

export function readSchemaVersion(data: JsonRecord): number {
  const value = data.schemaVersion;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Aplica a cadeia de migracoes ate a versao atual, ou ate faltar uma. */
export function migrate(data: JsonRecord): MigrationResult {
  const fromVersion = readSchemaVersion(data);
  let current = data;
  let version = fromVersion;

  while (version < CURRENT_SCHEMA_VERSION) {
    const migration = MIGRATIONS[version];
    if (!migration) {
      // Sem caminho: para aqui e deixa a normalizacao salvar o que der.
      break;
    }
    current = migration(current);
    version += 1;
  }

  // Save de uma versao futura (usuario voltou para uma build antiga):
  // nao ha o que migrar para tras; a normalizacao descarta o que nao entende.
  return {
    data: current,
    fromVersion,
    toVersion: version,
    migrated: version !== fromVersion,
  };
}
