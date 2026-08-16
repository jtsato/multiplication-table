import { type Rng } from '../../shared/rng';
import { distanceSqXZ, type Vec3 } from '../../shared/vec';
import { scatterPositions } from '../world/world.logic';

export type ResourceKind = 'madeira' | 'fruta' | 'pedra';

/** Um no coletavel no mundo. */
export interface ResourceNode {
  id: string;
  kind: ResourceKind;
  position: Vec3;
  /**
   * Quantos grupos o objeto exibe na geometria. A Fatia 3 usa este numero como
   * multiplicando do desafio ("4 galhos x 2 gravetos"), entao o que a crianca
   * conta na tela e exatamente o que a conta pergunta.
   */
  groups: number;
  /**
   * Colhido e ainda em recuperacao.
   *
   * Estado explicito em vez de um `readyAt` comparado com o relogio: prontidao
   * baseada em tempo obrigaria recalcular quem esta disponivel a cada quadro
   * *durante o render*, que e justamente o que a regra de performance do projeto
   * proibe. Como booleano, a arvore so re-renderiza nos dois eventos reais —
   * colher e voltar.
   */
  depleted: boolean;
}

export type Inventory = Record<ResourceKind, number>;

export const RESOURCE_KINDS: readonly ResourceKind[] = ['madeira', 'fruta', 'pedra'];

export const RESOURCES = {
  /** Distancia maxima para interagir com um no, em metros. */
  interactRange: 3.2,
  /**
   * Distancia a partir da qual um desafio ja aberto e cancelado.
   *
   * Maior que `interactRange` de proposito. Com os dois valores iguais, chegar
   * perto e apertar E abria o desafio e o quadro seguinte ja o cancelava — o
   * jogador ainda desliza por inercia ao soltar as teclas e saia do alcance por
   * um instante. A folga faz o painel ficar de pe enquanto a crianca esta ali,
   * e sumir so quando ela realmente vai embora.
   */
  cancelRange: 5.2,
  /** Tempo ate um no esgotado voltar, em segundos. */
  respawnSeconds: 12,
  /** Quantos itens cada grupo do objeto vale. */
  itemsPerGroup: 2,
  /** Quantidade de nos gerados por tipo. */
  nodesPerKind: 7,
  /** Distancia minima entre nos, para nao nascerem sobrepostos. */
  minSpacing: 4.5,
} as const;

/** Rotulo no singular/plural para o HUD e para os enunciados. */
export const RESOURCE_LABELS: Record<ResourceKind, { one: string; many: string }> = {
  madeira: { one: 'madeira', many: 'madeira' },
  fruta: { one: 'fruta', many: 'frutas' },
  pedra: { one: 'pedra', many: 'pedras' },
};

export function emptyInventory(): Inventory {
  return { madeira: 0, fruta: 0, pedra: 0 };
}

/**
 * Gera os nos da ilha.
 *
 * Todos os tipos sao espalhados de uma vez, com espacamento minimo global — se
 * cada tipo fosse espalhado em uma passada propria, uma arvore poderia nascer
 * dentro de uma pedra.
 */
export function createNodes(rng: Rng): ResourceNode[] {
  const total = RESOURCES.nodesPerKind * RESOURCE_KINDS.length;
  const positions = scatterPositions(rng, total, RESOURCES.minSpacing);

  return positions.map((position, index) => {
    const kind = RESOURCE_KINDS[index % RESOURCE_KINDS.length];
    return {
      id: `${kind}-${index}`,
      kind,
      position,
      // 1 a 10 grupos: com 2 itens por grupo, cobre a tabuada do 2 inteira.
      groups: 1 + Math.floor(rng() * 10),
      depleted: false,
    };
  });
}

/** O no esta disponivel para coleta? */
export function isNodeReady(node: ResourceNode): boolean {
  return !node.depleted;
}

/**
 * No coletavel mais proximo dentro do alcance, ou `null`.
 *
 * Compara distancia ao quadrado para evitar a raiz quadrada — esta funcao roda
 * uma vez por quadro sobre todos os nos.
 *
 * Empates sao resolvidos pelo primeiro da lista, que tem ordem estavel, para o
 * realce nao piscar entre dois nos equidistantes.
 */
export function nearestNodeInRange(
  playerPosition: Vec3,
  nodes: readonly ResourceNode[],
  range: number = RESOURCES.interactRange,
): ResourceNode | null {
  const rangeSq = range * range;
  let best: ResourceNode | null = null;
  let bestDistanceSq = Infinity;

  for (const node of nodes) {
    if (!isNodeReady(node)) continue;
    const distanceSq = distanceSqXZ(playerPosition, node.position);
    // `<` estrito preserva o primeiro em caso de empate.
    if (distanceSq <= rangeSq && distanceSq < bestDistanceSq) {
      best = node;
      bestDistanceSq = distanceSq;
    }
  }

  return best;
}

/** Total de itens que um no entrega quando colhido por completo. */
export function fullYield(node: ResourceNode): number {
  return node.groups * RESOURCES.itemsPerGroup;
}

/** Posicao de um item dentro do no, relativa ao centro dele. */
export interface ItemPlacement {
  groupIndex: number;
  itemIndex: number;
  position: Vec3;
}

/**
 * Distribui os itens visiveis do no: `groups` grupos de `itemsPerGroup` itens.
 *
 * Esta funcao e o contrato visual do jogo. O desafio da Fatia 3 pergunta
 * "N grupos x 2 itens, quantos ao todo?" e a crianca precisa poder *contar na
 * tela* e chegar na resposta. Se o layout mostrasse um numero diferente de
 * itens, o enunciado viraria mentira e o jogo voltaria a ser um quiz com
 * enfeite 3D. Por isso ela e pura e tem teste proprio.
 *
 * Os grupos ficam em circulo em volta do tronco/base, e os dois itens de cada
 * grupo ficam lado a lado, separados o suficiente para serem contados de longe.
 */
export function itemPlacements(node: ResourceNode): ItemPlacement[] {
  const placements: ItemPlacement[] = [];
  const radius = 0.62;
  const itemSpread = 0.26;

  for (let groupIndex = 0; groupIndex < node.groups; groupIndex += 1) {
    const angle = (groupIndex / node.groups) * Math.PI * 2;
    // Alterna a altura entre grupos vizinhos para nao virar um anel achatado
    // e ilegivel quando ha muitos grupos.
    const height = 1.15 + (groupIndex % 2) * 0.42;
    const outward = { x: Math.cos(angle), z: Math.sin(angle) };
    // Direcao tangente ao circulo: separa os dois itens do grupo.
    const tangent = { x: -Math.sin(angle), z: Math.cos(angle) };

    for (let itemIndex = 0; itemIndex < RESOURCES.itemsPerGroup; itemIndex += 1) {
      // Com 2 itens por grupo, offset fica em -0.5 e +0.5 do espacamento.
      const offset = (itemIndex - (RESOURCES.itemsPerGroup - 1) / 2) * itemSpread;
      placements.push({
        groupIndex,
        itemIndex,
        position: {
          x: node.position.x + outward.x * radius + tangent.x * offset,
          y: node.position.y + height,
          z: node.position.z + outward.z * radius + tangent.z * offset,
        },
      });
    }
  }

  return placements;
}

/** Soma itens ao inventario, sem mutar o original. */
export function addToInventory(
  inventory: Inventory,
  kind: ResourceKind,
  amount: number,
): Inventory {
  // Coletas nunca sao negativas; proteger aqui evita que um bug de recompensa
  // (Fatia 3) drene o inventario silenciosamente.
  const safeAmount = Math.max(0, Math.floor(amount));
  return { ...inventory, [kind]: inventory[kind] + safeAmount };
}
