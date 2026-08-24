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
  /** Distancia para falar com um NPC. */
  interactRange: 3.2,
  /** Pagamento base de uma encomenda, em moedas. */
  orderReward: 8,
} as const;

/**
 * Quantos NPCs cabem numa regiao.
 *
 * Tres e o teto, e nao uma consequencia. A Praia — onde a crianca nasce e passa
 * os primeiros minutos — juntava o NPC de encomendas, o professor e a
 * comerciante, e qualquer papel novo cairia ali tambem, transformando a primeira
 * ilha num balcao de atendimento. Com um numero explicito, acrescentar um papel
 * obriga a escolher qual sai, em vez de empilhar mais um boneco no mesmo lugar.
 */
export const MAX_NPCS_PER_REGION = 3;

/** O papel de um NPC: o que ele oferece quando a crianca fala com ele. */
export type NpcRole = 'encomendas' | 'comerciante' | 'professor';

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

/** A comerciante fica na Praia, perto do ponto de nascimento. */
export function merchantPosition(): Vec3 {
  const praia = REGIONS.find((candidate) => candidate.id === 'praia')!;
  return vec3(praia.center.x - 4, praia.groundY, praia.center.z + 4);
}

/** O professor de cada regiao fica no canto oposto ao NPC de encomendas. */
export function teacherPosition(regionId: RegionId): Vec3 {
  const regiao = REGIONS.find((candidate) => candidate.id === regionId)!;
  return vec3(regiao.center.x + 4, regiao.groundY, regiao.center.z - 4);
}

/**
 * Quem mora em cada regiao, ja respeitando o teto de `MAX_NPCS_PER_REGION`.
 *
 * A lista e **a unica fonte** do que a view desenha: antes cada papel se
 * espalhava por conta propria — encomendas e professor em toda regiao, mais a
 * comerciante na Praia — e ninguem somava o total. Assim o corte fica num lugar
 * so, e um papel novo nao consegue entrar sem passar por aqui.
 *
 * A ordem e de prioridade: encomendas paga a conta, professor ensina, e a
 * comerciante e a menos urgente das tres — se um dia houver um quarto papel, e
 * ela que sai da Praia.
 */
export function npcRolesFor(regionId: RegionId): NpcRole[] {
  const papeis: NpcRole[] = ['encomendas', 'professor'];
  if (regionId === 'praia') papeis.push('comerciante');
  return papeis.slice(0, MAX_NPCS_PER_REGION);
}

/** Onde fica o NPC de um papel, dentro da regiao. */
export function npcRolePosition(role: NpcRole, regionId: RegionId): Vec3 {
  if (role === 'comerciante') return merchantPosition();
  if (role === 'professor') return teacherPosition(regionId);
  return npcPosition(regionId);
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
