export const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type TableNumber = (typeof TABLES)[number];
export type Locale = 'pt-BR' | 'en-US';
export type IslandStatus = 'locked' | 'available' | 'inProgress' | 'completed';
export type AvatarStyle = 'explorer' | 'builder';
export type HairStyle = 'round' | 'spiky' | 'curly';
export type Accessory = 'none' | 'glasses' | 'cap';

export interface PlayerProfile {
  name: string;
  avatarStyle: AvatarStyle;
  outfitColor: string;
  hairStyle: HairStyle;
  accessory: Accessory;
  createdAt: string;
}

export interface GameSettings {
  locale: Locale;
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
}

export interface FactMastery {
  attempts: number;
  correct: number;
  incorrect: number;
  lastSeenAt: string;
  masteryScore: number;
}

export interface TableProgress {
  status: IslandStatus;
  stars: 0 | 1 | 2 | 3;
  questionsAnswered: number;
  correctAnswers: number;
  completedAt: string | null;
}

export interface GameProgress {
  tables: Record<string, TableProgress>;
  mastery: Record<string, FactMastery>;
  lastPlayedTable: TableNumber | null;
  activeMission: {
    table: TableNumber;
    completedSteps: number;
    correct: number;
    incorrect: number;
    currentQuestion: Question;
    feedback: 'correct' | 'incorrect' | null;
  } | null;
}

export interface PlayerStatistics {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  currentStreak: number;
  bestStreak: number;
  playSessions: number;
}

export type AchievementId =
  'first-correct' | 'ten-correct' | 'streak-five' | 'table-two' | 'first-island' | 'fifty-correct';

export interface AchievementState {
  id: AchievementId;
  unlockedAt: string | null;
}

export interface GameState {
  schemaVersion: 1;
  player: PlayerProfile | null;
  settings: GameSettings;
  progress: GameProgress;
  statistics: PlayerStatistics;
  achievements: AchievementState[];
}

export interface Question {
  key: string;
  left: TableNumber;
  right: number;
  answer: number;
  options: number[];
}
