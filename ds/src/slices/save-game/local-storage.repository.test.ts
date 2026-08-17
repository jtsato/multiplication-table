import { describe, expect, it } from "vitest";
import { LocalStorageRepository, SAVE_STORAGE_KEY } from "./local-storage.repository";
import { SAVE_VERSION } from "./repository";
import type { GameSave } from "./repository";

function fakeStorage(initial: Record<string, string> = {}) {
  const items = { ...initial };
  return {
    items,
    storage: {
      getItem: (key: string) => items[key] ?? null,
      setItem: (key: string, value: string) => {
        items[key] = value;
      },
      removeItem: (key: string) => {
        delete items[key];
      },
    },
  };
}

function saveValido(): GameSave {
  return {
    version: 1,
    locale: "en-US",
    battle: null,
  };
}

describe("LocalStorageRepository", () => {
  it("save grava o JSON sob a chave de armazenamento", () => {
    const { items, storage } = fakeStorage();
    const repo = new LocalStorageRepository(storage);
    repo.save(saveValido());
    expect(items["batalha-da-tabuada.save"]).toBe(JSON.stringify(saveValido()));
  });

  it("load retorna null quando não há nada salvo", () => {
    const { storage } = fakeStorage();
    const repo = new LocalStorageRepository(storage);
    expect(repo.load()).toBeNull();
  });

  it("load faz o round-trip do save salvo", () => {
    const { storage } = fakeStorage();
    const repo = new LocalStorageRepository(storage);
    repo.save(saveValido());
    expect(repo.load()).toEqual(saveValido());
  });

  it("load retorna null para JSON corrompido", () => {
    const { storage } = fakeStorage({ [SAVE_STORAGE_KEY]: "{corrompido" });
    const repo = new LocalStorageRepository(storage);
    expect(repo.load()).toBeNull();
  });

  it("load retorna null para versão de schema desconhecida", () => {
    const { storage } = fakeStorage({
      [SAVE_STORAGE_KEY]: JSON.stringify({ version: 99, locale: "pt-BR", battle: null }),
    });
    const repo = new LocalStorageRepository(storage);
    expect(repo.load()).toBeNull();
  });

  it("não quebra quando o armazenamento falha", () => {
    const storage = {
      getItem: () => {
        throw new Error("indisponível");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("quota");
      },
    };
    const repo = new LocalStorageRepository(storage);
    expect(() => repo.save(saveValido())).not.toThrow();
    expect(repo.load()).toBeNull();
  });

  it("a versão gravada acompanha o schema atual", () => {
    const { items, storage } = fakeStorage();
    const repo = new LocalStorageRepository(storage);
    repo.save(saveValido());
    const parsed = JSON.parse(items[SAVE_STORAGE_KEY]) as GameSave;
    expect(parsed.version).toBe(SAVE_VERSION);
  });

  it("clear remove o save armazenado", () => {
    const { items, storage } = fakeStorage({ [SAVE_STORAGE_KEY]: "{}" });
    const repo = new LocalStorageRepository(storage);
    repo.clear();
    expect(items[SAVE_STORAGE_KEY]).toBeUndefined();
    expect(repo.load()).toBeNull();
  });

  it("clear não quebra quando o armazenamento falha", () => {
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error("quota");
      },
    };
    const repo = new LocalStorageRepository(storage);
    expect(() => repo.clear()).not.toThrow();
  });
});
