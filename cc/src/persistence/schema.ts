import {
  ACCESSORIES,
  AVATAR_BASES,
  HAIR_STYLES,
  OUTFIT_COLORS,
  SKIN_TONES,
} from '../domain/avatar';
import { ACHIEVEMENTS } from '../domain/achievements';
import { CURRENT_SCHEMA_VERSION, createDefaultState } from '../domain/defaultState';
import { FIRST_TABLE, TABLES } from '../domain/facts';
import { parseFactKey } from '../domain/facts';
import { MISSIONS } from '../domain/missions';
import { createIslandProgress } from '../domain/progression';
import { SUPPORTED_LOCALES } from '../domain/types';
import type {
  AchievementState,
  FactStat,
  FactStats,
  GameProgress,
  GameSettings,
  GameState,
  IslandProgress,
  Locale,
  PlayerProfile,
  PlayerStatistics,
} from '../domain/types';

/**
 * Validacao e reparo do estado salvo.
 *
 * Um save pode estar: ausente (primeiro acesso), antigo (schema anterior),
 * ou corrompido (editado a mao, escrita interrompida, bug de versao antiga).
 * Nenhum desses casos pode quebrar o jogo para a crianca - no pior cenario
 * repara-se o que da e o resto volta ao padrao.
 */

type JsonRecord = Record<string, unknown>;

/** Marca que algo precisou ser consertado durante a leitura. */
type Mark = () => void;

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return null;
}

function coerceBoolean(value: unknown, fallback: boolean, mark: Mark): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  mark();
  return fallback;
}

function coerceNumber(
  value: unknown,
  fallback: number,
  mark: Mark,
  options: { min?: number; max?: number } = {},
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    mark();
    return fallback;
  }
  const { min, max } = options;
  if (min !== undefined && value < min) {
    mark();
    return min;
  }
  if (max !== undefined && value > max) {
    mark();
    return max;
  }
  return value;
}

function coerceString(value: unknown, fallback: string, mark: Mark): string {
  if (typeof value === 'string') {
    return value;
  }
  mark();
  return fallback;
}

function coerceIsoDate(value: unknown, fallback: string | null, mark: Mark): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return value;
  }
  mark();
  return fallback;
}

function coerceOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  mark: Mark,
): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  mark();
  return fallback;
}

function coerceStringArray(value: unknown, allowed: Set<string>, mark: Mark): string[] {
  if (!Array.isArray(value)) {
    mark();
    return [];
  }
  const cleaned = value.filter(
    (entry): entry is string => typeof entry === 'string' && allowed.has(entry),
  );
  const unique = [...new Set(cleaned)];
  if (unique.length !== value.length) {
    mark();
  }
  return unique;
}

// ---------------------------------------------------------------------------

function normalizePlayer(raw: unknown, fallback: PlayerProfile, mark: Mark): PlayerProfile {
  const record = asRecord(raw);
  if (!record) {
    mark();
    return fallback;
  }
  let avatarRecord = asRecord(record.avatar);
  if (!avatarRecord) {
    mark();
    avatarRecord = {};
  }

  return {
    name: coerceString(record.name ?? '', fallback.name, mark),
    createdAt: coerceIsoDate(record.createdAt, fallback.createdAt, mark) ?? fallback.createdAt,
    onboardingCompleted: coerceBoolean(record.onboardingCompleted, false, mark),
    tutorialSeen: coerceBoolean(record.tutorialSeen, false, mark),
    avatar: {
      base: coerceOneOf(avatarRecord.base, AVATAR_BASES, fallback.avatar.base, mark),
      skin: coerceOneOf(avatarRecord.skin, SKIN_TONES, fallback.avatar.skin, mark),
      hair: coerceOneOf(avatarRecord.hair, HAIR_STYLES, fallback.avatar.hair, mark),
      outfit: coerceOneOf(avatarRecord.outfit, OUTFIT_COLORS, fallback.avatar.outfit, mark),
      accessory: coerceOneOf(avatarRecord.accessory, ACCESSORIES, fallback.avatar.accessory, mark),
    },
  };
}

function normalizeSettings(raw: unknown, fallback: GameSettings, mark: Mark): GameSettings {
  const record = asRecord(raw);
  if (!record) {
    mark();
    return fallback;
  }
  return {
    locale: coerceOneOf<Locale>(record.locale, SUPPORTED_LOCALES, fallback.locale, mark),
    musicEnabled: coerceBoolean(record.musicEnabled, fallback.musicEnabled, mark),
    soundEffectsEnabled: coerceBoolean(
      record.soundEffectsEnabled,
      fallback.soundEffectsEnabled,
      mark,
    ),
    reducedMotion: coerceBoolean(record.reducedMotion, fallback.reducedMotion, mark),
  };
}

function normalizeIsland(raw: unknown, table: number, mark: Mark): IslandProgress {
  const fallback = createIslandProgress(table);
  const record = asRecord(raw);
  if (!record) {
    mark();
    return fallback;
  }

  const validMissionIds = new Set(
    MISSIONS.filter((mission) => mission.table === table).map((mission) => mission.id),
  );
  const completedMissionIds = coerceStringArray(record.completedMissionIds, validMissionIds, mark);

  const questionsAnswered = coerceNumber(record.questionsAnswered, 0, mark, { min: 0 });
  const firstTryCorrect = coerceNumber(record.firstTryCorrect, 0, mark, {
    min: 0,
    max: questionsAnswered,
  });

  return {
    table,
    // A primeira ilha nunca pode ficar trancada, aconteca o que acontecer.
    unlocked: table === FIRST_TABLE || coerceBoolean(record.unlocked, false, mark),
    completed: coerceBoolean(record.completed, false, mark),
    completedMissionIds,
    stars: Math.round(coerceNumber(record.stars, 0, mark, { min: 0, max: 3 })),
    questionsAnswered,
    firstTryCorrect,
    completedAt: coerceIsoDate(record.completedAt ?? null, null, mark),
  };
}

function normalizeProgress(raw: unknown, mark: Mark): GameProgress {
  const record = asRecord(raw);
  if (!record) {
    mark();
    return { islands: buildIslands(undefined, mark), currentTable: FIRST_TABLE };
  }

  const islands = buildIslands(asRecord(record.islands) ?? undefined, mark);
  const currentTableRaw = coerceNumber(record.currentTable, FIRST_TABLE, mark);

  let currentTable = currentTableRaw;
  if (!TABLES.includes(currentTableRaw)) {
    mark();
    currentTable = FIRST_TABLE;
  }

  return { islands, currentTable };
}

function buildIslands(raw: JsonRecord | undefined, mark: Mark): Record<string, IslandProgress> {
  const islands: Record<string, IslandProgress> = {};
  for (const table of TABLES) {
    const key = String(table);
    if (raw && !(key in raw)) {
      // Save de uma versao com menos ilhas: completa o que falta.
      mark();
    }
    islands[key] = normalizeIsland(raw?.[key], table, raw ? mark : () => {});
  }
  return islands;
}

function normalizeFactStat(raw: unknown, mark: Mark): FactStat | null {
  const record = asRecord(raw);
  if (!record) {
    mark();
    return null;
  }
  const attempts = coerceNumber(record.attempts, 0, mark, { min: 0 });
  if (attempts === 0) {
    return null;
  }
  const correct = coerceNumber(record.correct, 0, mark, { min: 0, max: attempts });
  return {
    attempts,
    correct,
    incorrect: attempts - correct,
    lastSeenAt: coerceIsoDate(record.lastSeenAt ?? null, null, mark),
    lastWasCorrect: coerceBoolean(record.lastWasCorrect, false, mark),
    recentScore: coerceNumber(record.recentScore, correct / attempts, mark, { min: 0, max: 1 }),
    masteryScore: coerceNumber(record.masteryScore, correct / attempts, mark, { min: 0, max: 1 }),
  };
}

function normalizeFacts(raw: unknown, mark: Mark): FactStats {
  const record = asRecord(raw);
  if (!record) {
    mark();
    return {};
  }
  const facts: FactStats = {};
  for (const [key, value] of Object.entries(record)) {
    if (parseFactKey(key) === null) {
      mark();
      continue;
    }
    const stat = normalizeFactStat(value, mark);
    if (stat) {
      facts[key] = stat;
    }
  }
  return facts;
}

function normalizeStatistics(raw: unknown, mark: Mark): PlayerStatistics {
  const record = asRecord(raw);
  if (!record) {
    mark();
    return {
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      currentStreak: 0,
      bestStreak: 0,
      playSessions: 0,
      facts: {},
    };
  }

  const totalQuestions = coerceNumber(record.totalQuestions, 0, mark, { min: 0 });
  const totalCorrect = coerceNumber(record.totalCorrect, 0, mark, { min: 0, max: totalQuestions });
  const currentStreak = coerceNumber(record.currentStreak, 0, mark, { min: 0 });

  return {
    totalQuestions,
    totalCorrect,
    totalIncorrect: totalQuestions - totalCorrect,
    currentStreak,
    bestStreak: coerceNumber(record.bestStreak, currentStreak, mark, { min: currentStreak }),
    playSessions: coerceNumber(record.playSessions, 0, mark, { min: 0 }),
    facts: normalizeFacts(record.facts, mark),
  };
}

function normalizeAchievements(raw: unknown, mark: Mark): AchievementState[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else {
    mark();
  }

  const saved = new Map<string, JsonRecord>();
  for (const entry of list) {
    const record = asRecord(entry);
    if (record && typeof record.id === 'string') {
      saved.set(record.id, record);
    } else {
      mark();
    }
  }

  // A lista canonica e a do codigo: conquistas novas aparecem bloqueadas,
  // conquistas removidas somem do save.
  return ACHIEVEMENTS.map((definition) => {
    const record = saved.get(definition.id);
    if (!record) {
      return { id: definition.id, unlocked: false, unlockedAt: null };
    }
    const unlocked = coerceBoolean(record.unlocked, false, mark);
    return {
      id: definition.id,
      unlocked,
      unlockedAt: unlocked ? coerceIsoDate(record.unlockedAt ?? null, null, mark) : null,
    };
  });
}

export interface NormalizeResult {
  state: GameState;
  /** true quando algum campo precisou ser reparado ou completado. */
  repaired: boolean;
}

/**
 * Converte qualquer coisa vinda do storage num `GameState` valido.
 * Nunca lanca excecao: no pior caso devolve o estado padrao.
 */
export function normalizeState(
  raw: unknown,
  fallbackLocale: Locale,
  now: Date = new Date(),
): NormalizeResult {
  const defaults = createDefaultState(fallbackLocale, now);
  const record = asRecord(raw);
  if (!record) {
    return { state: defaults, repaired: true };
  }

  let repaired = false;
  const mark: Mark = () => {
    repaired = true;
  };

  const state: GameState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    player: normalizePlayer(record.player, defaults.player, mark),
    settings: normalizeSettings(record.settings, defaults.settings, mark),
    progress: normalizeProgress(record.progress, mark),
    statistics: normalizeStatistics(record.statistics, mark),
    achievements: normalizeAchievements(record.achievements, mark),
  };

  return { state, repaired };
}
