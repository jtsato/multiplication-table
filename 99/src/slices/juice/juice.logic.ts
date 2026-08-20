import type { SoundName } from '../../shared/audio';
import { palette } from '../../shared/palette';
import type { ChallengeFeedback } from '../math/math.store';

/**
 * Regras do feedback sensorial (juice).
 *
 * A parte *visual* (partículas e tremor) mora na view; aqui fica a parte que dá
 * para testar sem WebGL: qual explosão cada resposta merece, qual superfície o
 * pé está pisando e de quanto em quanto tempo um passo deve soar.
 */

export type BurstKind = 'correct' | 'wrong' | 'lantern' | 'feed' | 'order' | 'bridge' | 'build';

export interface BurstSpec {
  kind: BurstKind;
  color: string;
  /** Quantas partículas o burst cria. */
  count: number;
  /** Velocidade inicial das partículas, em metros por segundo. */
  speed: number;
  sound: SoundName;
  /** Intensidade do tremor de câmera (0 = sem tremor). */
  shake: number;
  /** Tamanho de cada partícula. */
  size: number;
}

/** A base de um acerto comum: poeira dourada, sem tremor. */
const ACERTO_BASE = {
  color: palette.crown,
  count: 18,
  speed: 2.6,
  shake: 0,
  size: 0.12,
} as const;

/** O erro é acolhedor: menos partículas, cor suave e um tremor sutil. */
const ERRO: BurstSpec = {
  kind: 'wrong',
  color: palette.wrong,
  count: 10,
  speed: 2,
  sound: 'wrong',
  shake: 0.1,
  size: 0.1,
};

/**
 * A explosão que cada desfecho de desafio merece.
 *
 * O propósito muda o *destino* da conta (colher, acender, amizade, encomenda,
 * ponte); o juice acompanha esse destino para a recompensa não soar igual em
 * todo lugar — a lanterna tem brilho quente, a amizade tem verde, a ponte tem
 * madeira.
 */
export function burstForFeedback(feedback: ChallengeFeedback): BurstSpec {
  if (!feedback.correct) return ERRO;

  switch (feedback.purpose) {
    case 'colher':
      return { ...ACERTO_BASE, kind: 'correct', sound: 'harvest' };
    case 'abastecer':
      return {
        kind: 'lantern',
        color: palette.lanternLight,
        count: 24,
        speed: 3,
        sound: 'lantern',
        shake: 0,
        size: 0.14,
      };
    case 'alimentar':
      return {
        kind: 'feed',
        color: palette.correct,
        count: 16,
        speed: 2.6,
        sound: 'feed',
        shake: 0,
        size: 0.12,
      };
    case 'encomenda':
      return {
        kind: 'order',
        color: palette.crown,
        count: 16,
        speed: 2.8,
        sound: 'order',
        shake: 0,
        size: 0.12,
      };
    case 'pedagio':
      return {
        kind: 'bridge',
        color: palette.bridgeDeck,
        count: 20,
        speed: 3,
        sound: 'bridge',
        shake: 0,
        size: 0.14,
      };
    case 'construir':
      return {
        kind: 'build',
        color: palette.correct,
        count: 18,
        speed: 2.6,
        sound: 'build',
        shake: 0,
        size: 0.12,
      };
  }
}

export { STEP_DISTANCE_METERS, stepSoundFor } from '../../shared/terrain';
