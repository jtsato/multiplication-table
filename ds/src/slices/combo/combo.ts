/** Acertos consecutivos necessários para liberar o Super Ataque. */
export const SUPER_ATTACK_COMBO = 3;

/** Próximo valor de combo: +1 no acerto, reset para 0 no erro. */
export function nextCombo(current: number, correct: boolean): number {
  return correct ? current + 1 : 0;
}
