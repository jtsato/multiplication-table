import type { MonsterSpec } from "../battle/battle.types";

/** Dano do ataque do monstro; nunca é negativo. */
export function monsterAttackDamage(base: number): number {
  return Math.max(0, base);
}

/** Novo HP do herói após o turno do monstro (nunca abaixo de 0). */
export function takeMonsterTurn(heroHp: number, monster: MonsterSpec): number {
  return Math.max(0, heroHp - monsterAttackDamage(monster.damage));
}
