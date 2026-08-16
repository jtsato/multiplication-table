import { createInitialAchievements, reconcileAchievements } from '../domain/achievements';
import { createInitialProgress, emptyIslandProgress } from '../domain/progression';
import { ISLANDS } from '../domain/world';
import type { GameSettings, GameState, Locale, PlayerStatistics } from '../domain/types';

export const CURRENT_SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'bloquilha.save.v1';

export const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en-US'];

export function detectLocale(candidate?: string): Locale {
  if (!candidate) return 'pt-BR';
  const normalized = candidate.toLowerCase();
  if (normalized.startsWith('pt')) return 'pt-BR';
  if (normalized.startsWith('en')) return 'en-US';
  return 'pt-BR';
}

export function createDefaultSettings(locale: Locale = 'pt-BR'): GameSettings {
  return {
    locale,
    musicEnabled: true,
    soundEffectsEnabled: true,
    reducedMotion: false,
  };
}

export function createDefaultStatistics(): PlayerStatistics {
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

export function createDefaultState(locale: Locale = 'pt-BR'): GameState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    player: null,
    settings: createDefaultSettings(locale),
    progress: createInitialProgress(),
    statistics: createDefaultStatistics(),
    achievements: createInitialAchievements(),
  };
}

type Unknown = Record<string, unknown>;

function isObject(value: unknown): value is Unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Migrações sequenciais. Cada função recebe o save da versão N e devolve N+1.
 * Ao criar a versão 2, adicione `1: (data) => ({ ...data, schemaVersion: 2 })`.
 */
export const MIGRATIONS: Record<number, (data: Unknown) => Unknown> = {};

export function migrate(data: Unknown): Unknown {
  let current = data;
  let version = num(current.schemaVersion, 0);
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) {
      // Sem caminho de migração conhecido: assume o formato atual e sanitiza.
      current = { ...current, schemaVersion: CURRENT_SCHEMA_VERSION };
      break;
    }
    current = step(current);
    version = num(current.schemaVersion, version + 1);
  }
  return current;
}

/**
 * Normaliza qualquer entrada (save antigo, parcial ou corrompido) em um
 * GameState válido. Nunca lança: preferimos degradar para o default.
 */
export function normalizeState(raw: unknown, fallbackLocale: Locale = 'pt-BR'): GameState {
  const base = createDefaultState(fallbackLocale);
  if (!isObject(raw)) return base;

  const data = migrate(raw);

  const settingsRaw = isObject(data.settings) ? data.settings : {};
  const settings: GameSettings = {
    locale: SUPPORTED_LOCALES.includes(settingsRaw.locale as Locale)
      ? (settingsRaw.locale as Locale)
      : base.settings.locale,
    musicEnabled: bool(settingsRaw.musicEnabled, true),
    soundEffectsEnabled: bool(settingsRaw.soundEffectsEnabled, true),
    reducedMotion: bool(settingsRaw.reducedMotion, false),
  };

  const progress = { ...base.progress };
  const progressRaw = isObject(data.progress) ? data.progress : {};
  const islandsRaw = isObject(progressRaw.islands) ? progressRaw.islands : {};
  for (const island of ISLANDS) {
    const key = String(island.table);
    const savedIsland = islandsRaw[key];
    if (!isObject(savedIsland)) continue;
    const status = savedIsland.status;
    const missionsRaw = isObject(savedIsland.missions) ? savedIsland.missions : {};
    const missions: Record<string, { completed: boolean; bestStars: number; timesPlayed: number }> =
      {};
    for (const def of island.missions) {
      const m = missionsRaw[def.id];
      if (!isObject(m)) continue;
      missions[def.id] = {
        completed: bool(m.completed, false),
        bestStars: clamp(num(m.bestStars), 0, 3),
        timesPlayed: Math.max(0, Math.round(num(m.timesPlayed))),
      };
    }
    progress.islands[key] = {
      ...emptyIslandProgress(
        status === 'locked' ||
          status === 'available' ||
          status === 'inProgress' ||
          status === 'completed'
          ? status
          : progress.islands[key]?.status ?? 'locked',
      ),
      stars: clamp(num(savedIsland.stars), 0, 3),
      questionsAnswered: Math.max(0, Math.round(num(savedIsland.questionsAnswered))),
      correctAnswers: Math.max(0, Math.round(num(savedIsland.correctAnswers))),
      missions,
    };
  }
  progress.currentIsland = clamp(num(progressRaw.currentIsland, 2), 2, 10);
  progress.tutorialSeen = bool(progressRaw.tutorialSeen, false);
  progress.onboardingDone = bool(progressRaw.onboardingDone, false);

  const statsRaw = isObject(data.statistics) ? data.statistics : {};
  const factsRaw = isObject(statsRaw.facts) ? statsRaw.facts : {};
  const facts: PlayerStatistics['facts'] = {};
  for (const [key, value] of Object.entries(factsRaw)) {
    if (!isObject(value) || !/^\d+x\d+$/.test(key)) continue;
    facts[key] = {
      attempts: Math.max(0, Math.round(num(value.attempts))),
      correct: Math.max(0, Math.round(num(value.correct))),
      incorrect: Math.max(0, Math.round(num(value.incorrect))),
      lastSeenAt: typeof value.lastSeenAt === 'string' ? value.lastSeenAt : null,
      recent: Array.isArray(value.recent)
        ? value.recent.filter((r): r is boolean => typeof r === 'boolean').slice(-10)
        : [],
      masteryScore: clamp(num(value.masteryScore), 0, 1),
    };
  }
  const statistics: PlayerStatistics = {
    totalQuestions: Math.max(0, Math.round(num(statsRaw.totalQuestions))),
    totalCorrect: Math.max(0, Math.round(num(statsRaw.totalCorrect))),
    totalIncorrect: Math.max(0, Math.round(num(statsRaw.totalIncorrect))),
    currentStreak: Math.max(0, Math.round(num(statsRaw.currentStreak))),
    bestStreak: Math.max(0, Math.round(num(statsRaw.bestStreak))),
    playSessions: Math.max(0, Math.round(num(statsRaw.playSessions))),
    facts,
  };

  const playerRaw = isObject(data.player) ? data.player : null;
  const avatarRaw = playerRaw && isObject(playerRaw.avatar) ? playerRaw.avatar : null;
  const player =
    playerRaw && avatarRaw
      ? {
          name: typeof playerRaw.name === 'string' ? playerRaw.name.slice(0, 16) : '',
          createdAt:
            typeof playerRaw.createdAt === 'string'
              ? playerRaw.createdAt
              : new Date().toISOString(),
          avatar: {
            base: avatarRaw.base === 'pebble' ? ('pebble' as const) : ('sprout' as const),
            skinId: str(avatarRaw.skinId, 'skin1'),
            hairId: str(avatarRaw.hairId, 'hair1'),
            outfitId: str(avatarRaw.outfitId, 'outfit1'),
            accessoryId: str(avatarRaw.accessoryId, 'none'),
          },
        }
      : null;

  const achievements = reconcileAchievements(
    Array.isArray(data.achievements)
      ? data.achievements.filter(isObject).map((a) => ({
          id: String(a.id ?? ''),
          unlocked: bool(a.unlocked, false),
          unlockedAt: typeof a.unlockedAt === 'string' ? a.unlockedAt : null,
        }))
      : [],
  );

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    player,
    settings,
    progress,
    statistics,
    achievements,
  };
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
