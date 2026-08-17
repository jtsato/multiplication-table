import type { BattleState } from "../battle/battle.types";
import type { LocaleCode } from "../../shared/i18n/locale.types";
import type { Progress } from "../progression/progression";
import { initialProgress, migrateProgress } from "../progression/progression";
import type { FactStats } from "../adaptive-review/adaptive-review";

/** Versão atual do schema de save. Incrementar exige migração (migrateSave). */
export const SAVE_VERSION = 1;

export interface GameSave {
  version: typeof SAVE_VERSION;
  locale: LocaleCode;
  /** Progresso da jornada (monstros derrotados, tabuadas desbloqueadas). */
  progress: Progress;
  /** Batalha em andamento; nula quando o jogador está no menu. */
  battle: BattleState | null;
  /** Histórico por fato para o reforço adaptativo. */
  facts: FactStats[];
}

export interface SaveRepository {
  save(save: GameSave): void;
  load(): GameSave | null;
}

/** Valida o histórico de fatos de um save. */
export function migrateFacts(raw: unknown): FactStats[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    throw new Error("fatos inválidos");
  }
  return raw.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("fatos inválidos");
    }
    const { a, b, attempts, errors, lastSeenAt } = item as FactStats;
    const campos = [a, b, attempts, errors, lastSeenAt];
    if (!campos.every((n) => typeof n === "number" && Number.isFinite(n))) {
      throw new Error("fatos inválidos");
    }
    return { a, b, attempts, errors, lastSeenAt };
  });
}

/**
 * Valida e migra um save bruto (ex.: de versões antigas) para o schema atual.
 * Campos novos recebem o padrão (migração); dados inválidos lançam erro.
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
  // battle: null é válido (jogador no menu); `typeof null` é "object", então
  // a checagem abaixo rejeita ausente/não-objeto e aceita null.
  if (typeof candidate.battle !== "object") {
    throw new Error("save inválido: batalha ausente");
  }

  return {
    version: SAVE_VERSION,
    locale: candidate.locale,
    progress:
      candidate.progress === undefined ? initialProgress() : migrateProgress(candidate.progress),
    battle: candidate.battle,
    facts: migrateFacts(candidate.facts),
  };
}
