import { describe, expect, it } from 'vitest';
import {
  applyMissionOutcome,
  createInitialProgress,
  getIslandProgress,
  overallProgress,
  starsForAccuracy,
  suggestedTable,
  unlockedTables,
} from '../domain/progression';
import { ISLANDS, getIsland, nextTable } from '../domain/world';
import type { GameProgress } from '../domain/types';

function completeIsland(progress: GameProgress, table: number, accuracy = 1): GameProgress {
  let current = progress;
  for (const mission of getIsland(table).missions) {
    const total = mission.questionCount;
    const correct = Math.round(total * accuracy);
    current = applyMissionOutcome(current, {
      table,
      missionId: mission.id,
      correct,
      total,
    }).progress;
  }
  return current;
}

describe('createInitialProgress', () => {
  it('começa com a tabuada do 2 liberada', () => {
    const progress = createInitialProgress();
    expect(getIslandProgress(progress, 2).status).toBe('available');
  });

  it('começa com todas as outras tabuadas bloqueadas', () => {
    const progress = createInitialProgress();
    for (const island of ISLANDS.filter((i) => i.table !== 2)) {
      expect(getIslandProgress(progress, island.table).status).toBe('locked');
    }
  });
});

describe('applyMissionOutcome', () => {
  it('marca a missão como concluída e a ilha como em progresso', () => {
    const result = applyMissionOutcome(createInitialProgress(), {
      table: 2,
      missionId: 't2-m1',
      correct: 5,
      total: 5,
    });
    expect(result.progress.islands['2']!.missions['t2-m1']!.completed).toBe(true);
    expect(result.progress.islands['2']!.status).toBe('inProgress');
    expect(result.islandCompleted).toBe(false);
    expect(result.unlockedTable).toBe(null);
  });

  it('não libera a próxima ilha antes de todas as missões', () => {
    const progress = applyMissionOutcome(createInitialProgress(), {
      table: 2,
      missionId: 't2-m1',
      correct: 5,
      total: 5,
    }).progress;
    expect(getIslandProgress(progress, 3).status).toBe('locked');
  });

  it('libera a próxima tabuada ao concluir todas as missões', () => {
    const progress = completeIsland(createInitialProgress(), 2);
    expect(getIslandProgress(progress, 2).status).toBe('completed');
    expect(getIslandProgress(progress, 3).status).toBe('available');
    expect(getIslandProgress(progress, 4).status).toBe('locked');
  });

  it('permite avançar mesmo com desempenho abaixo do recomendado', () => {
    const progress = completeIsland(createInitialProgress(), 2, 0.6);
    expect(getIslandProgress(progress, 2).status).toBe('completed');
    expect(getIslandProgress(progress, 3).status).toBe('available');
    expect(getIslandProgress(progress, 2).stars).toBeLessThan(3);
  });

  it('guarda a melhor pontuação ao repetir uma missão', () => {
    let progress = applyMissionOutcome(createInitialProgress(), {
      table: 2,
      missionId: 't2-m1',
      correct: 5,
      total: 5,
    }).progress;
    progress = applyMissionOutcome(progress, {
      table: 2,
      missionId: 't2-m1',
      correct: 2,
      total: 5,
    }).progress;
    expect(progress.islands['2']!.missions['t2-m1']!.bestStars).toBe(3);
    expect(progress.islands['2']!.missions['t2-m1']!.timesPlayed).toBe(2);
  });

  it('sinaliza a conclusão da ilha apenas uma vez', () => {
    const progress = completeIsland(createInitialProgress(), 2);
    const again = applyMissionOutcome(progress, {
      table: 2,
      missionId: 't2-m1',
      correct: 5,
      total: 5,
    });
    expect(again.islandCompleted).toBe(false);
  });

  it('percorre todo o arquipélago do 2 ao 10', () => {
    let progress = createInitialProgress();
    let table: number | null = 2;
    while (table !== null) {
      expect(getIslandProgress(progress, table).status).not.toBe('locked');
      progress = completeIsland(progress, table);
      table = nextTable(table);
    }
    expect(overallProgress(progress)).toBe(1);
    expect(unlockedTables(progress)).toHaveLength(ISLANDS.length);
  });
});

describe('estrelas e sugestões', () => {
  it('converte aproveitamento em estrelas', () => {
    expect(starsForAccuracy(1)).toBe(3);
    expect(starsForAccuracy(0.8)).toBe(2);
    expect(starsForAccuracy(0.4)).toBe(1);
  });

  it('sugere a ilha em construção', () => {
    const progress = applyMissionOutcome(createInitialProgress(), {
      table: 2,
      missionId: 't2-m1',
      correct: 4,
      total: 5,
    }).progress;
    expect(suggestedTable(progress)).toBe(2);
    expect(suggestedTable(completeIsland(progress, 2))).toBe(3);
  });
});
