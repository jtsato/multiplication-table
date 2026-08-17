import type { BattleState } from "../battle/battle.types";
import type { LocaleCode } from "../../shared/i18n/locale.types";

/** Versão atual do schema de save. Incrementar exige migração (migrateSave). */
export const SAVE_VERSION = 1;

export interface GameSave {
  version: typeof SAVE_VERSION;
  locale: LocaleCode;
  /** Batalha em andamento; nula quando o jogador está no menu. */
  battle: BattleState | null;
}

export interface SaveRepository {
  save(save: GameSave): void;
  load(): GameSave | null;
}

/**
 * Valida e migra um save bruto (ex.: de versões antigas) para o schema atual.
 * Lança erro para dados inválidos ou versões desconhecidas.
 */
export function migrateSave(raw: unknown): GameSave {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("save inválido: não é um objeto");
  }
  const candidate = raw as Partial<GameSave>;

  if (candidate.version !== SAVE_VERSION) {
    throw new Error(`versão de save não suportada: ${String(candidate.version)}`);
  }
  if (candidate.locale !== "pt-BR" && candidate.locale !== "en-US") {
    throw new Error(`locale inválido: ${String(candidate.locale)}`);
  }
  // battle: null é válido (jogador no menu); ausente ou não-objeto é inválido.
  if (candidate.battle !== null && typeof candidate.battle !== "object") {
    throw new Error("save inválido: batalha ausente");
  }

  return {
    version: SAVE_VERSION,
    locale: candidate.locale,
    battle: candidate.battle,
  };
}
