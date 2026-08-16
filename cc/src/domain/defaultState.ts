import { createInitialAchievements } from './achievements';
import { createInitialProgress } from './progression';
import { createInitialStatistics } from './statistics';
import type { AvatarConfig, GameSettings, GameState, Locale, PlayerProfile } from './types';

/**
 * Versao atual do schema salvo.
 * Subir este numero exige uma migracao nova em `persistence/migrations.ts`.
 */
export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_AVATAR: AvatarConfig = {
  base: 'boy',
  skin: 'skin2',
  hair: 'short',
  outfit: 'blue',
  accessory: 'none',
};

export function createDefaultSettings(locale: Locale): GameSettings {
  return {
    locale,
    musicEnabled: true,
    soundEffectsEnabled: true,
    reducedMotion: false,
  };
}

export function createDefaultPlayer(now: Date = new Date()): PlayerProfile {
  return {
    name: '',
    avatar: { ...DEFAULT_AVATAR },
    createdAt: now.toISOString(),
    onboardingCompleted: false,
    tutorialSeen: false,
  };
}

/** Estado de um jogador que nunca abriu o jogo. */
export function createDefaultState(locale: Locale, now: Date = new Date()): GameState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    player: createDefaultPlayer(now),
    settings: createDefaultSettings(locale),
    progress: createInitialProgress(),
    statistics: createInitialStatistics(),
    achievements: createInitialAchievements(),
  };
}
