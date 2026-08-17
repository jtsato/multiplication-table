import type { MessageKey } from "../../shared/i18n/i18n";

export type BattlePhase =
  "intro" | "question" | "hero-turn" | "monster-turn" | "victory" | "defeat";

export interface Combatant {
  nameKey: MessageKey;
  maxHp: number;
  hp: number;
}

/** Especificação de um monstro (sem HP atual — o estado vivo guarda isso). */
export interface MonsterSpec extends Omit<Combatant, "hp"> {
  id: string;
}

export interface BattleLogEntry {
  key: MessageKey;
  params?: Record<string, string | number>;
}

export interface BattleState {
  phase: BattlePhase;
  hero: Combatant;
  monster: Combatant;
  /** Acertos consecutivos do jogador. */
  combo: number;
  /** Combo >= 3 habilita o Super Ataque (Slice 5). */
  superReady: boolean;
  /** Mensagens da batalha (chaves i18n + parâmetros). */
  log: BattleLogEntry[];
}

export type BattleAction = { type: "START_BATTLE"; monster: MonsterSpec };
