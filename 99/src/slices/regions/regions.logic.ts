import { type Rng, randomRange } from '../../shared/rng';
import { type Vec3, vec3 } from '../../shared/vec';

/**
 * O arquipelago.
 *
 * O mundo era um disco de raio 30 com parede invisivel em volta. Aumentar o raio
 * produziria vazio, nao descoberta — por isso ele vira seis regioes menores
 * ligadas por pontes.
 *
 * Isso resolve tres coisas de uma vez: da as pontes, da o portao de progressao
 * (a ponte abre com a tabuada local dominada) e mantem cada regiao pequena o
 * bastante para a crianca nao se perder dentro dela.
 *
 * **A regiao e quem manda na tabuada.** Um no do Pico pergunta a do 9, um da
 * Praia pergunta a do 2. Explorar passa a ser progredir no curriculo, e isso
 * fica legivel para a crianca e para o adulto sem nenhum menu de nivel.
 */

export const REGION_ORDER = ['praia', 'porto', 'bosque', 'cachoeira', 'pomar', 'pico'] as const;
export type RegionId = (typeof REGION_ORDER)[number];

export interface Region {
  id: RegionId;
  nome: string;
  /** Centro do disco, no plano. */
  center: Vec3;
  radius: number;
  /** Altura do terreno. Os desniveis entre vizinhas e que dao as cachoeiras. */
  groundY: number;
  /** As tabuadas que os nos daqui perguntam. */
  tables: number[];
  /**
   * Area livre no meio onde nada e espalhado.
   *
   * So a Praia precisa: e onde o jogador nasce, e um no dentro da area de spawn
   * apareceria colado na cara dele no primeiro quadro.
   */
  clearance: number;
}

/** Margem interna: nada nasce colado na agua. */
export const EDGE_MARGIN = 2.5;

/**
 * A ordem e didatica, nao numerica: 2 -> 5 e 10 -> 3 e 4 -> 6 -> 7 e 8 -> 9.
 *
 * A tabuada do 10 entra cedo de proposito. E a mais facil — a virgula andando —
 * e serve como injecao de confianca logo depois do 2, em vez de premio de
 * dificuldade la no fim.
 *
 * Os centros formam uma curva aberta que se enrola: vizinhas ficam a um vao de
 * ponte uma da outra e todo o resto fica longe demais para atravessar sem ponte.
 * Ha teste para as duas coisas, porque um erro de coordenada aqui ou isolaria
 * uma regiao para sempre, ou deixaria contornar a progressao pela beira.
 */
export const REGIONS: Region[] = [
  {
    id: 'praia',
    nome: 'Praia',
    center: vec3(0, 0, 0),
    radius: 16,
    groundY: 0,
    tables: [2],
    clearance: 6,
  },
  {
    id: 'porto',
    nome: 'Porto',
    center: vec3(36, 0, 0),
    radius: 13,
    groundY: 0,
    tables: [5, 10],
    clearance: 0,
  },
  {
    id: 'bosque',
    nome: 'Bosque',
    center: vec3(55, 0, 27),
    radius: 13,
    groundY: 1.5,
    tables: [3, 4],
    clearance: 0,
  },
  {
    id: 'cachoeira',
    nome: 'Cachoeira',
    center: vec3(44, 0, 58),
    radius: 13,
    groundY: 4,
    tables: [6],
    clearance: 0,
  },
  {
    id: 'pomar',
    nome: 'Pomar',
    center: vec3(12, 0, 66),
    radius: 13,
    groundY: 2,
    tables: [7, 8],
    clearance: 0,
  },
  {
    id: 'pico',
    nome: 'Pico',
    center: vec3(-14, 0, 45),
    radius: 13,
    groundY: 7,
    tables: [9],
    clearance: 0,
  },
];

const POR_ID: Record<RegionId, Region> = Object.fromEntries(
  REGIONS.map((regiao) => [regiao.id, regiao]),
) as Record<RegionId, Region>;

export function regionById(id: RegionId): Region {
  return POR_ID[id];
}

/**
 * As vizinhas de uma regiao — as que uma ponte pode ligar.
 *
 * Derivadas da cadeia em vez de escritas a mao: uma lista manual de vizinhancas
 * pode ficar assimetrica (A vizinha de B, B nao vizinha de A) e o jogo so
 * mostraria isso quando a crianca chegasse la.
 */
export function neighbours(id: RegionId): RegionId[] {
  const indice = REGION_ORDER.indexOf(id);
  return [REGION_ORDER[indice - 1], REGION_ORDER[indice + 1]].filter(
    (vizinha): vizinha is RegionId => vizinha !== undefined,
  );
}

function dentroDe(regiao: Region, position: Vec3, margin = 0): boolean {
  const limite = regiao.radius - margin;
  if (limite <= 0) return false;
  const dx = position.x - regiao.center.x;
  const dz = position.z - regiao.center.z;
  return dx * dx + dz * dz <= limite * limite;
}

/**
 * Em que regiao esta este ponto? `null` significa agua.
 *
 * Substitui `isWithinIsland`. Le so o plano: a altura nao participa, porque as
 * regioes ficam em alturas diferentes e um ponto no ar sobre o Pico continua
 * sendo o Pico.
 */
export function regionAt(position: Vec3): Region | null {
  for (const regiao of REGIONS) {
    if (dentroDe(regiao, position)) return regiao;
  }
  return null;
}

export function isOnLand(position: Vec3): boolean {
  return regionAt(position) !== null;
}

/**
 * Cabe em terra firme um objeto deste tamanho, centrado aqui?
 *
 * Substitui `isWithinIsland(position, margin)`. A margem e a metade da pegada da
 * construcao: exigir que o centro esteja em terra deixaria meia fogueira
 * pendurada sobre a agua.
 */
export function fitsOnLand(position: Vec3, margin: number): boolean {
  return REGIONS.some((regiao) => dentroDe(regiao, position, margin));
}

/**
 * Sorteia um ponto util dentro da regiao: fora da area de spawn dela e dentro da
 * margem da borda.
 *
 * O raio sai de uma `sqrt` para que os pontos fiquem uniformes **por area** —
 * sortear o raio direto amontoaria tudo no centro e deixaria a beira vazia.
 */
export function randomGroundPositionIn(regiao: Region, rng: Rng): Vec3 {
  const min = regiao.clearance;
  const max = regiao.radius - EDGE_MARGIN;
  const angle = randomRange(rng, 0, Math.PI * 2);
  const t = randomRange(rng, 0, 1);
  const radius = Math.sqrt(min * min + t * (max * max - min * min));

  return vec3(
    regiao.center.x + Math.cos(angle) * radius,
    regiao.groundY,
    regiao.center.z + Math.sin(angle) * radius,
  );
}

/**
 * Circulo que envolve o arquipelago inteiro.
 *
 * Derivado das regioes, e nao escrito a mao: quem enquadra o mundo — a camera de
 * sombra do sol, o plano do mar — precisa de um numero que acompanhe a
 * geografia. Um valor fixo ficaria defasado no dia em que uma regiao se mexer, e
 * o sintoma seria sombra sumindo numa ponta do mapa, que ninguem liga a causa.
 */
export const WORLD_BOUNDS = (() => {
  const xs = REGIONS.flatMap((r) => [r.center.x - r.radius, r.center.x + r.radius]);
  const zs = REGIONS.flatMap((r) => [r.center.z - r.radius, r.center.z + r.radius]);
  const center = vec3(
    (Math.min(...xs) + Math.max(...xs)) / 2,
    0,
    (Math.min(...zs) + Math.max(...zs)) / 2,
  );
  const radius = Math.max(
    ...REGIONS.map((r) => Math.hypot(r.center.x - center.x, r.center.z - center.z) + r.radius),
  );
  return { center, radius };
})();

/**
 * Meia-extensao que enquadra o arquipelago **visto da origem**.
 *
 * Diferente do raio de `WORLD_BOUNDS`, e de proposito: a luz do sol aponta para
 * a origem, entao a caixa ortografica da sombra tambem e centrada la. Usar o
 * raio do arquipelago deixaria o Pomar e o Bosque fora do enquadramento, e o
 * sintoma seria uma regiao inteira sem sombra nenhuma — coisa que so aparece
 * indo ate la olhar.
 */
export const WORLD_SHADOW_EXTENT = Math.max(
  ...REGIONS.map((r) => Math.hypot(r.center.x, r.center.z) + r.radius),
);
