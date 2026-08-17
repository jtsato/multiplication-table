import { migrateSave, type GameSave, type SaveRepository } from "./repository";

export const SAVE_STORAGE_KEY = "batalha-da-tabuada.save";

export class LocalStorageRepository implements SaveRepository {
  constructor(
    private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  ) {}

  save(save: GameSave): void {
    try {
      this.storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Armazenamento indisponível (modo privado, quota): segue sem persistir.
    }
  }

  load(): GameSave | null {
    try {
      const raw = this.storage.getItem(SAVE_STORAGE_KEY);
      if (raw === null) return null;
      return migrateSave(JSON.parse(raw));
    } catch {
      // Save corrompido ou versão desconhecida: começa do zero.
      return null;
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Armazenamento indisponível: nada a limpar.
    }
  }
}

/** Repositório único usado pela aplicação. */
export const saveRepository = new LocalStorageRepository(window.localStorage);
