import type { AppStrings } from '../../i18n';
import { distanceSqXZ, type Vec3, vec3 } from '../../shared/vec';

/**
 * A casa.
 *
 * Ela **ja existe quando o jogo comeca**. Nao e construcao, nao e desbloqueio,
 * nao custa recurso: um porto seguro que precisa ser conquistado nao e seguro.
 *
 * Fica um pouco fora do centro para nao brigar com o ponto de nascimento do
 * jogador, mas perto o bastante para ser a primeira coisa que ele ve.
 */
export const HOME = {
  position: vec3(-9, 0, -6),
  /** Meia-largura e meia-profundidade da planta, em metros. */
  halfWidth: 3.2,
  halfDepth: 2.6,
  wallHeight: 2.8,
  /**
   * Raio da luz da casa.
   *
   * Maior que a propria casa de proposito: a varanda tambem e abrigo, e a
   * crianca nao deveria ter que estar exatamente dentro das paredes para a
   * lanterna parar de gastar. O acolhimento comeca antes da porta.
   */
  lightRadius: 8,
  /** Distancia para interagir com um movel. */
  spotRange: 1.2,
  /**
   * Folga em volta da casa onde nenhum recurso nasce.
   *
   * A casa nao cabe dentro de `ISLAND.spawnClearance` — ela fica longe do
   * centro de proposito —, entao a exclusao e feita pelo proprio retangulo dela
   * em vez de por um circulo gigante no meio da ilha, que esvaziaria metade do
   * mapa.
   */
  clearance: 2.5,
} as const;

/** Os moveis com os quais da para interagir. */
export type HomeSpot = 'espelho' | 'mural' | 'cama' | 'caderneta';

/**
 * Onde cada movel fica, **relativo ao centro da casa**.
 *
 * Encostados nas paredes e afastados entre si mais que `spotRange * 2`, para que
 * nunca haja duvida sobre qual deles a crianca quis usar.
 *
 * Relativo e absoluto vivem separados de proposito: a cena desenha os moveis
 * dentro de um `<group>` que ja desloca para a casa, e usar as coordenadas
 * absolutas la somaria a posicao da casa duas vezes — foi exatamente o que
 * aconteceu, e os moveis apareceram do lado de fora.
 */
export const HOME_SPOT_OFFSETS: Record<HomeSpot, Vec3> = {
  espelho: vec3(-2.2, 0, -1.4),
  mural: vec3(2.2, 0, -1.4),
  cama: vec3(2.2, 0, 1.6),
  caderneta: vec3(-2.8, 0, 2.2),
};

/** As mesmas posicoes, em coordenadas do mundo. Usadas pela logica de alcance. */
export const HOME_SPOTS: Record<HomeSpot, Vec3> = {
  espelho: vec3(
    HOME.position.x + HOME_SPOT_OFFSETS.espelho.x,
    0,
    HOME.position.z + HOME_SPOT_OFFSETS.espelho.z,
  ),
  mural: vec3(
    HOME.position.x + HOME_SPOT_OFFSETS.mural.x,
    0,
    HOME.position.z + HOME_SPOT_OFFSETS.mural.z,
  ),
  cama: vec3(
    HOME.position.x + HOME_SPOT_OFFSETS.cama.x,
    0,
    HOME.position.z + HOME_SPOT_OFFSETS.cama.z,
  ),
  caderneta: vec3(
    HOME.position.x + HOME_SPOT_OFFSETS.caderneta.x,
    0,
    HOME.position.z + HOME_SPOT_OFFSETS.caderneta.z,
  ),
};

export function homeSpotLabel(spot: HomeSpot, strings: AppStrings): string {
  const labels: Record<HomeSpot, string> = {
    espelho: strings.mirrorTitle,
    mural: strings.chartTitle,
    cama: strings.bedLabel,
    caderneta: strings.bookTitle,
  };
  return labels[spot];
}

/**
 * As seis decorações da loja que a casa desenha.
 *
 * A lista mora aqui, e não na slice de economia: a casa sabe o que ela exibe e
 * a loja sabe o que ela vende. Um teste cruza as duas listas para garantir que
 * nenhum item de categoria `casa` fique sem visual nem apareça peça órfã.
 */
export const HOME_DECORATION_KINDS = [
  'tapete',
  'aquario',
  'vaso',
  'lustre',
  'prateleira',
  'escultura',
] as const;

export type HomeDecorationKind = (typeof HOME_DECORATION_KINDS)[number];

/**
 * Onde cada decoração fica, **relativo ao centro da casa**.
 *
 * As posições respeitam as paredes e os móveis interativos: nenhuma peça nasce
 * em cima do espelho, do mural ou da cama, e todas ficam dentro do retângulo da
 * casa. O lustre pendura do teto; a prateleira fica na parede, mais alta.
 */
export const HOME_DECORATION_OFFSETS: Record<HomeDecorationKind, Vec3> = {
  tapete: vec3(0, 0.04, 0.4),
  aquario: vec3(-1.4, 0, 2.3),
  vaso: vec3(2.8, 0, 0.1),
  lustre: vec3(0, HOME.wallHeight - 0.45, 0),
  prateleira: vec3(-2.7, 1.2, 0.1),
  escultura: vec3(0, 0, -2.1),
};

/**
 * A posicao esta dentro das paredes?
 *
 * Retangulo, e nao circulo: a casa e retangular, e usar um circulo faria o
 * telhado sumir antes de a crianca cruzar a porta.
 */
export function isInsideHome(position: Vec3): boolean {
  return (
    Math.abs(position.x - HOME.position.x) <= HOME.halfWidth &&
    Math.abs(position.z - HOME.position.z) <= HOME.halfDepth
  );
}

/** Esta dentro do alcance da luz da casa — dentro ou na varanda? */
export function isInHomeLight(position: Vec3): boolean {
  return distanceSqXZ(position, HOME.position) <= HOME.lightRadius * HOME.lightRadius;
}

/**
 * Movel mais proximo dentro do alcance, ou `null`.
 *
 * So responde de dentro da casa: passar raspando pela parede de fora nao pode
 * abrir o guarda-roupa.
 */
export function nearestSpot(position: Vec3, range: number = HOME.spotRange): HomeSpot | null {
  if (!isInsideHome(position)) return null;

  const rangeSq = range * range;
  let best: HomeSpot | null = null;
  let bestDistanceSq = Infinity;

  for (const [spot, spotPosition] of Object.entries(HOME_SPOTS) as [HomeSpot, Vec3][]) {
    const distanceSq = distanceSqXZ(position, spotPosition);
    if (distanceSq <= rangeSq && distanceSq < bestDistanceSq) {
      best = spot;
      bestDistanceSq = distanceSq;
    }
  }

  return best;
}

/**
 * O ponto invade a casa (ou a folga em volta dela)?
 *
 * Usado pela geracao de recursos para nao nascer uma arvore dentro da sala. Vive
 * aqui, e nao no mundo, porque quem sabe onde a casa esta e a casa — o mundo so
 * recebe um predicado e obedece.
 */
export function blocksHome(position: Vec3): boolean {
  return (
    Math.abs(position.x - HOME.position.x) <= HOME.halfWidth + HOME.clearance &&
    Math.abs(position.z - HOME.position.z) <= HOME.halfDepth + HOME.clearance
  );
}

/**
 * Quantos segundos faltam ate o proximo amanhecer.
 *
 * "Proximo" e literal: dormir durante o amanhecer leva ao amanhecer do dia
 * seguinte, e nao a zero. Sem isso, dormir de manha nao passaria o tempo e a
 * cama pareceria quebrada.
 */
export function secondsUntilNextDawn(
  clock: number,
  cycleSeconds: number,
  dawnStart: number,
): number {
  const posicao = ((clock % cycleSeconds) + cycleSeconds) % cycleSeconds;
  const alvo = dawnStart * cycleSeconds;
  const falta = alvo - posicao;
  return falta > 0 ? falta : falta + cycleSeconds;
}
