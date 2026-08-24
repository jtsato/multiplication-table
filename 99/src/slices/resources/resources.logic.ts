import { type Rng } from '../../shared/rng';
import { distanceSqXZ, type Vec3 } from '../../shared/vec';
import { blocksHome } from '../home/home.logic';
import { REGIONS, randomGroundPositionIn } from '../regions/regions.logic';
import { scatterPositions } from '../world/world.logic';

/**
 * O que se colhe.
 *
 * Os nos que nascem no mundo sao depositos minerais permanentes. Vegetacao
 * nao aparece espontaneamente: as arvores (apenas frutiferas) entram no mundo
 * por plantio deliberado, para a ilha comecar deserta e a crianca cuidar do
 * que construiu.
 */
export type ResourceKind =
  'fruta' | 'pedra' | 'concha' | 'peixe' | 'cogumelo' | 'cristal' | 'mel' | 'gelo';

export type PlantableResourceKind = 'fruta';
export type PlantingKind = 'arvore-frutifera';

export const PLANTABLE_RESOURCE_KINDS: readonly PlantableResourceKind[] = ['fruta'];

export function isPlantableKind(kind: ResourceKind): kind is PlantableResourceKind {
  return PLANTABLE_RESOURCE_KINDS.includes(kind as PlantableResourceKind);
}

/**
 * O que uma muda vira quando cresce.
 *
 * So existe um tipo de arvore — a macieira. A funcao permanece para o caso de
 * uma segunda frutifera entrar depois, e para que quem planta nao precise
 * conhecer o nome do recurso.
 */
export function plantedResourceKind(_kind: PlantingKind): PlantableResourceKind {
  return 'fruta';
}

export function plantingPosition(player: Vec3, yaw: number, distance = 3.4): Vec3 {
  return {
    x: player.x - Math.sin(yaw) * distance,
    y: 0,
    z: player.z - Math.cos(yaw) * distance,
  };
}

/** Um no coletavel no mundo. */
export interface ResourceNode {
  id: string;
  kind: ResourceKind;
  position: Vec3;
  /**
    * Quantos grupos o objeto exibe na geometria. A Fatia 3 usa este numero como
    * multiplicando do desafio, entao o que a crianca
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
  /** Estado persistente do deposito ou da planta. */
  depleted: boolean;
  /** Vegetacao plantada pela crianca; depositos do mapa nao possuem esta marca. */
  planted?: boolean;
  /** Ultimo dia em que uma planta produziu, para evitar colheita infinita no mesmo dia. */
  lastHarvestDay?: number;
}

export type Inventory = Record<ResourceKind, number>;

export const RESOURCE_KINDS: readonly ResourceKind[] = [
  'fruta',
  'pedra',
  'concha',
  'peixe',
  'cogumelo',
  'cristal',
  'mel',
  'gelo',
];

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
  /** Quantidade de depositos permanentes gerados em cada regiao. */
  nodesPerRegion: 6,
  /**
   * Distancia minima entre nos, para nao nascerem sobrepostos.
   *
   * Subiu de 4.5 quando a tabuada saiu do 2. O maior no do jogo — dez grupos da
   * tabuada do 10 — tem 1.63 de raio visual, entao dois deles precisam de 3.3
   * entre os centros; cinco deixa folga para eles nao se encostarem nem parecer
   * um so arbusto. Com o valor antigo, dois nos grandes nasciam entrelacados e a
   * crianca nao sabia mais qual fruta era de qual conta.
   */
  minSpacing: 5,
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
  fruta: { one: 'fruta', many: 'frutas' },
  pedra: { one: 'pedra', many: 'pedras' },
  concha: { one: 'concha', many: 'conchas' },
  peixe: { one: 'peixe', many: 'peixes' },
  cogumelo: { one: 'cogumelo', many: 'cogumelos' },
  cristal: { one: 'cristal', many: 'cristais' },
  // Contaveis no enunciado ("potes de mel", "lascas de gelo") mas tratados como
  // massa no HUD.
  mel: { one: 'mel', many: 'mel' },
  gelo: { one: 'gelo', many: 'gelo' },
};

export function emptyInventory(): Inventory {
  return Object.fromEntries(RESOURCE_KINDS.map((kind) => [kind, 0])) as Inventory;
}

export function startingInventory(): Inventory {
  return emptyInventory();
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
    const quantidade = Math.max(RESOURCES.nodesPerRegion, regiao.deposits.length);
    const positions = scatterPositions(
      rng,
      quantidade,
      RESOURCES.minSpacing,
      blocksHome,
      (semente) => randomGroundPositionIn(regiao, semente),
    );

    positions.forEach((position, index) => {
      const kind = regiao.deposits[index % regiao.deposits.length];
      nodes.push({
        id: `${regiao.id}-${index}`,
        kind,
        position,
        groups: 1 + Math.floor(rng() * 10),
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

/** Raio da volta de grupos quando a tabuada e pequena o bastante para caber nela. */
const BASE_RING_RADIUS = 0.62;

/**
 * Raio horizontal da base de cada tipo — o tronco, a moita, a rocha.
 *
 * Mora aqui, e nao junto da aparencia, porque o **posicionamento** depende dele:
 * o anel de itens tem que passar por fora da base. Com poucos grupos o anel
 * ficava no raio minimo de 0,62 enquanto a moita tinha 0,85, e os itens nasciam
 * dentro dela — um no de mel com um grupo aparecia pelado na tela, sem nada para
 * contar. `resources.look` desenha a geometria a partir destes mesmos numeros,
 * para os dois nao poderem divergir.
 */
export const BASE_RADIUS: Record<ResourceKind, number> = {
  fruta: 0.85,
  pedra: 0.8,
  concha: 0.95,
  peixe: 0.62,
  cogumelo: 0.62,
  cristal: 0.85,
  mel: 0.85,
  gelo: 0.85,
};

/** Folga entre a base e o primeiro item, para eles nao se encostarem. */
const BASE_CLEARANCE = 0.32;

/**
 * Quantos grupos cabem numa volta em torno do tronco.
 *
 * Os que sobram sobem para uma volta acima, como itens em andares. Sem isto
 * todos disputavam um anel so: com dez grupos da tabuada do 10 o raio passava de
 * dois metros, e o no virava uma palicada de quatro metros de diametro — parava
 * de ler como planta e passava a ler como cerca.
 */
const GROUPS_PER_LEVEL = 5;

/** Quanto uma volta sobe em relacao a de baixo. */
const LEVEL_HEIGHT = 0.62;

/**
 * Recursos que ficam no chão, em vez de elevados na base.
 *
 * Conchas e pedras no ar quebravam a física do mundo: a criança vê a concha
 * flutuando na altura do peito. Elas continuam contáveis, mas espalhadas no
 * chão em volta da base — e cada andar extra de grupos é um anel mais largo, não
 * uma altura maior.
 */
const GROUND_ITEMS: readonly ResourceKind[] = ['concha', 'pedra'];

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
  // vizinhos de se encostarem na volta.
  //
  // Sem isto o raio era fixo em 0.62 e so funcionava com a tabuada do 2: com dez
  // grupos de dez, cada grupo media 1.04 de largura e sobrava 0.38 entre um e
  // outro — os grupos se fundiam num amontoado, e contar na tela, que e a regra
  // que sustenta o jogo, deixava de ser possivel.
  //
  // O raio sai da volta mais cheia, e nao do total de grupos: sao no maximo
  // `GROUPS_PER_LEVEL` por volta, e o resto sobe um andar.
  const larguraDoGrupo = (Math.min(ITEMS_PER_ROW, node.perGroup) - 1) * itemSpread;
  const porVolta = Math.min(GROUPS_PER_LEVEL, node.groups);
  const raioNecessario =
    porVolta > 1 ? (larguraDoGrupo + itemSpread) / (2 * Math.sin(Math.PI / porVolta)) : 0;
  // Tambem por fora da base: um item escondido dentro do proprio no nao se conta.
  const foraDaBase = BASE_RADIUS[node.kind] + BASE_CLEARANCE + larguraDoGrupo / 2;
  const isGroundItem = GROUND_ITEMS.includes(node.kind);
  // Itens de chao (concha, pedra) nao sobem de andar: cada volta extra vira um
  // anel mais largo no chao, mantendo todos visiveis e contaveis sem flutuar.
  const raioPorVolta = isGroundItem ? 0.7 : 0;

  for (let groupIndex = 0; groupIndex < node.groups; groupIndex += 1) {
    const volta = Math.floor(groupIndex / GROUPS_PER_LEVEL);
    const naVolta = groupIndex % GROUPS_PER_LEVEL;
    const gruposNestaVolta = Math.min(GROUPS_PER_LEVEL, node.groups - volta * GROUPS_PER_LEVEL);
    const radius = Math.max(BASE_RING_RADIUS, raioNecessario, foraDaBase) + volta * raioPorVolta;
    // Cada volta comeca girada meia posicao em relacao a de baixo, para grupos
    // de andares vizinhos nao ficarem alinhados um sobre o outro.
    const angle = (naVolta / gruposNestaVolta) * Math.PI * 2 + volta * (Math.PI / GROUPS_PER_LEVEL);
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
      // Concha e pedra ficam rentes ao chao; o resto (fruta, cristal...)
      // sobe na copa para a crianca contar de frente.
      const y = node.position.y + (isGroundItem
        ? 0.08 + row * rowSpacing
        : 1.15 + volta * LEVEL_HEIGHT + row * rowSpacing);

      placements.push({
        groupIndex,
        itemIndex,
        position: {
          x: node.position.x + outward.x * radius + tangent.x * offset,
          y,
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
