import { type Rng } from '../../shared/rng';
import { distanceSqXZ, type Vec3 } from '../../shared/vec';
import { blocksHome } from '../home/home.logic';
import { REGIONS, randomGroundPositionIn } from '../regions/regions.logic';
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
   * Itens por grupo — o **numero da tabuada** deste no.
   *
   * Mora no no, e nao numa constante global, porque quem manda nele e a regiao:
   * um no do Pico pergunta a tabuada do 9, um da Praia pergunta a do 2. Enquanto
   * isso era `RESOURCES.itemsPerGroup`, o jogo inteiro ficava preso em uma
   * tabuada so, e metade do conteudo ja escrito era inalcancavel.
   */
  perGroup: number;
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
  /** Quantidade de nos gerados em cada regiao. */
  nodesPerRegion: 6,
  /**
   * Distancia minima entre nos, para nao nascerem sobrepostos.
   *
   * Subiu de 4.5 quando a tabuada saiu do 2: um no da tabuada do 10 com dez
   * grupos chega a 2.6 de raio visual, entao dois deles precisam de 5.25 entre
   * os centros. Com o valor antigo, dois arbustos grandes nasciam entrelacados e
   * a crianca nao sabia mais qual fruta era de qual conta.
   */
  minSpacing: 6,
} as const;

/**
 * Tabuada de quem nao nasce de uma regiao.
 *
 * Sobrou so para a fogueira, que a crianca ergue onde quiser. Quando ela passar
 * a perguntar a tabuada do lugar onde foi construida, esta constante sai junto.
 */
export const DEFAULT_PER_GROUP = 2;

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
  const nodes: ResourceNode[] = [];

  for (const regiao of REGIONS) {
    const positions = scatterPositions(
      rng,
      RESOURCES.nodesPerRegion,
      RESOURCES.minSpacing,
      blocksHome,
      (semente) => randomGroundPositionIn(regiao, semente),
    );

    positions.forEach((position, index) => {
      nodes.push({
        id: `${regiao.id}-${index}`,
        kind: RESOURCE_KINDS[nodes.length % RESOURCE_KINDS.length],
        position,
        // 1 a 10 grupos: cobre a tabuada inteira, qualquer que seja ela.
        groups: 1 + Math.floor(rng() * 10),
        // Rodizio, e nao sorteio, entre as tabuadas da regiao.
        //
        // Sorteando, uma regiao de duas tabuadas poderia sair so com uma — e uma
        // tabuada sem nenhum no no mundo e um acessorio inalcancavel de novo,
        // que e o defeito exato que esta fase existe para consertar. O rodizio
        // garante a cobertura em qualquer semente, de graca.
        perGroup: regiao.tables[index % regiao.tables.length],
        depleted: false,
      });
    });
  }

  return nodes;
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
  return node.groups * node.perGroup;
}

/**
 * Quantos itens cabem numa fileira dentro de um grupo.
 *
 * Cinco, e nao um numero qualquer. Com a tabuada saindo do 2, um grupo pode ter
 * ate dez itens, e dez em linha reta viram uma fila que ninguem conta de
 * relance. Em duas fileiras de cinco eles formam a mesma figura que a criança ja
 * usa para contar na escola, e o "conferir contando na tela" continua possivel
 * no caso mais dificil — que e justamente onde ele mais importa.
 */
const ITEMS_PER_ROW = 5;

/** Raio do anel de grupos quando a tabuada e pequena o bastante para caber nele. */
const BASE_RING_RADIUS = 0.62;

/** Posicao de um item dentro do no, relativa ao centro dele. */
export interface ItemPlacement {
  groupIndex: number;
  itemIndex: number;
  position: Vec3;
}

/**
 * Distribui os itens visiveis do no: `groups` grupos de `node.perGroup` itens.
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
  const itemSpread = 0.26;
  const rowSpacing = 0.3;

  // Largura que uma fileira cheia ocupa, e o raio minimo que impede dois grupos
  // vizinhos de se encostarem no anel.
  //
  // Sem isto o raio era fixo em 0.62 e so funcionava com a tabuada do 2: com dez
  // grupos de dez, cada grupo media 1.04 de largura e sobrava 0.38 entre um e
  // outro — os grupos se fundiam num amontoado, e contar na tela, que e a regra
  // que sustenta o jogo, deixava de ser possivel.
  const larguraDoGrupo = (Math.min(ITEMS_PER_ROW, node.perGroup) - 1) * itemSpread;
  const raioNecessario =
    node.groups > 1
      ? (larguraDoGrupo + itemSpread) / (2 * Math.sin(Math.PI / node.groups))
      : 0;
  const radius = Math.max(BASE_RING_RADIUS, raioNecessario);

  for (let groupIndex = 0; groupIndex < node.groups; groupIndex += 1) {
    const angle = (groupIndex / node.groups) * Math.PI * 2;
    // Alterna a altura entre grupos vizinhos para nao virar um anel achatado
    // e ilegivel quando ha muitos grupos.
    const height = 1.15 + (groupIndex % 2) * 0.42;
    const outward = { x: Math.cos(angle), z: Math.sin(angle) };
    // Direcao tangente ao circulo: separa os itens do grupo.
    const tangent = { x: -Math.sin(angle), z: Math.cos(angle) };

    for (let itemIndex = 0; itemIndex < node.perGroup; itemIndex += 1) {
      const row = Math.floor(itemIndex / ITEMS_PER_ROW);
      const column = itemIndex % ITEMS_PER_ROW;
      // A ultima fileira pode ser mais curta; centralizar pela largura dela
      // mantem o grupo simetrico em vez de deixar um rabo de fora.
      const itemsNaFileira = Math.min(ITEMS_PER_ROW, node.perGroup - row * ITEMS_PER_ROW);
      const offset = (column - (itemsNaFileira - 1) / 2) * itemSpread;

      placements.push({
        groupIndex,
        itemIndex,
        position: {
          x: node.position.x + outward.x * radius + tangent.x * offset,
          y: node.position.y + height + row * rowSpacing,
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
