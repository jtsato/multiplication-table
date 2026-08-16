import { TABLES, type AchievementId, type GameState, type TableProgress } from './types';

const achievementIds: AchievementId[] = [
  'first-correct',
  'ten-correct',
  'streak-five',
  'table-two',
  'first-island',
  'fifty-correct',
];

const defaultTableProgress = (available: boolean): TableProgress => ({
  status: available ? 'available' : 'locked',
  stars: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  completedAt: null,
});

export function createDefaultGameState(): GameState {
  return {
    schemaVersion: 1,
    player: null,
    settings: { locale: 'pt-BR', musicEnabled: true, soundEffectsEnabled: true },
    progress: {
      tables: Object.fromEntries(
        TABLES.map((table) => [String(table), defaultTableProgress(table === 2)]),
      ),
      mastery: {},
      lastPlayedTable: null,
      activeMission: null,
    },
    statistics: {
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      currentStreak: 0,
      bestStreak: 0,
      playSessions: 0,
    },
    achievements: achievementIds.map((id) => ({ id, unlockedAt: null })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const numberOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

function sanitizeCurrentState(value: Record<string, unknown>, fallback: GameState): GameState {
  const settings = isRecord(value.settings) ? value.settings : {};
  const progress = isRecord(value.progress) ? value.progress : {};
  const savedTables = isRecord(progress.tables) ? progress.tables : {};
  const tables = Object.fromEntries(
    TABLES.map((table) => {
      const base = fallback.progress.tables[String(table)];
      const rawSavedTable = savedTables[String(table)];
      const saved: Record<string, unknown> = isRecord(rawSavedTable) ? rawSavedTable : {};
      const validStatuses = ['locked', 'available', 'inProgress', 'completed'];
      const status = validStatuses.includes(String(saved.status))
        ? (saved.status as TableProgress['status'])
        : base.status;
      const stars = [0, 1, 2, 3].includes(Number(saved.stars))
        ? (Number(saved.stars) as TableProgress['stars'])
        : base.stars;
      return [
        String(table),
        {
          status,
          stars,
          questionsAnswered: numberOr(saved.questionsAnswered, base.questionsAnswered),
          correctAnswers: numberOr(saved.correctAnswers, base.correctAnswers),
          completedAt: typeof saved.completedAt === 'string' ? saved.completedAt : null,
        },
      ];
    }),
  );
  const mastery: GameState['progress']['mastery'] = {};
  if (isRecord(progress.mastery)) {
    for (const [key, raw] of Object.entries(progress.mastery)) {
      const keyMatch = key.match(/^(\d+)x(\d+)$/);
      if (
        !isRecord(raw) ||
        !keyMatch ||
        !TABLES.includes(Number(keyMatch[1]) as never) ||
        Number(keyMatch[2]) < 1 ||
        Number(keyMatch[2]) > 10
      )
        continue;
      if (
        typeof raw.attempts !== 'number' ||
        typeof raw.correct !== 'number' ||
        typeof raw.incorrect !== 'number' ||
        typeof raw.lastSeenAt !== 'string' ||
        typeof raw.masteryScore !== 'number'
      )
        continue;
      mastery[key] = {
        attempts: numberOr(raw.attempts, 0),
        correct: numberOr(raw.correct, 0),
        incorrect: numberOr(raw.incorrect, 0),
        lastSeenAt: raw.lastSeenAt,
        masteryScore: Math.max(0, Math.min(1, raw.masteryScore)),
      };
    }
  }
  const statistics = isRecord(value.statistics) ? value.statistics : {};
  const rawPlayer = isRecord(value.player) ? value.player : null;
  const player: GameState['player'] =
    rawPlayer &&
    typeof rawPlayer.name === 'string' &&
    ['explorer', 'builder'].includes(String(rawPlayer.avatarStyle)) &&
    typeof rawPlayer.outfitColor === 'string' &&
    ['round', 'spiky', 'curly'].includes(String(rawPlayer.hairStyle)) &&
    ['none', 'glasses', 'cap'].includes(String(rawPlayer.accessory)) &&
    typeof rawPlayer.createdAt === 'string'
      ? (rawPlayer as unknown as GameState['player'])
      : null;
  const rawMission = isRecord(progress.activeMission) ? progress.activeMission : null;
  const rawQuestion =
    rawMission && isRecord(rawMission.currentQuestion) ? rawMission.currentQuestion : null;
  const missionFeedback = rawMission?.feedback ?? null;
  const completedSteps = Number(rawMission?.completedSteps);
  const missionCorrect = Number(rawMission?.correct);
  const missionIncorrect = Number(rawMission?.incorrect);
  const questionTable = Number(rawQuestion?.left);
  const questionFactor = Number(rawQuestion?.right);
  const questionAnswer = Number(rawQuestion?.answer);
  const questionOptions = rawQuestion?.options;
  const validMission =
    rawMission &&
    TABLES.includes(rawMission.table as never) &&
    Number.isInteger(completedSteps) &&
    completedSteps >= 0 &&
    completedSteps < 6 &&
    Number.isInteger(missionCorrect) &&
    missionCorrect >= 0 &&
    Number.isInteger(missionIncorrect) &&
    missionIncorrect >= 0 &&
    [null, 'correct', 'incorrect'].includes(missionFeedback as never) &&
    rawQuestion &&
    TABLES.includes(questionTable as never) &&
    Number.isInteger(questionFactor) &&
    questionFactor >= 1 &&
    questionFactor <= 10 &&
    questionAnswer === questionTable * questionFactor &&
    typeof rawQuestion.key === 'string' &&
    rawQuestion.key === `${questionTable}x${questionFactor}` &&
    Array.isArray(questionOptions) &&
    questionOptions.length === 4 &&
    questionOptions.every((option) => typeof option === 'number') &&
    new Set(questionOptions).size === 4 &&
    questionOptions.includes(questionAnswer);
  const savedAchievements = Array.isArray(value.achievements) ? value.achievements : [];
  return {
    ...fallback,
    player,
    settings: {
      locale: settings.locale === 'en-US' ? 'en-US' : 'pt-BR',
      musicEnabled: typeof settings.musicEnabled === 'boolean' ? settings.musicEnabled : true,
      soundEffectsEnabled:
        typeof settings.soundEffectsEnabled === 'boolean' ? settings.soundEffectsEnabled : true,
    },
    progress: {
      tables,
      mastery,
      lastPlayedTable: TABLES.includes(progress.lastPlayedTable as never)
        ? (progress.lastPlayedTable as GameState['progress']['lastPlayedTable'])
        : null,
      activeMission: validMission
        ? ({
            ...rawMission,
            feedback: missionFeedback,
          } as unknown as GameState['progress']['activeMission'])
        : null,
    },
    statistics: {
      totalQuestions: numberOr(statistics.totalQuestions, 0),
      totalCorrect: numberOr(statistics.totalCorrect, 0),
      totalIncorrect: numberOr(statistics.totalIncorrect, 0),
      currentStreak: numberOr(statistics.currentStreak, 0),
      bestStreak: numberOr(statistics.bestStreak, 0),
      playSessions: numberOr(statistics.playSessions, 0),
    },
    achievements: fallback.achievements.map((achievement) => {
      const saved = savedAchievements.find((item) => isRecord(item) && item.id === achievement.id);
      return isRecord(saved) && (saved.unlockedAt === null || typeof saved.unlockedAt === 'string')
        ? { ...achievement, unlockedAt: saved.unlockedAt }
        : achievement;
    }),
  };
}

export function migrateState(value: unknown): GameState {
  const fallback = createDefaultGameState();
  if (!isRecord(value)) return fallback;

  if (value.schemaVersion === 0) {
    return {
      ...fallback,
      settings: {
        ...fallback.settings,
        locale: value.locale === 'en-US' ? 'en-US' : 'pt-BR',
      },
      statistics: {
        ...fallback.statistics,
        totalCorrect: typeof value.totalCorrect === 'number' ? value.totalCorrect : 0,
      },
    };
  }

  if (value.schemaVersion !== 1) return fallback;
  return sanitizeCurrentState(value, fallback);
}
