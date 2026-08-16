import { FIRST_TABLE, ISLANDS, getIsland, nextTable } from './world';
import type { GameProgress, IslandProgress, MissionProgress } from './types';

/** Desempenho recomendado para 3 estrelas. */
export const GREAT_ACCURACY = 0.9;
export const GOOD_ACCURACY = 0.75;
/** Mínimo de questões por ilha (garantido pelo desenho das missões). */
export const MIN_QUESTIONS_PER_ISLAND = 25;
/** Desempenho recomendado — não bloqueia, apenas orienta a revisão. */
export const RECOMMENDED_ACCURACY = 0.8;

export function emptyMissionProgress(): MissionProgress {
  return { completed: false, bestStars: 0, timesPlayed: 0 };
}

export function emptyIslandProgress(status: IslandProgress['status']): IslandProgress {
  return { status, stars: 0, questionsAnswered: 0, correctAnswers: 0, missions: {} };
}

export function createInitialProgress(): GameProgress {
  const islands: Record<string, IslandProgress> = {};
  for (const island of ISLANDS) {
    islands[String(island.table)] = emptyIslandProgress(
      island.table === FIRST_TABLE ? 'available' : 'locked',
    );
  }
  return {
    islands,
    currentIsland: FIRST_TABLE,
    tutorialSeen: false,
    onboardingDone: false,
  };
}

export function getIslandProgress(progress: GameProgress, table: number): IslandProgress {
  return progress.islands[String(table)] ?? emptyIslandProgress('locked');
}

export function getMissionProgress(
  progress: GameProgress,
  table: number,
  missionId: string,
): MissionProgress {
  return getIslandProgress(progress, table).missions[missionId] ?? emptyMissionProgress();
}

export function starsForAccuracy(accuracy: number): number {
  if (accuracy >= GREAT_ACCURACY) return 3;
  if (accuracy >= GOOD_ACCURACY) return 2;
  return 1;
}

/** Estrelas da ilha = média das melhores estrelas das missões concluídas. */
export function computeIslandStars(island: IslandProgress, missionCount: number): number {
  const total = Object.values(island.missions).reduce((sum, m) => sum + m.bestStars, 0);
  if (missionCount === 0) return 0;
  return Math.round(total / missionCount);
}

export function allMissionsCompleted(island: IslandProgress, table: number): boolean {
  const defs = getIsland(table).missions;
  return defs.every((def) => island.missions[def.id]?.completed === true);
}

/** Tabuadas jogáveis ou já concluídas (usadas pela revisão adaptativa). */
export function unlockedTables(progress: GameProgress): number[] {
  return ISLANDS.map((i) => i.table).filter(
    (table) => getIslandProgress(progress, table).status !== 'locked',
  );
}

export interface MissionOutcome {
  table: number;
  missionId: string;
  correct: number;
  total: number;
}

export interface ProgressUpdate {
  progress: GameProgress;
  stars: number;
  islandCompleted: boolean;
  unlockedTable: number | null;
}

/**
 * Aplica o resultado de uma missão ao progresso.
 * Concluir todas as missões de uma ilha a marca como concluída e libera a próxima.
 */
export function applyMissionOutcome(
  progress: GameProgress,
  outcome: MissionOutcome,
): ProgressUpdate {
  const { table, missionId, correct, total } = outcome;
  const island = getIslandProgress(progress, table);
  const previousMission = island.missions[missionId] ?? emptyMissionProgress();
  const accuracy = total > 0 ? correct / total : 0;
  const stars = starsForAccuracy(accuracy);

  const mission: MissionProgress = {
    completed: true,
    bestStars: Math.max(previousMission.bestStars, stars),
    timesPlayed: previousMission.timesPlayed + 1,
  };

  const updatedIsland: IslandProgress = {
    ...island,
    missions: { ...island.missions, [missionId]: mission },
    questionsAnswered: island.questionsAnswered + total,
    correctAnswers: island.correctAnswers + correct,
    status: 'inProgress',
  };

  const missionCount = getIsland(table).missions.length;
  const completed = allMissionsCompleted(updatedIsland, table);
  const wasCompleted = island.status === 'completed';
  if (completed) updatedIsland.status = 'completed';
  updatedIsland.stars = computeIslandStars(updatedIsland, missionCount);

  const islands: Record<string, IslandProgress> = {
    ...progress.islands,
    [String(table)]: updatedIsland,
  };

  let unlocked: number | null = null;
  if (completed) {
    const next = nextTable(table);
    if (next !== null && getIslandProgress(progress, next).status === 'locked') {
      islands[String(next)] = emptyIslandProgress('available');
      unlocked = next;
    }
  }

  return {
    progress: { ...progress, islands, currentIsland: table },
    stars,
    islandCompleted: completed && !wasCompleted,
    unlockedTable: unlocked,
  };
}

/** Ilha sugerida ao abrir o mapa. */
export function suggestedTable(progress: GameProgress): number {
  const inProgress = ISLANDS.find(
    (i) => getIslandProgress(progress, i.table).status === 'inProgress',
  );
  if (inProgress) return inProgress.table;
  const available = ISLANDS.find(
    (i) => getIslandProgress(progress, i.table).status === 'available',
  );
  return available ? available.table : FIRST_TABLE;
}

/** Progresso global 0..1 para a barra do mapa. */
export function overallProgress(progress: GameProgress): number {
  const completed = ISLANDS.filter(
    (i) => getIslandProgress(progress, i.table).status === 'completed',
  ).length;
  return completed / ISLANDS.length;
}
