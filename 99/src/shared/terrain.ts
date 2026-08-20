import type { SoundName } from './audio';

/**
 * Terreno e superfícies: o que o pé pisa.
 *
 * Vive em `shared` porque tanto o jogador (passos) quanto o juice (partículas de
 * poeira) podem precisar saber se o chão é areia, grama, madeira ou pedra sem
 * que uma slice dependa da outra.
 */

/** De quantos metros em metros um passo deve soar. */
export const STEP_DISTANCE_METERS = 2.4;

/**
 * O som do passo conforme a região.
 *
 * A Praia é areia, o Porto é cais de madeira, Bosque e Pomar são grama, e
 * Cachoeira/Pico são pedra. Fora de terra (`null`) não há passo — o jogador não
 * anda na água.
 */
export function stepSoundFor(regionId: string | null): SoundName | null {
  switch (regionId) {
    case 'praia':
      return 'step-sand';
    case 'porto':
      return 'step-wood';
    case 'bosque':
    case 'pomar':
      return 'step-grass';
    case 'cachoeira':
    case 'pico':
      return 'step-stone';
    default:
      return null;
  }
}
