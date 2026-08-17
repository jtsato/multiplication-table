import { MONSTER_SEQUENCE } from "../battle/monsters";
import type { MonsterSpec } from "../battle/battle.types";

/** Estágio atual da jornada (quantos monstros já foram derrotados). */
export interface Progress {
  stage: number;
}

/** Tabuadas disponíveis em cada estágio. */
const TABLES_BY_STAGE: number[][] = [
  [2, 3, 4],
  [2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9],
];

export function initialProgress(): Progress {
  return { stage: 0 };
}

/** Monstro do estágio atual (trava no último quando a jornada termina). */
export function nextMonster(progress: Progress): MonsterSpec {
  return MONSTER_SEQUENCE[Math.min(progress.stage, MONSTER_SEQUENCE.length - 1)];
}

/** Tabuadas do estágio atual (trava na última quando a jornada termina). */
export function nextTables(progress: Progress): number[] {
  return TABLES_BY_STAGE[Math.min(progress.stage, TABLES_BY_STAGE.length - 1)];
}

/** Avança um estágio após derrotar o monstro; trava no fim da jornada. */
export function advanceProgress(progress: Progress): Progress {
  return { stage: Math.min(progress.stage + 1, MONSTER_SEQUENCE.length) };
}

/** Jornada completa: todos os monstros derrotados. */
export function isGameComplete(progress: Progress): boolean {
  return progress.stage >= MONSTER_SEQUENCE.length;
}

/** Valida o progresso vindo de um save. */
export function migrateProgress(raw: unknown): Progress {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("progresso inválido");
  }
  const stage = (raw as { stage?: unknown }).stage;
  if (typeof stage !== "number" || !Number.isInteger(stage) || stage < 0) {
    throw new Error("progresso inválido: estágio");
  }
  return { stage };
}
