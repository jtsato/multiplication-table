import { describe, expect, it } from 'vitest';
import {
  applyMissionResult,
  archipelagoCompletion,
  computeStars,
  createInitialProgress,
  getIslandProgress,
  isIslandFinished,
  islandStatus,
  missionProgress,
  nextMissionForTable,
  tableAfter,
  unlockedTables,
} from './progression';
import { missionsForTable } from './missions';
import { TABLES } from './facts';
import type { GameProgress } from './types';

const AT = '2026-01-01T10:00:00.000Z';

/** Conclui todas as missoes de uma tabuada com a precisao informada. */
function finishTable(progress: GameProgress, table: number, accuracy = 1): GameProgress {
  let current = progress;
  for (const mission of missionsForTable(table)) {
    const correct = Math.round(mission.questionCount * accuracy);
    current = applyMissionResult(current, {
      missionId: mission.id,
      table,
      questionsAnswered: mission.questionCount,
      firstTryCorrect: correct,
      completedAt: AT,
    }).progress;
  }
  return current;
}

describe('estado inicial', () => {
  it('cria uma ilha para cada tabuada de 2 a 10', () => {
    const progress = createInitialProgress();
    expect(Object.keys(progress.islands)).toHaveLength(9);
    for (const table of TABLES) {
      expect(getIslandProgress(progress, table).table).toBe(table);
    }
  });

  it('deixa a tabuada do 2 disponivel', () => {
    const progress = createInitialProgress();
    expect(islandStatus(progress, 2)).toBe('available');
    expect(progress.currentTable).toBe(2);
  });

  it('deixa todas as tabuadas seguintes bloqueadas', () => {
    const progress = createInitialProgress();
    for (const table of [3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(islandStatus(progress, table)).toBe('locked');
    }
    expect(unlockedTables(progress)).toEqual([2]);
  });
});

describe('tableAfter', () => {
  it('segue a ordem linear', () => {
    expect(tableAfter(2)).toBe(3);
    expect(tableAfter(9)).toBe(10);
  });

  it('nao tem tabuada depois da ultima', () => {
    expect(tableAfter(10)).toBeNull();
  });
});

describe('computeStars', () => {
  it('da 3 estrelas a partir de 90%', () => {
    expect(computeStars(9, 10)).toBe(3);
    expect(computeStars(10, 10)).toBe(3);
  });

  it('da 2 estrelas a partir da precisao recomendada de 80%', () => {
    expect(computeStars(8, 10)).toBe(2);
  });

  it('da 1 estrela para quem concluiu com dificuldade', () => {
    expect(computeStars(3, 10)).toBe(1);
    expect(computeStars(0, 10)).toBe(1);
  });

  it('da 0 estrela sem perguntas respondidas', () => {
    expect(computeStars(0, 0)).toBe(0);
  });
});

describe('applyMissionResult', () => {
  it('marca a missao como concluida e acumula as perguntas', () => {
    const progress = createInitialProgress();
    const { progress: updated } = applyMissionResult(progress, {
      missionId: 't2-m1',
      table: 2,
      questionsAnswered: 5,
      firstTryCorrect: 4,
      completedAt: AT,
    });
    const island = getIslandProgress(updated, 2);
    expect(island.completedMissionIds).toEqual(['t2-m1']);
    expect(island.questionsAnswered).toBe(5);
    expect(island.firstTryCorrect).toBe(4);
    expect(islandStatus(updated, 2)).toBe('inProgress');
  });

  it('nao muta o progresso recebido', () => {
    const progress = createInitialProgress();
    applyMissionResult(progress, {
      missionId: 't2-m1',
      table: 2,
      questionsAnswered: 5,
      firstTryCorrect: 5,
      completedAt: AT,
    });
    expect(getIslandProgress(progress, 2).completedMissionIds).toEqual([]);
  });

  it('nao duplica a missao quando ela e refeita', () => {
    let progress = createInitialProgress();
    progress = applyMissionResult(progress, {
      missionId: 't2-m1',
      table: 2,
      questionsAnswered: 5,
      firstTryCorrect: 5,
      completedAt: AT,
    }).progress;
    progress = applyMissionResult(progress, {
      missionId: 't2-m1',
      table: 2,
      questionsAnswered: 5,
      firstTryCorrect: 3,
      completedAt: AT,
    }).progress;
    expect(getIslandProgress(progress, 2).completedMissionIds).toEqual(['t2-m1']);
  });

  it('nao libera a proxima tabuada antes do desafio final', () => {
    let progress = createInitialProgress();
    for (const mission of missionsForTable(2).filter((m) => !m.isFinalChallenge)) {
      progress = applyMissionResult(progress, {
        missionId: mission.id,
        table: 2,
        questionsAnswered: mission.questionCount,
        firstTryCorrect: mission.questionCount,
        completedAt: AT,
      }).progress;
    }
    expect(islandStatus(progress, 2)).toBe('inProgress');
    expect(islandStatus(progress, 3)).toBe('locked');
  });

  it('libera a proxima tabuada ao concluir todas as missoes', () => {
    const progress = finishTable(createInitialProgress(), 2);
    expect(islandStatus(progress, 2)).toBe('completed');
    expect(islandStatus(progress, 3)).toBe('available');
    expect(islandStatus(progress, 4)).toBe('locked');
    expect(isIslandFinished(progress, 2)).toBe(true);
  });

  it('sinaliza a conclusao e a tabuada liberada apenas uma vez', () => {
    let progress = createInitialProgress();
    const missions = missionsForTable(2);
    const last = missions[missions.length - 1]!;
    for (const mission of missions.slice(0, -1)) {
      progress = applyMissionResult(progress, {
        missionId: mission.id,
        table: 2,
        questionsAnswered: mission.questionCount,
        firstTryCorrect: mission.questionCount,
        completedAt: AT,
      }).progress;
    }

    const outcome = applyMissionResult(progress, {
      missionId: last.id,
      table: 2,
      questionsAnswered: last.questionCount,
      firstTryCorrect: last.questionCount,
      completedAt: AT,
    });
    expect(outcome.islandCompleted).toBe(true);
    expect(outcome.unlockedTable).toBe(3);

    const repeat = applyMissionResult(outcome.progress, {
      missionId: last.id,
      table: 2,
      questionsAnswered: last.questionCount,
      firstTryCorrect: last.questionCount,
      completedAt: AT,
    });
    expect(repeat.islandCompleted).toBe(false);
    expect(repeat.unlockedTable).toBeNull();
  });

  it('deixa a crianca avancar mesmo com desempenho baixo', () => {
    const progress = finishTable(createInitialProgress(), 2, 0.4);
    expect(islandStatus(progress, 2)).toBe('completed');
    expect(islandStatus(progress, 3)).toBe('available');
    expect(getIslandProgress(progress, 2).stars).toBe(1);
  });

  it('nao rebaixa estrelas ja conquistadas', () => {
    let progress = finishTable(createInitialProgress(), 2, 1);
    expect(getIslandProgress(progress, 2).stars).toBe(3);
    const missions = missionsForTable(2);
    progress = applyMissionResult(progress, {
      missionId: missions[0]!.id,
      table: 2,
      questionsAnswered: 5,
      firstTryCorrect: 0,
      completedAt: AT,
    }).progress;
    expect(getIslandProgress(progress, 2).stars).toBe(3);
  });

  it('nao existe tabuada para liberar depois da ultima ilha', () => {
    let progress = createInitialProgress();
    for (const table of TABLES) {
      progress = finishTable(progress, table);
    }
    expect(archipelagoCompletion(progress)).toBe(1);
    const missions = missionsForTable(10);
    const outcome = applyMissionResult(progress, {
      missionId: missions[0]!.id,
      table: 10,
      questionsAnswered: 5,
      firstTryCorrect: 5,
      completedAt: AT,
    });
    expect(outcome.unlockedTable).toBeNull();
  });

  it('progride ilha por ilha ate o fim do arquipelago', () => {
    let progress = createInitialProgress();
    for (const table of TABLES) {
      expect(getIslandProgress(progress, table).unlocked).toBe(true);
      progress = finishTable(progress, table);
    }
    for (const table of TABLES) {
      expect(islandStatus(progress, table)).toBe('completed');
    }
  });
});

describe('missoes da ilha', () => {
  it('aponta a primeira missao pendente', () => {
    const progress = createInitialProgress();
    expect(nextMissionForTable(progress, 2)?.id).toBe('t2-m1');
  });

  it('nao sobra missao depois da ilha concluida', () => {
    const progress = finishTable(createInitialProgress(), 2);
    expect(nextMissionForTable(progress, 2)).toBeUndefined();
    expect(missionProgress(progress, 2)).toEqual({ completed: 4, total: 4 });
  });
});
