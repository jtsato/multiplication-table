import { type Vec3, vec3 } from '../../shared/vec';
import { REGIONS } from '../regions/regions.logic';

/**
 * A horta do Pomar.
 *
 * Sementes compradas na loja viram plantio; no dia seguinte, a horta esta pronta
 * e a crianca colhe frutas de graca. E o destino de recurso que paga por **voltar**
 * — a recompensa existe porque a crianca retornou, nao porque resolveu uma conta.
 */

export const GARDEN = {
  /** Distancia para plantar ou colher. */
  interactRange: 2.2,
  /** Quantas frutas uma horta madura entrega. */
  yield: 6,
} as const;

export interface GardenState {
  planted: boolean;
  /** Dia em que foi plantada. `0` significa nunca. */
  plantedDay: number;
  position?: Vec3;
}

export type GardenStatus = 'empty' | 'growing' | 'ready';

export function gardenStatus(state: GardenState, currentDay: number): GardenStatus {
  if (!state.planted) return 'empty';
  return state.plantedDay < currentDay ? 'ready' : 'growing';
}

/** A horta fica no Pomar, longe do professor e do NPC de encomendas. */
export function gardenPosition(): Vec3 {
  const pomar = REGIONS.find((candidate) => candidate.id === 'pomar')!;
  return vec3(pomar.center.x - 4, pomar.groundY, pomar.center.z + 2);
}
