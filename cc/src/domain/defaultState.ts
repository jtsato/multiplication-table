import { createInitialAchievements } from './achievements';
import { createInitialProgress } from './progression';
import { createInitialStatistics } from './statistics';
import type {
  AvatarConfig,
  GameSettings,
  GameState,
  Locale,
  MascotId,
  PlayerProfile,
} from './types';

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

export const DEFAULT_MASCOT_ID: MascotId = 'bloco';

export function createDefaultSettings(locale: Locale): GameSettings {
  return {
    locale,
    musicEnabled: false,
    soundEffectsEnabled: true,
    reducedMotion: false,
  };
}

export function createDefaultPlayer(now: Date = new Date()): PlayerProfile {
  return {
    name: '',
    avatar: { ...DEFAULT_AVATAR },
    mascotId: DEFAULT_MASCOT_ID,
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
