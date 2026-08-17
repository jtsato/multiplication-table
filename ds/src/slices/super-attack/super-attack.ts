import { SUPER_ATTACK_COMBO } from "../combo/combo";

/** Super Ataque fica disponível quando o combo atinge o limite. */
export function canUseSuper(combo: number): boolean {
  return combo >= SUPER_ATTACK_COMBO;
}

/** Dano do Super Ataque: escala com o combo acumulado. */
export function superAttackDamage(base: number, combo: number): number {
  return base * combo;
}
