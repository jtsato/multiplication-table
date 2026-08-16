import { TABLES, type GameState, type TableNumber } from './types';

function starsFor(correct: number, total: number): 1 | 2 | 3 {
  const accuracy = total === 0 ? 0 : correct / total;
  if (accuracy >= 0.8) return 3;
  if (accuracy >= 0.6) return 2;
  return 1;
}

export function completeIsland(
  state: GameState,
  table: TableNumber,
  correct: number,
  incorrect: number,
  now = new Date().toISOString(),
): GameState {
  const total = correct + incorrect;
  const nextTable = TABLES[TABLES.indexOf(table) + 1];
  const tables = {
    ...state.progress.tables,
    [String(table)]: {
      ...state.progress.tables[String(table)],
      status: 'completed' as const,
      stars: Math.max(state.progress.tables[String(table)].stars, starsFor(correct, total)) as
        1 | 2 | 3,
      questionsAnswered: state.progress.tables[String(table)].questionsAnswered + total,
      correctAnswers: state.progress.tables[String(table)].correctAnswers + correct,
      completedAt: state.progress.tables[String(table)].completedAt ?? now,
    },
  };
  if (nextTable && tables[String(nextTable)].status === 'locked') {
    tables[String(nextTable)] = { ...tables[String(nextTable)], status: 'available' };
  }
  return {
    ...state,
    progress: { ...state.progress, tables, lastPlayedTable: table, activeMission: null },
  };
}
