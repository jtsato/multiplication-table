/**
 * Tipos centrais do domínio. Nenhum tipo aqui depende de React, DOM ou storage:
 * esta camada é pura e testável.
 */

export type Locale = 'pt-BR' | 'en-US';

export type IslandStatus = 'locked' | 'available' | 'inProgress' | 'completed';

/** Identificador canônico de uma multiplicação, ex.: "7x3". */
export type FactKey = string;

export interface Fact {
  a: number;
  b: number;
}

export interface Question {
  fact: Fact;
  /** Resposta correta (a * b). */
  answer: number;
  /** Alternativas embaralhadas, incluindo a correta. */
  options: number[];
  key: FactKey;
}

export interface AnswerResult {
  key: FactKey;
  correct: boolean;
  chosen: number;
  answeredAt: string;
}

/* ------------------------------------------------------------------ */
/* Jogador                                                             */
/* ------------------------------------------------------------------ */

export type AvatarBase = 'sprout' | 'pebble';

export interface AvatarConfig {
  /** Duas silhuetas de base. Cosmético apenas: não altera dificuldade. */
  base: AvatarBase;
  skinId: string;
  hairId: string;
  outfitId: string;
  accessoryId: string;
}

export interface PlayerProfile {
  name: string;
  avatar: AvatarConfig;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

export interface GameSettings {
  locale: Locale;
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  reducedMotion: boolean;
}

/* ------------------------------------------------------------------ */
/* Progresso                                                           */
/* ------------------------------------------------------------------ */

export interface MissionProgress {
  completed: boolean;
  bestStars: number;
  timesPlayed: number;
}

export interface IslandProgress {
  status: IslandStatus;
  stars: number;
  questionsAnswered: number;
  correctAnswers: number;
  missions: Record<string, MissionProgress>;
}

export interface GameProgress {
  /** Chave = número da tabuada (2..10) como string. */
  islands: Record<string, IslandProgress>;
  currentIsland: number;
  tutorialSeen: boolean;
  onboardingDone: boolean;
}

/* ------------------------------------------------------------------ */
/* Estatísticas e domínio (mastery)                                    */
/* ------------------------------------------------------------------ */

export interface FactStat {
  attempts: number;
  correct: number;
  incorrect: number;
  /** ISO date da última vez que a questão foi respondida. */
  lastSeenAt: string | null;
  /** Resultado das últimas tentativas, mais recente por último. */
  recent: boolean[];
  masteryScore: number;
}

export interface PlayerStatistics {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  currentStreak: number;
  bestStreak: number;
  playSessions: number;
  facts: Record<FactKey, FactStat>;
}

/* ------------------------------------------------------------------ */
/* Conquistas                                                          */
/* ------------------------------------------------------------------ */

export interface AchievementState {
  id: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

/* ------------------------------------------------------------------ */
/* Estado global persistido                                            */
/* ------------------------------------------------------------------ */

export interface GameState {
  schemaVersion: number;
  player: PlayerProfile | null;
  settings: GameSettings;
  progress: GameProgress;
  statistics: PlayerStatistics;
  achievements: AchievementState[];
}
