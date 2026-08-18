/** XP ganho por resposta correta (base antes do multiplicador). */
export const XP_BASE = 10;

/** Crescimento do multiplicador a cada acerto consecutivo. */
export const XP_MULTIPLIER_STEP = 0.5;

/** Teto do multiplicador: sequências muito longas não disparam XP infinito. */
export const XP_MULTIPLIER_MAX = 3;

/**
 * Multiplicador de XP por combo:
 * combo 1 → ×1, combo 2 → ×1,5, combo 3 → ×2 ... até o teto ×3.
 */
export function xpMultiplier(combo: number): number {
  if (combo <= 0) return 1;
  return Math.min(1 + (combo - 1) * XP_MULTIPLIER_STEP, XP_MULTIPLIER_MAX);
}

/** XP ganho por uma resposta correta no combo atual. */
export function xpReward(combo: number): number {
  return Math.round(XP_BASE * xpMultiplier(combo));
}
