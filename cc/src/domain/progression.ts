import { FIRST_TABLE, LAST_TABLE, TABLES } from './facts';
import { missionsForTable, nextMission } from './missions';
import type { GameProgress, IslandProgress, IslandStatus } from './types';

/**
 * Regras de progressao do arquipelago.
 *
 * Decisao de produto (secao 18 do briefing): concluir todas as missoes da ilha
 * SEMPRE libera a proxima. A precisao de 80% nao e um portao, e um objetivo:
 * ela define as estrelas. Assim nenhuma crianca fica presa, e as contas ainda
 * fracas continuam voltando pelo sistema de revisao.
 */

/** Precisao recomendada por ilha. Vira estrela, nunca bloqueio. */
export const RECOMMENDED_ACCURACY = 0.8;

const THREE_STAR_ACCURACY = 0.9;
const TWO_STAR_ACCURACY = RECOMMENDED_ACCURACY;

export function createIslandProgress(table: number): IslandProgress {
  return {
    table,
    unlocked: table === FIRST_TABLE,
    completed: false,
    completedMissionIds: [],
    stars: 0,
    questionsAnswered: 0,
    firstTryCorrect: 0,
    completedAt: null,
  };
}

export function createInitialProgress(): GameProgress {
  const islands: Record<string, IslandProgress> = {};
  for (const table of TABLES) {
    islands[String(table)] = createIslandProgress(table);
  }
  return { islands, currentTable: FIRST_TABLE };
}

export function getIslandProgress(progress: GameProgress, table: number): IslandProgress {
  return progress.islands[String(table)] ?? createIslandProgress(table);
}

export function islandStatus(progress: GameProgress, table: number): IslandStatus {
  const island = getIslandProgress(progress, table);
  if (island.completed) {
    return 'completed';
  }
  if (!island.unlocked) {
    return 'locked';
  }
  return island.completedMissionIds.length > 0 ? 'inProgress' : 'available';
}

export function unlockedTables(progress: GameProgress): number[] {
  return TABLES.filter((table) => getIslandProgress(progress, table).unlocked);
}

/** Tabuada seguinte na ordem linear, ou null se esta e a ultima. */
export function tableAfter(table: number): number | null {
  const index = TABLES.indexOf(table);
  if (index === -1 || index === TABLES.length - 1) {
    return null;
  }
  return TABLES[index + 1] ?? null;
}

/** Tabuada anterior na ordem linear, ou null se esta e a primeira. */
export function tableBefore(table: number): number | null {
  const index = TABLES.indexOf(table);
  if (index <= 0) {
    return null;
  }
  return TABLES[index - 1] ?? null;
}

export function accuracy(firstTryCorrect: number, questionsAnswered: number): number {
  if (questionsAnswered <= 0) {
    return 0;
  }
  return firstTryCorrect / questionsAnswered;
}

/** Estrelas da ilha: 1 por concluir, 2 a partir de 80%, 3 a partir de 90%. */
export function computeStars(firstTryCorrect: number, questionsAnswered: number): number {
  if (questionsAnswered <= 0) {
    return 0;
  }
  const rate = accuracy(firstTryCorrect, questionsAnswered);
  if (rate >= THREE_STAR_ACCURACY) {
    return 3;
  }
  if (rate >= TWO_STAR_ACCURACY) {
    return 2;
  }
  return 1;
}

export function meetsRecommendedAccuracy(island: IslandProgress): boolean {
  return accuracy(island.firstTryCorrect, island.questionsAnswered) >= RECOMMENDED_ACCURACY;
}

/** Quantas missoes da ilha ja foram concluidas, entre 0 e o total. */
export function missionProgress(
  progress: GameProgress,
  table: number,
): {
  completed: number;
  total: number;
} {
  const total = missionsForTable(table).length;
  const island = getIslandProgress(progress, table);
  const completed = missionsForTable(table).filter((mission) =>
    island.completedMissionIds.includes(mission.id),
  ).length;
  return { completed, total };
}

export function isIslandFinished(progress: GameProgress, table: number): boolean {
  const { completed, total } = missionProgress(progress, table);
  return total > 0 && completed >= total;
}

export function nextMissionForTable(progress: GameProgress, table: number) {
  return nextMission(table, getIslandProgress(progress, table).completedMissionIds);
}

export interface MissionResult {
  missionId: string;
  table: number;
  questionsAnswered: number;
  /** Acertos de primeira tentativa - a base honesta da precisao. */
  firstTryCorrect: number;
  completedAt: string;
}

export interface MissionOutcome {
  progress: GameProgress;
  islandCompleted: boolean;
  /** Tabuada liberada por este resultado, se houve alguma. */
  unlockedTable: number | null;
}

/**
 * Aplica o resultado de uma missao ao progresso.
 * Funcao pura: devolve um progresso novo, nunca altera o recebido.
 */
export function applyMissionResult(progress: GameProgress, result: MissionResult): MissionOutcome {
  const island = getIslandProgress(progress, result.table);
  const alreadyDone = island.completedMissionIds.includes(result.missionId);

  const completedMissionIds = alreadyDone
    ? island.completedMissionIds
    : [...island.completedMissionIds, result.missionId];

  const questionsAnswered = island.questionsAnswered + result.questionsAnswered;
  const firstTryCorrect = island.firstTryCorrect + result.firstTryCorrect;

  const total = missionsForTable(result.table).length;
  const finished = total > 0 && completedMissionIds.length >= total;

  const updatedIsland: IslandProgress = {
    ...island,
    completedMissionIds,
    questionsAnswered,
    firstTryCorrect,
    completed: island.completed || finished,
    stars: Math.max(island.stars, finished ? computeStars(firstTryCorrect, questionsAnswered) : 0),
    completedAt: island.completedAt ?? (finished ? result.completedAt : null),
  };

  const islands: Record<string, IslandProgress> = {
    ...progress.islands,
    [String(result.table)]: updatedIsland,
  };

  const justCompleted = finished && !island.completed;
  const following = tableAfter(result.table);
  let unlockedTable: number | null = null;

  if (justCompleted && following !== null) {
    const nextIsland = progress.islands[String(following)] ?? createIslandProgress(following);
    if (!nextIsland.unlocked) {
      unlockedTable = following;
    }
    islands[String(following)] = { ...nextIsland, unlocked: true };
  }

  return {
    progress: {
      ...progress,
      islands,
      currentTable: justCompleted && following !== null ? following : progress.currentTable,
    },
    islandCompleted: justCompleted,
    unlockedTable,
  };
}

/** Percentual do arquipelago concluido, 0..1. Usado na tela inicial. */
export function archipelagoCompletion(progress: GameProgress): number {
  const completed = TABLES.filter((table) => getIslandProgress(progress, table).completed).length;
  return completed / TABLES.length;
}

export function completedIslandCount(progress: GameProgress): number {
  return TABLES.filter((table) => getIslandProgress(progress, table).completed).length;
}

export function isArchipelagoComplete(progress: GameProgress): boolean {
  return completedIslandCount(progress) === TABLES.length;
}

export { FIRST_TABLE, LAST_TABLE };
