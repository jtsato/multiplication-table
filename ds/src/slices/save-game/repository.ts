import type { BattleState } from "../battle/battle.types";
import type { LocaleCode } from "../../shared/i18n/locale.types";
import type { Progress } from "../progression/progression";
import { initialProgress, migrateProgress } from "../progression/progression";
import type { FactStats } from "../adaptive-review/adaptive-review";
import type { AvatarSelection } from "../avatar/avatar";
import { DEFAULT_AVATAR_SELECTION, migrateAvatarSelection } from "../avatar/avatar";

/** Versão atual do schema de save. Incrementar exige migração (migrateSave). */
export const SAVE_VERSION = 3;

export interface GameSave {
  version: typeof SAVE_VERSION;
  locale: LocaleCode;
  /** Avatar escolhido (classe + cor). */
  avatar: AvatarSelection;
  /** Progresso da jornada (mapas/tabuadas e chefões). */
  progress: Progress;
  /** Batalha em andamento; nula quando o jogador está no menu. */
  battle: BattleState | null;
  /** Histórico por fato para o reforço adaptativo. */
  facts: FactStats[];
  /** XP total acumulado (base para desbloqueios futuros). */
  totalXp: number;
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

/** Valida o XP total de um save; ausente vira 0 (migração). */
export function migrateTotalXp(raw: unknown): number {
  if (raw === undefined) return 0;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
    throw new Error("xp inválido");
  }
  return Math.floor(raw);
}

/**
 * Valida e migra um save bruto (ex.: de versões antigas) para o schema atual.
 * Campos novos recebem o padrão (migração); dados inválidos lançam erro.
 */
export function migrateSave(raw: unknown): GameSave {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("save inválido: não é um objeto");
  }
  const candidate = raw as {
    version?: unknown;
    locale?: unknown;
    avatar?: unknown;
    progress?: unknown;
    battle?: unknown;
    facts?: unknown;
    totalXp?: unknown;
  };

  if (candidate.locale !== "pt-BR" && candidate.locale !== "en-US") {
    throw new Error(`locale inválido: ${String(candidate.locale)}`);
  }

  // v1 → v3: a progressão mudou para mapas por tabuada; o save antigo é
  // migrado com avatar padrão, jornada reiniciada e XP zerado.
  if (candidate.version === 1) {
    return {
      version: SAVE_VERSION,
      locale: candidate.locale as LocaleCode,
      avatar: DEFAULT_AVATAR_SELECTION,
      progress: initialProgress(),
      battle: null,
      facts: migrateFacts(candidate.facts),
      totalXp: 0,
    };
  }

  // v2 → v3: mantém avatar/progresso/batalha/fatos e adiciona XP zerado.
  if (candidate.version === 2) {
    // battle: null é válido (jogador no menu); `typeof null` é "object".
    if (typeof candidate.battle !== "object") {
      throw new Error("save inválido: batalha ausente");
    }
    return {
      version: SAVE_VERSION,
      locale: candidate.locale as LocaleCode,
      avatar:
        candidate.avatar === undefined
          ? DEFAULT_AVATAR_SELECTION
          : migrateAvatarSelection(candidate.avatar),
      progress:
        candidate.progress === undefined ? initialProgress() : migrateProgress(candidate.progress),
      battle: candidate.battle as BattleState | null,
      facts: migrateFacts(candidate.facts),
      totalXp: 0,
    };
  }

  if (candidate.version !== SAVE_VERSION) {
    throw new Error(`versão de save não suportada: ${String(candidate.version)}`);
  }
  // battle: null é válido (jogador no menu); `typeof null` é "object", então
  // a checagem abaixo rejeita ausente/não-objeto e aceita null.
  if (typeof candidate.battle !== "object") {
    throw new Error("save inválido: batalha ausente");
  }

  return {
    version: SAVE_VERSION,
    locale: candidate.locale as LocaleCode,
    avatar:
      candidate.avatar === undefined
        ? DEFAULT_AVATAR_SELECTION
        : migrateAvatarSelection(candidate.avatar),
    progress:
      candidate.progress === undefined ? initialProgress() : migrateProgress(candidate.progress),
    battle: candidate.battle as BattleState | null,
    facts: migrateFacts(candidate.facts),
    totalXp: migrateTotalXp(candidate.totalXp),
  };
}
