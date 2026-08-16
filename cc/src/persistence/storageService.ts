/**
 * Unico ponto do projeto que fala com `localStorage`.
 *
 * Nenhum componente, tela ou regra de dominio chama `localStorage` direto.
 * Isso mantem o jogo funcionando em modo anonimo, em iframes com storage
 * bloqueado e em testes de Node (onde `window` nem existe).
 */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorageService {
  readonly available: boolean;
  readText(key: string): string | null;
  writeText(key: string, value: string): boolean;
  readJson<T>(key: string): T | null;
  writeJson(key: string, value: unknown): boolean;
  remove(key: string): void;
}

/** Storage em memoria: fallback quando o navegador bloqueia o localStorage. */
export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

/** Devolve o localStorage se ele existir E puder ser escrito, senao null. */
export function detectBrowserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const probe = '__tabuada_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Safari privado, cookies bloqueados, quota zerada.
    return null;
  }
}

export function createStorageService(storage: KeyValueStorage | null): StorageService {
  const backend = storage ?? createMemoryStorage();
  const available = storage !== null;

  return {
    available,

    readText(key) {
      try {
        return backend.getItem(key);
      } catch {
        return null;
      }
    },

    writeText(key, value) {
      try {
        backend.setItem(key, value);
        return true;
      } catch {
        // Quota estourada ou storage desabilitado no meio da sessao.
        return false;
      }
    },

    readJson<T>(key: string): T | null {
      const raw = this.readText(key);
      if (raw === null) {
        return null;
      }
      try {
        return JSON.parse(raw) as T;
      } catch {
        // JSON corrompido: quem chama decide o que fazer.
        return null;
      }
    },

    writeJson(key, value) {
      try {
        return this.writeText(key, JSON.stringify(value));
      } catch {
        return false;
      }
    },

    remove(key) {
      try {
        backend.removeItem(key);
      } catch {
        // Nada a fazer: apagar o que nao da para apagar nao e erro fatal.
      }
    },
  };
}

/** Instancia padrao usada pelo app em runtime. */
export const browserStorageService: StorageService = createStorageService(detectBrowserStorage());
