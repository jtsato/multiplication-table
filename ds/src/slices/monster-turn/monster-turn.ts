import type { MonsterSpec } from "../battle/battle.types";

/** Dano do ataque do monstro (usado apenas na mensagem/feedback). */
export function monsterAttackDamage(base: number): number {
  return Math.max(0, base);
}

/**
 * Novo HP do herói após um erro. A dificuldade atual é de 3 erros:
 * cada erro custa 1 ponto de tolerância (HP). Escudos futuros poderão
 * aumentar esse total (ex.: 4 erros).
 */
export function takeMonsterTurn(heroHp: number, _monster: MonsterSpec): number {
  void _monster; // o dano do monstro é usado apenas como feedback na mensagem
  return Math.max(0, heroHp - 1);
}
