import { type Rng } from '../../shared/rng';
import { distanceSqXZ, type Vec3 } from '../../shared/vec';
import { blocksHome } from '../home/home.logic';
import { REGIONS, randomGroundPositionIn } from '../regions/regions.logic';
import { scatterPositions } from '../world/world.logic';

/**
 * O que se colhe.
 *
 * Tres tipos sao **materiais** e aparecem em mais de uma regiao — madeira, pedra
 * e fruta. Os outros seis sao **colheita de regiao**: cada um so existe num
 * lugar, o que faz o inventario virar registro de onde a crianca esteve. Antes
 * disto, atravessar a ilha inteira rendia os mesmos tres montinhos.
 */
export type ResourceKind =
  'madeira' | 'fruta' | 'pedra' | 'concha' | 'peixe' | 'cogumelo' | 'cristal' | 'mel' | 'gelo';

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

export const RESOURCE_KINDS: readonly ResourceKind[] = [
  'madeira',
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
  /** Tempo ate um no esgotado voltar, em segundos. */
  respawnSeconds: 12,
  /** Quantidade de nos gerados em cada regiao. */
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
  madeira: { one: 'madeira', many: 'madeira' },
  fruta: { one: 'fruta', many: 'frutas' },
  pedra: { one: 'pedra', many: 'pedras' },
  concha: { one: 'concha', many: 'conchas' },
  peixe: { one: 'peixe', many: 'peixes' },
  cogumelo: { one: 'cogumelo', many: 'cogumelos' },
  cristal: { one: 'cristal', many: 'cristais' },
  // Contaveis no enunciado ("potes de mel", "lascas de gelo") mas tratados como
  // massa no HUD, do mesmo jeito que a madeira ja era.
  mel: { one: 'mel', many: 'mel' },
  gelo: { one: 'gelo', many: 'gelo' },
};

export function emptyInventory(): Inventory {
  return Object.fromEntries(RESOURCE_KINDS.map((kind) => [kind, 0])) as Inventory;
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
        // Rodizio entre as colheitas da regiao, pelo mesmo motivo da tabuada:
        // sorteando, uma colheita podia nao aparecer e viraria conteudo morto.
        kind: regiao.harvest[index % regiao.harvest.length],
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
  madeira: 0.3,
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
 * Os que sobram sobem para uma volta acima, como galhos em andares. Sem isto
 * todos disputavam um anel so: com dez grupos da tabuada do 10 o raio passava de
 * dois metros, e o no virava uma palicada de quatro metros de diametro — parava
 * de ler como planta e passava a ler como cerca.
 */
const GROUPS_PER_LEVEL = 5;

/** Quanto uma volta sobe em relacao a de baixo. */
const LEVEL_HEIGHT = 0.62;

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
  const radius = Math.max(BASE_RING_RADIUS, raioNecessario, foraDaBase);

  for (let groupIndex = 0; groupIndex < node.groups; groupIndex += 1) {
    const volta = Math.floor(groupIndex / GROUPS_PER_LEVEL);
    const naVolta = groupIndex % GROUPS_PER_LEVEL;
    const gruposNestaVolta = Math.min(GROUPS_PER_LEVEL, node.groups - volta * GROUPS_PER_LEVEL);
    // Cada volta comeca girada meia posicao em relacao a de baixo, para grupos
    // de andares vizinhos nao ficarem alinhados um sobre o outro.
    const angle = (naVolta / gruposNestaVolta) * Math.PI * 2 + volta * (Math.PI / GROUPS_PER_LEVEL);
    const height = 1.15 + volta * LEVEL_HEIGHT;
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
