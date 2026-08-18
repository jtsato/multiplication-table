import type { MonsterSpec } from "../battle/battle.types";
import { ENCOUNTERS_PER_MAP, MAPS, TOTAL_ENCOUNTERS, type MapSpec } from "../maps/maps";

/** Estágio atual da jornada: índice do encontro (inimigo comum ou chefão). */
export interface Progress {
  stage: number;
}

export function initialProgress(): Progress {
  return { stage: 0 };
}

/** Mapa atual (tabuada) com base no estágio. Trava no último mapa. */
export function currentMap(progress: Progress): MapSpec {
  const index = Math.min(Math.floor(progress.stage / ENCOUNTERS_PER_MAP), MAPS.length - 1);
  return MAPS[index];
}

/** Índice do mapa atual (0 a 8). */
export function currentMapIndex(progress: Progress): number {
  return Math.min(Math.floor(progress.stage / ENCOUNTERS_PER_MAP), MAPS.length - 1);
}

/** True quando o encontro atual é o chefão do mapa. */
export function isBossEncounter(progress: Progress): boolean {
  return progress.stage % ENCOUNTERS_PER_MAP === 1;
}

/** Tabuada do mapa atual. */
export function nextMapTable(progress: Progress): number {
  return currentMap(progress).table;
}

/** Monstro do encontro atual (inimigo comum ou chefão do mapa). */
export function nextMonster(progress: Progress): MonsterSpec {
  const map = currentMap(progress);
  return isBossEncounter(progress) ? map.boss : map.minion;
}

/** Avança um encontro após derrotar o monstro; trava no fim da jornada. */
export function advanceProgress(progress: Progress): Progress {
  return { stage: Math.min(progress.stage + 1, TOTAL_ENCOUNTERS) };
}

/** Jornada completa: todos os mapas e chefões derrotados. */
export function isGameComplete(progress: Progress): boolean {
  return progress.stage >= TOTAL_ENCOUNTERS;
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
