import type { MessageKey } from "../../shared/i18n/i18n";
import type { MultiplicationFact } from "../math-question/question.types";

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
  /** Dano causado ao herói quando ele erra a pergunta. */
  damage: number;
}

/** Monstro vivo em batalha: especificação + HP atual. */
export type BattleMonster = MonsterSpec & Pick<Combatant, "hp">;

export interface BattleLogEntry {
  key: MessageKey;
  params?: Record<string, string | number>;
}

export interface BattleState {
  phase: BattlePhase;
  hero: Combatant;
  monster: BattleMonster;
  /** Pergunta atual (nula fora da fase question). */
  question: MultiplicationFact | null;
  /** Alternativas da pergunta atual. */
  alternatives: number[];
  /** Acertos consecutivos do jogador. */
  combo: number;
  /** Combo >= 3 habilita o Super Ataque (Slice 5). */
  superReady: boolean;
  /** Mensagens da batalha (chaves i18n + parâmetros). */
  log: BattleLogEntry[];
}

export type BattleAction =
  | { type: "START_BATTLE"; monster: MonsterSpec }
  | { type: "BEGIN_QUESTION"; question: MultiplicationFact; alternatives: number[] }
  | { type: "ANSWER"; value: number };
