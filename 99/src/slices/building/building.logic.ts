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

export interface FencePlacement {
  position: Vec3;
  rotation: number;
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
  fenceLength: 2,
  fenceSnapDistance: 1.5,
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
  rotation = 0,
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
    if (
      spec.kind === 'cerca' &&
      structure.kind === 'cerca' &&
      fenceHasJoiningEndpoint(position, rotation, structure.position, structure.rotation)
    ) {
      continue;
    }
    if (distanceSqXZ(position, structure.position) < minDistance * minDistance) {
      return { ok: false, reason: 'sobreposta' };
    }
  }

  const nodeClearance = spec.footprint + BUILDING.clearanceFromNodes;
  for (const node of nodes) {
    if (node.depleted) continue;
    const distanceToNodeSq =
      spec.kind === 'cerca'
        ? pointToFenceSegmentDistanceSq(node.position, position, rotation)
        : distanceSqXZ(position, node.position);
    if (distanceToNodeSq < nodeClearance * nodeClearance) {
      return { ok: false, reason: 'perto-de-recurso' };
    }
  }

  return { ok: true };
}

function fenceDirection(rotation: number): { x: number; z: number } {
  return { x: Math.cos(rotation), z: -Math.sin(rotation) };
}

function fenceEndpoints(position: Vec3, rotation: number): [Vec3, Vec3] {
  const direction = fenceDirection(rotation);
  const halfLength = BUILDING.fenceLength / 2;
  return [
    vec3(position.x - direction.x * halfLength, 0, position.z - direction.z * halfLength),
    vec3(position.x + direction.x * halfLength, 0, position.z + direction.z * halfLength),
  ];
}

function pointToFenceSegmentDistanceSq(point: Vec3, position: Vec3, rotation: number): number {
  const [start, end] = fenceEndpoints(position, rotation);
  const segmentX = end.x - start.x;
  const segmentZ = end.z - start.z;
  const lengthSq = segmentX * segmentX + segmentZ * segmentZ;
  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * segmentX + (point.z - start.z) * segmentZ) / lengthSq),
  );
  const closest = vec3(start.x + segmentX * t, 0, start.z + segmentZ * t);
  return distanceSqXZ(point, closest);
}

function samePoint(a: Vec3, b: Vec3): boolean {
  return distanceSqXZ(a, b) <= 1e-8;
}

function isParallelOrPerpendicular(first: number, second: number): boolean {
  const sine = Math.abs(Math.sin(first - second));
  return sine <= 1e-6 || Math.abs(Math.abs(Math.cos(first - second))) <= 1e-6;
}

function fenceHasJoiningEndpoint(
  position: Vec3,
  rotation: number,
  otherPosition: Vec3,
  otherRotation: number,
): boolean {
  if (!isParallelOrPerpendicular(rotation, otherRotation)) return false;
  const endpoints = fenceEndpoints(position, rotation);
  const otherEndpoints = fenceEndpoints(otherPosition, otherRotation);
  const sharedEndpoints = endpoints.filter((endpoint) =>
    otherEndpoints.some((other) => samePoint(endpoint, other)),
  );
  return sharedEndpoints.length === 1;
}

export function snapFencePlacement(
  manualPosition: Vec3,
  manualRotation: number,
  inventory: Inventory,
  existing: readonly Structure[],
  nodes: readonly ResourceNode[],
  snapDistance = BUILDING.fenceSnapDistance,
): FencePlacement {
  let best: FencePlacement | null = null;
  let bestDistanceSq = snapDistance * snapDistance;
  const halfLength = BUILDING.fenceLength / 2;

  for (const structure of existing) {
    if (structure.kind !== 'cerca') continue;
    const [firstEndpoint, secondEndpoint] = fenceEndpoints(structure.position, structure.rotation);
    const connectionOptions = [
      { endpoint: firstEndpoint, sign: -1 },
      { endpoint: secondEndpoint, sign: 1 },
    ];
    const rotations = [
      structure.rotation,
      structure.rotation + Math.PI / 2,
      structure.rotation - Math.PI / 2,
    ];

    for (const connection of connectionOptions) {
      for (const rotation of rotations) {
        const newDirection = fenceDirection(rotation);
        const candidate = vec3(
          connection.endpoint.x + connection.sign * newDirection.x * halfLength,
          0,
          connection.endpoint.z + connection.sign * newDirection.z * halfLength,
        );
        const distanceSq = distanceSqXZ(candidate, manualPosition);
        if (
          distanceSq <= bestDistanceSq &&
          checkPlacement(STRUCTURES.cerca, candidate, inventory, existing, nodes, rotation).ok
        ) {
          best = { position: candidate, rotation };
          bestDistanceSq = distanceSq;
        }
      }
    }
  }

  return best ?? { position: manualPosition, rotation: manualRotation };
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
