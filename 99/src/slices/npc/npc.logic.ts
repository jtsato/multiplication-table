import { createRng } from '../../shared/rng';
import { type Vec3, vec3 } from '../../shared/vec';
import { REGIONS, type RegionId } from '../regions/regions.logic';
import type { ResourceKind } from '../resources/resources.logic';
import type { ChallengeTarget } from '../math/math.logic';

/**
 * Encomendas dos NPCs.
 *
 * O pedido e uma conta: "preciso de 12 gravetos" vira "3 feixes de 4". A crianca
 * resolve a multiplicacao, entrega a quantidade da mochila e recebe moedas — o
 * recurso finalmente ganha um destino que paga em moeda sem virar venda.
 */

export const NPC = {
  /** Distancia para falar com um NPC de encomendas. */
  interactRange: 3.2,
  /** Pagamento base de uma encomenda, em moedas. */
  orderReward: 8,
} as const;

export interface Order {
  id: string;
  /** NPC dono do pedido: um por regiao. */
  npcId: string;
  regionId: RegionId;
  kind: ResourceKind;
  groups: number;
  perGroup: number;
  rewardCoins: number;
}

/** Onde o NPC de encomendas da regiao fica, perto do centro sem nascer em cima. */
export function npcPosition(regionId: RegionId): Vec3 {
  const regiao = REGIONS.find((candidate) => candidate.id === regionId)!;
  return vec3(regiao.center.x + 3, regiao.groundY, regiao.center.z + 3);
}

/**
 * Uma encomenda por regiao por dia, deterministica.
 *
 * Determinismo importa aqui: o pedido do dia tem que ser o mesmo para a crianca
 * e para o teste, e nao pode mudar a cada reload.
 */
export function createOrders(day: number): Order[] {
  return REGIONS.map((regiao, index) => {
    const rng = createRng(20260816 + day * 31 + index * 7);
    const groups = 1 + Math.floor(rng() * 10);
    const perGroup = regiao.tables[Math.floor(rng() * regiao.tables.length)];
    const kind = regiao.harvest[Math.floor(rng() * regiao.harvest.length)];

    return {
      id: `${regiao.id}-encomenda-${day}`,
      npcId: `${regiao.id}-encomendas`,
      regionId: regiao.id,
      kind,
      groups,
      perGroup,
      rewardCoins: NPC.orderReward,
    };
  });
}

/** O alvo do desafio de entrega: a conta usa o recurso pedido. */
export function orderTarget(order: Order): ChallengeTarget {
  return {
    id: order.id,
    kind: order.kind,
    groups: order.groups,
    perGroup: order.perGroup,
  };
}

/** Quantos itens a encomenda quer — o resultado da multiplicacao. */
export function orderQuantity(order: Order): number {
  return order.groups * order.perGroup;
}

/** O NPC mais proximo dentro do alcance, ou `null`. */
export function nearestOrder(
  position: Vec3,
  orders: readonly Order[],
  range: number = NPC.interactRange,
): Order | null {
  const rangeSq = range * range;
  let best: Order | null = null;
  let bestDistanceSq = Infinity;

  for (const order of orders) {
    const npc = npcPosition(order.regionId);
    const dx = npc.x - position.x;
    const dz = npc.z - position.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq <= rangeSq && distanceSq < bestDistanceSq) {
      best = order;
      bestDistanceSq = distanceSq;
    }
  }

  return best;
}
