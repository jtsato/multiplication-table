import { TABLES } from './facts';

/**
 * Missoes: a camada que transforma multiplicacao em construcao.
 *
 * Uma missao e apenas dados. Quem sabe desenhar uma ponte e a camada de arte
 * (`src/art/scenes.ts`), que recebe o `scene` e o progresso 0..1. Adicionar
 * uma missao nova = adicionar uma linha em MISSION_LAYOUT + as chaves de
 * traducao correspondentes.
 */

export type SceneType =
  | 'bridge'
  | 'tower'
  | 'lighthouse'
  | 'trees'
  | 'house'
  | 'gate'
  | 'boat'
  | 'fence'
  | 'windmill'
  | 'crystal';

export interface MissionDefinition {
  id: string;
  table: number;
  scene: SceneType;
  /** Perguntas necessarias para concluir a construcao. */
  questionCount: number;
  /** Missao maior que encerra a ilha e libera a proxima tabuada. */
  isFinalChallenge: boolean;
  /** Posicao da missao dentro da ilha, comecando em 1. */
  order: number;
}

/** Perguntas por missao: sessoes curtas, de 2 a 5 minutos. */
const REGULAR_QUESTION_COUNTS = [5, 6, 6] as const;
const FINAL_QUESTION_COUNT = 8;

/** Tres missoes normais + um desafio final por ilha. */
const MISSION_LAYOUT: Record<number, { regular: readonly SceneType[]; final: SceneType }> = {
  2: { regular: ['bridge', 'trees', 'fence'], final: 'windmill' },
  3: { regular: ['trees', 'boat', 'bridge'], final: 'house' },
  4: { regular: ['gate', 'bridge', 'tower'], final: 'crystal' },
  5: { regular: ['boat', 'fence', 'house'], final: 'lighthouse' },
  6: { regular: ['trees', 'gate', 'bridge'], final: 'tower' },
  7: { regular: ['gate', 'fence', 'tower'], final: 'crystal' },
  8: { regular: ['house', 'bridge', 'boat'], final: 'tower' },
  9: { regular: ['gate', 'bridge', 'tower'], final: 'crystal' },
  10: { regular: ['house', 'windmill', 'gate'], final: 'tower' },
};

function buildMissionsForTable(table: number): MissionDefinition[] {
  const layout = MISSION_LAYOUT[table];
  if (!layout) {
    return [];
  }

  const regular = layout.regular.map((scene, index) => ({
    id: `t${table}-m${index + 1}`,
    table,
    scene,
    questionCount: REGULAR_QUESTION_COUNTS[index] ?? 6,
    isFinalChallenge: false,
    order: index + 1,
  }));

  return [
    ...regular,
    {
      id: `t${table}-final`,
      table,
      scene: layout.final,
      questionCount: FINAL_QUESTION_COUNT,
      isFinalChallenge: true,
      order: regular.length + 1,
    },
  ];
}

export const MISSIONS: readonly MissionDefinition[] = TABLES.flatMap(buildMissionsForTable);

export function missionsForTable(table: number): MissionDefinition[] {
  return MISSIONS.filter((mission) => mission.table === table);
}

export function getMission(missionId: string): MissionDefinition | undefined {
  return MISSIONS.find((mission) => mission.id === missionId);
}

/** Total de perguntas necessarias para concluir uma ilha inteira. */
export function questionsRequiredForTable(table: number): number {
  return missionsForTable(table).reduce((total, mission) => total + mission.questionCount, 0);
}

/** Proxima missao ainda nao concluida da ilha, ou undefined se acabou. */
export function nextMission(
  table: number,
  completedMissionIds: readonly string[],
): MissionDefinition | undefined {
  return missionsForTable(table).find((mission) => !completedMissionIds.includes(mission.id));
}
