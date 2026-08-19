import { vec3 } from '../../shared/vec';

/**
 * A baleia do Porto.
 *
 * Um **acontecimento**, nao uma mecanica: ela sobe no mar aberto, solta o
 * esguicho e mergulha, sem dar moeda nem recurso. Serve para a crianca parar
 * de fazer conta e olhar. A logica e pura para ser testada sem cena — o que
 * importa e que a janela exista, que o corpo suba e desça, e que o esguicho
 * so aconteca no meio da janela.
 */

export const WHALE = {
  /** Onde a baleia aparece, no mar aberto ao lado do Porto. */
  position: vec3(54, 0, -4),
  /** Ciclo completo do acontecimento, em segundos. */
  cycleSeconds: 120,
  /** Inicio da janela visivel dentro do ciclo. */
  windowStart: 70,
  /** Fim da janela visivel dentro do ciclo. */
  windowEnd: 95,
  /** Altura maxima que o corpo sobe acima da agua. */
  riseHeight: 4,
  /** Fracoes do progresso em que o esguicho fica visivel. */
  spoutStart: 0.4,
  spoutEnd: 0.6,
} as const;

export interface WhaleState {
  active: boolean;
  /** 0 a 1 dentro da janela visivel; 0 fora dela. */
  progress: number;
}

/** O estado da baleia para um instante do relogio. */
export function whaleState(clockSeconds: number): WhaleState {
  const ciclo = ((clockSeconds % WHALE.cycleSeconds) + WHALE.cycleSeconds) % WHALE.cycleSeconds;
  if (ciclo < WHALE.windowStart || ciclo >= WHALE.windowEnd) {
    return { active: false, progress: 0 };
  }
  return {
    active: true,
    progress: (ciclo - WHALE.windowStart) / (WHALE.windowEnd - WHALE.windowStart),
  };
}

/**
 * Altura do corpo: sobe na primeira metade da janela e mergulha na segunda.
 * Fora da janela fica abaixo da agua, invisivel.
 */
export function whaleHeight(state: WhaleState): number {
  if (!state.active) return -10;
  const t = state.progress;
  const subida = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
  return subida * WHALE.riseHeight;
}

/** O esguicho so existe no meio da janela — o auge do acontecimento. */
export function whaleIsSpouting(state: WhaleState): boolean {
  return state.active && state.progress >= WHALE.spoutStart && state.progress <= WHALE.spoutEnd;
}

/** O instante do relogio que cai no meio da janela, para testes e E2E. */
export function whaleMidWindow(): number {
  return WHALE.windowStart + (WHALE.windowEnd - WHALE.windowStart) / 2;
}
