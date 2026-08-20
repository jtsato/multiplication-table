import { createRng } from '../../shared/rng';
import { type Vec3, vec3 } from '../../shared/vec';

/**
 * Eventos diários: micro-surpresas que dão ritmo ao mundo "infinito".
 *
 * O evento é **determinístico por dia**: a criança e o teste veem o mesmo dia na
 * mesma ordem, e recarregar a página não troca o evento no meio do dia. Nenhum
 * evento pune — eles mudam o sabor do dia, não as regras de perder/ganhar.
 */

export type DailyEventKind =
  | 'dia-comum'
  | 'chuva'
  | 'fartura'
  | 'visitante'
  | 'baleia-na-praia';

export interface DailyEvent {
  day: number;
  kind: DailyEventKind;
}

export const DAILY_EVENT_KINDS: readonly DailyEventKind[] = [
  'dia-comum',
  'chuva',
  'fartura',
  'visitante',
  'baleia-na-praia',
];

/** O evento de um dia, derivado apenas do número do dia. */
export function eventForDay(day: number): DailyEvent {
  const safeDay = Math.max(1, Math.floor(day));
  const rng = createRng(20260819 + safeDay * 17);
  const kind = DAILY_EVENT_KINDS[Math.floor(rng() * DAILY_EVENT_KINDS.length)];
  return { day: safeDay, kind };
}

/** Dia de fartura: cada colheita rende o dobro. */
export function harvestMultiplier(kind: DailyEventKind): number {
  return kind === 'fartura' ? 2 : 1;
}

/**
 * Dia de chuva: a horta já amanhece regada, então plantar rende no mesmo dia.
 * `currentDay - 1` faz `gardenStatus` enxergar a horta como pronta já no plantio.
 */
export function gardenPlantedDay(kind: DailyEventKind, currentDay: number): number {
  return kind === 'chuva' ? currentDay - 1 : currentDay;
}

/** Onde a baleia aparece hoje; `null` usa o lugar padrão do Porto. */
export function whalePositionFor(kind: DailyEventKind): Vec3 | null {
  return kind === 'baleia-na-praia' ? vec3(-14, 0, -16) : null;
}

/** O barco do visitante especial, no mar ao lado do Porto. */
export const VISITOR_BOAT_POSITION: Vec3 = vec3(50, 0, -8);

/** O dia tem um evento visível (não é um dia comum)? */
export function hasDailyEvent(kind: DailyEventKind): boolean {
  return kind !== 'dia-comum';
}
