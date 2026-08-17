/** Dano base de um ataque normal do herói. */
export const HERO_BASE_DAMAGE = 6;

/** Dano do herói; nunca é negativo. */
export function playerAttackDamage(base: number): number {
  return Math.max(0, base);
}
