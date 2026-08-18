/**
 * Lanterna: a luz que a crianca leva com ela.
 *
 * A carga e guardada como **prazo** (`chargedUntil`), e nao como quantidade que
 * decresce. Esta e a mesma decisao ja tomada para o combustivel da fogueira em
 * `building.logic.ts`, e pelo mesmo motivo: um numero que diminui precisaria ser
 * escrito no store a cada quadro, que e exatamente o que a regra de performance
 * do projeto proibe. Como prazo, a lanterna "queima" sozinha, sem nenhuma
 * escrita, e quem precisa do valor atual chama uma funcao pura daqui.
 *
 * A semelhanca com a fogueira e deliberada: sao o mesmo modelo, e ler as duas
 * lado a lado tem que ser facil.
 */

export interface Lantern {
  /** Instante do relogio do jogo em que a lanterna apaga. */
  chargedUntil: number;
}

export const LANTERN = {
  /**
   * Quanto tempo uma carga dura, em segundos.
   *
   * A noite dura 48 s. Uma carga cobre a noite inteira com folga de proposito:
   * uma conta basta para aproveitar a noite toda, e a crianca nunca fica
   * dividida entre explorar e voltar correndo para reacender.
   */
  chargeSeconds: 60,
  /**
   * Teto de cargas acumuladas.
   *
   * Recarregar cedo nao e desperdicio — soma ao que restava —, mas tambem nao
   * da para encher a lanterna de manha e ignorar a mecanica pelo resto do dia.
   */
  maxCharges: 2,
  /** Raio iluminado, em metros. */
  radius: 9,
  /** Abaixo disto a luz comeca a esmaecer e o HUD avisa. */
  lowChargeSeconds: 15,
  /** Forca da luz com a carga cheia. */
  intensity: 18,
} as const;

/** Segundos de carga que ainda restam. */
export function chargeRemaining(lantern: Lantern, now: number): number {
  return Math.max(0, lantern.chargedUntil - now);
}

/** A lanterna esta acesa neste instante? */
export function isGlowing(lantern: Lantern, now: number): boolean {
  return chargeRemaining(lantern, now) > 0;
}

/**
 * Novo prazo de carga apos recarregar.
 *
 * `ratio` vai de 0 a 1 conforme o acerto: a resposta certa rende uma carga
 * inteira, e o erro rende a mesma fracao que o erro rende de recurso. Nunca
 * zero — ficar no escuro por ter errado seria punicao, e o jogo nao pune.
 */
export function rechargeUntil(lantern: Lantern, now: number, ratio: number): number {
  const ganho = LANTERN.chargeSeconds * Math.min(1, Math.max(0, ratio));
  const restante = chargeRemaining(lantern, now);
  return now + Math.min(restante + ganho, LANTERN.chargeSeconds * LANTERN.maxCharges);
}

/**
 * Forca da luz agora.
 *
 * Esmaece nos ultimos `lowChargeSeconds` em vez de apagar de estalo. E decisao
 * de tom, nao de realismo: o aviso de que a carga esta acabando tem que ser
 * gentil, e uma luz que vai baixando avisa sem assustar — a crianca ve o
 * proprio tempo acabando e decide o que fazer.
 */
export function lanternIntensity(lantern: Lantern, now: number): number {
  const restante = chargeRemaining(lantern, now);
  if (restante <= 0) return 0;
  if (restante >= LANTERN.lowChargeSeconds) return LANTERN.intensity;
  return LANTERN.intensity * (restante / LANTERN.lowChargeSeconds);
}
