import { REGIONS, regionById, type RegionId } from './regions.logic';

/**
 * As cachoeiras.
 *
 * Existem para explicar o desnivel. O arquipelago tem regioes em alturas
 * diferentes — a Praia no nivel do mar, o Pico a sete metros — e sem nada
 * escorrendo pela borda o degrau parece arbitrario. Com a queda, a altura vira
 * paisagem.
 *
 * Nenhum asset externo, como no resto do jogo: sao caixas low poly descendo em
 * laco.
 */

export const WATERFALL = {
  /** Altura do mar; a queda termina abaixo dela, para nao pairar sobre a agua. */
  seaLevel: -1.6,
  /** Desnivel minimo para valer uma queda. Abaixo disto seria um respingo. */
  minDrop: 3,
  /** Quantas caixas compoem uma queda. */
  droplets: 14,
  /** Velocidade da descida, em metros por segundo. */
  speed: 6,
  /** Largura e espessura da cortina de agua. */
  width: 2.6,
  thickness: 0.5,
} as const;

export interface Waterfall {
  id: string;
  region: RegionId;
  x: number;
  z: number;
  topY: number;
  bottomY: number;
  /** Para onde a queda "olha" — usado para orientar a cortina. */
  angle: number;
}

/**
 * Uma queda por regiao alta, na borda oposta ao centro do arquipelago.
 *
 * Do lado de fora, e nao entre duas regioes: entre elas fica a ponte, e agua
 * caindo em cima do caminho transformaria a travessia num chuveiro.
 */
export const WATERFALLS: Waterfall[] = REGIONS.filter(
  (regiao) => regiao.groundY - WATERFALL.seaLevel >= WATERFALL.minDrop,
).map((regiao) => {
  // Aponta para longe da origem, que e onde fica a Praia: a queda vira o fundo
  // da regiao, visivel de dentro dela sem atrapalhar a ida para a vizinha.
  const angle = Math.atan2(regiao.center.z, regiao.center.x);
  return {
    id: `queda-${regiao.id}`,
    region: regiao.id,
    x: regiao.center.x + Math.cos(angle) * regiao.radius,
    z: regiao.center.z + Math.sin(angle) * regiao.radius,
    topY: regiao.groundY,
    // Termina abaixo do mar para a cortina entrar na agua em vez de parar nela.
    bottomY: WATERFALL.seaLevel - 0.8,
    angle,
  };
});

/** As quedas desta regiao. */
export function waterfallsFor(id: RegionId): Waterfall[] {
  return WATERFALLS.filter((queda) => queda.region === id);
}

/**
 * Altura de uma gota no instante `elapsed`.
 *
 * Calculada **do relogio, por modulo** — nunca somando delta quadro a quadro.
 * Somando, o erro de ponto flutuante se acumula e depois de alguns minutos as
 * gotas escapam da queda; e o tipo de defeito que so aparece para quem deixou o
 * jogo aberto, e que nenhum teste curto pegaria.
 *
 * As gotas saem espalhadas ao longo da queda pelo proprio indice, para a cortina
 * nascer cheia em vez de ir se enchendo depois que o jogo abre.
 */
export function dropletHeight(
  elapsed: number,
  index: number,
  topY: number,
  bottomY: number,
): number {
  const altura = topY - bottomY;
  const periodo = altura / WATERFALL.speed;
  const defasagem = (index / WATERFALL.droplets) * periodo;
  const fase = (((elapsed + defasagem) % periodo) + periodo) % periodo;
  return topY - fase * WATERFALL.speed;
}

/** Onde a espuma bate, para o respingo na base. */
export function splashPosition(queda: Waterfall): { x: number; y: number; z: number } {
  return { x: queda.x, y: WATERFALL.seaLevel + 0.1, z: queda.z };
}

/** Util para as views: a regiao existe e tem queda? */
export function hasWaterfall(id: RegionId): boolean {
  return waterfallsFor(id).length > 0;
}

/** Só para leitura em teste e depuracao. */
export function waterfallRegions(): RegionId[] {
  return WATERFALLS.map((queda) => regionById(queda.region).id);
}
