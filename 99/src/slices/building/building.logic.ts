import { distanceSqXZ, type Vec3, vec3 } from '../../shared/vec';
import { isWithinIsland } from '../world/world.logic';
import type { Inventory, ResourceKind, ResourceNode } from '../resources/resources.logic';

export type StructureKind = 'fogueira' | 'cerca';

export interface Structure {
  id: string;
  kind: StructureKind;
  position: Vec3;
  /** Angulo em Y, usado pela cerca para ficar de lado ao jogador. */
  rotation: number;
  /**
   * Instante do relogio do jogo em que a fogueira apaga.
   *
   * Combustivel guardado como prazo, e nao como quantidade que decresce: assim
   * ele "queima" continuamente sem nenhuma escrita por quadro no store. Quem
   * precisa do valor atual chama `fuelRemaining(structure, now)`, que e pura.
   * Irrelevante para a cerca.
   */
  fuelUntil: number;
}

/** Custo de uma construcao, por tipo de recurso. */
export type Recipe = Partial<Record<ResourceKind, number>>;

export interface StructureSpec {
  kind: StructureKind;
  label: string;
  recipe: Recipe;
  /** Raio que a estrutura ocupa no chao — usado contra sobreposicao. */
  footprint: number;
}

export const STRUCTURES: Record<StructureKind, StructureSpec> = {
  fogueira: {
    kind: 'fogueira',
    label: 'Fogueira',
    recipe: { madeira: 8, pedra: 4 },
    footprint: 1.4,
  },
  cerca: {
    kind: 'cerca',
    label: 'Cerca',
    recipe: { madeira: 6 },
    footprint: 1.1,
  },
};

export const BUILDING = {
  /** A que distancia a frente do jogador o fantasma e posicionado. */
  placementDistance: 3.4,
  /** Folga minima entre uma construcao e um no de recurso. */
  clearanceFromNodes: 2.2,
  /** Raio de seguranca da fogueira, usado pelos inimigos na Fatia 6. */
  fireSafeRadius: 7,
  /** Quanto tempo a fogueira queima quando e acesa, em segundos. */
  fireFuelSeconds: 50,
  /** Alcance para abastecer a fogueira. */
  refuelRange: 3.2,
  /** Abaixo disto a fogueira pede lenha no HUD. */
  lowFuelSeconds: 20,
} as const;

/** Segundos de combustivel que ainda restam. */
export function fuelRemaining(structure: Structure, now: number): number {
  if (structure.kind !== 'fogueira') return 0;
  return Math.max(0, structure.fuelUntil - now);
}

/** A fogueira esta acesa neste instante? */
export function isLit(structure: Structure, now: number): boolean {
  return fuelRemaining(structure, now) > 0;
}

/**
 * Novo prazo de combustivel apos abastecer.
 *
 * O tempo ganho e somado ao que ainda restava, ate um teto de duas cargas —
 * assim abastecer cedo nao e desperdicio, mas tambem nao da para acumular
 * combustivel infinito e ignorar a mecanica pelo resto da partida.
 */
export function refuelUntil(structure: Structure, now: number, ratio: number): number {
  const ganho = BUILDING.fireFuelSeconds * Math.min(1, Math.max(0, ratio));
  const restante = fuelRemaining(structure, now);
  return now + Math.min(restante + ganho, BUILDING.fireFuelSeconds * 2);
}

/** Motivo pelo qual uma posicao foi recusada — vira feedback na tela. */
export type PlacementRejection =
  'fora-da-ilha' | 'sobreposta' | 'perto-de-recurso' | 'sem-recursos';

export type PlacementCheck = { ok: true } | { ok: false; reason: PlacementRejection };

/** O inventario cobre a receita inteira? */
export function canAfford(inventory: Inventory, recipe: Recipe): boolean {
  return Object.entries(recipe).every(
    ([kind, cost]) => inventory[kind as ResourceKind] >= (cost ?? 0),
  );
}

/**
 * Debita a receita do inventario.
 *
 * Devolve o inventario intacto quando nao da para pagar — cobrar parcialmente
 * deixaria a crianca sem recurso e sem construcao, que e o pior resultado
 * possivel.
 */
export function payCost(inventory: Inventory, recipe: Recipe): Inventory {
  if (!canAfford(inventory, recipe)) return inventory;

  const result = { ...inventory };
  for (const [kind, cost] of Object.entries(recipe)) {
    result[kind as ResourceKind] -= cost ?? 0;
  }
  return result;
}

/**
 * Ponto no chao a frente do jogador, onde o fantasma da construcao aparece.
 *
 * Usa o mesmo eixo do movimento: com `yaw = 0` a frente e -Z.
 */
export function placementPosition(
  playerPosition: Vec3,
  yaw: number,
  distance: number = BUILDING.placementDistance,
): Vec3 {
  return vec3(
    playerPosition.x - Math.sin(yaw) * distance,
    0,
    playerPosition.z - Math.cos(yaw) * distance,
  );
}

/**
 * A construcao cabe aqui?
 *
 * Verifica, nesta ordem: recursos, limites da ilha, sobreposicao com outras
 * construcoes e folga em relacao aos nos de recurso. A ordem importa para o
 * feedback: dizer "sem recursos" e mais util que "sobreposta" quando os dois
 * problemas existem ao mesmo tempo.
 */
export function checkPlacement(
  spec: StructureSpec,
  position: Vec3,
  inventory: Inventory,
  existing: readonly Structure[],
  nodes: readonly ResourceNode[],
): PlacementCheck {
  if (!canAfford(inventory, spec.recipe)) {
    return { ok: false, reason: 'sem-recursos' };
  }

  // Margem igual ao proprio footprint: a construcao inteira precisa caber na
  // ilha, nao so o centro dela.
  if (!isWithinIsland(position, spec.footprint)) {
    return { ok: false, reason: 'fora-da-ilha' };
  }

  for (const structure of existing) {
    const minDistance = spec.footprint + STRUCTURES[structure.kind].footprint;
    if (distanceSqXZ(position, structure.position) < minDistance * minDistance) {
      return { ok: false, reason: 'sobreposta' };
    }
  }

  const nodeClearance = spec.footprint + BUILDING.clearanceFromNodes;
  for (const node of nodes) {
    if (node.depleted) continue;
    if (distanceSqXZ(position, node.position) < nodeClearance * nodeClearance) {
      return { ok: false, reason: 'perto-de-recurso' };
    }
  }

  return { ok: true };
}

/**
 * Fogueira ao alcance do jogador, para abastecer.
 *
 * Devolve a mais proxima dentro do alcance; empate resolvido pela ordem da
 * lista, que e estavel — o mesmo criterio de `nearestNodeInRange`, para o
 * jogador nao ter que aprender duas regras de alcance diferentes.
 */
export function nearestRefuelable(
  structures: readonly Structure[],
  position: Vec3,
  range: number = BUILDING.refuelRange,
): Structure | null {
  const rangeSq = range * range;
  let best: Structure | null = null;
  let bestDistanceSq = Infinity;

  for (const structure of structures) {
    if (structure.kind !== 'fogueira') continue;
    const distanceSq = distanceSqXZ(position, structure.position);
    if (distanceSq <= rangeSq && distanceSq < bestDistanceSq) {
      best = structure;
      bestDistanceSq = distanceSq;
    }
  }

  return best;
}

/** Mensagem curta para o HUD explicar a recusa. */
export const REJECTION_MESSAGES: Record<PlacementRejection, string> = {
  'fora-da-ilha': 'Longe demais — construa dentro da ilha',
  sobreposta: 'Já tem algo construído aqui',
  'perto-de-recurso': 'Perto demais de um recurso',
  'sem-recursos': 'Recursos insuficientes',
};

/** Texto do custo, para o HUD: "8 madeira · 4 pedra". */
export function formatRecipe(recipe: Recipe): string {
  return Object.entries(recipe)
    .map(([kind, cost]) => `${cost} ${kind}`)
    .join(' · ');
}
