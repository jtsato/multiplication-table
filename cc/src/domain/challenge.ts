import { factKey, factsForTables, TABLES } from './facts';
import type { MissionDefinition } from './missions';
import { isArchipelagoComplete } from './progression';
import { applyCooldown, factWeight } from './review';
import { weightedPick, type Rng } from './rng';
import type {
  ChallengeRecord,
  FactKey,
  FactStats,
  GameProgress,
  MultiplicationFact,
} from './types';

/**
 * Modo Desafio — a Ilha Lendaria.
 *
 * O que existe depois de terminar o arquipelago: contas de TODAS as tabuadas
 * misturadas, com as mais fracas voltando mais vezes.
 *
 * Decisao de produto, coerente com `progression.ts`: o desafio NAO tem gate
 * nem derrota. Nao ha tempo limite por pergunta, nao ha vidas, errar nao
 * encerra nada. O cronometro apenas registra quanto durou a corrida, para dar
 * o que superar na proxima. Precisao continua sendo objetivo, nunca portao —
 * um jogo que finalmente pune erros na ultima tela ensinaria o contrario de
 * tudo que ele ensinou ate ali.
 */

/** Perguntas de uma corrida. Curta o bastante para repetir sem cansar. */
export const CHALLENGE_QUESTION_COUNT = 12;

/** Sempre 4 alternativas: o desafio e para quem ja passou por todas as ilhas. */
export const CHALLENGE_OPTION_COUNT = 4;

/**
 * O desafio se apresenta ao motor de fases como uma missao sintetica, e com
 * isso reaproveita a maquina de estados inteira (`submitAnswer`, `advance`).
 *
 * `table: 0` e deliberado: o desafio nao pertence a ilha nenhuma. Quem sorteia
 * as contas e `selectChallengeFact`, nunca a tabuada do estado — por isso o
 * valor nunca chega a `getIsland`.
 */
export const CHALLENGE_MISSION: MissionDefinition = {
  id: 'challenge',
  table: 0,
  scene: 'tower',
  questionCount: CHALLENGE_QUESTION_COUNT,
  isFinalChallenge: true,
  order: 1,
};

export function createInitialChallenge(): ChallengeRecord {
  return { bestScore: 0, bestTimeMs: null, runs: 0, lastPlayedAt: null };
}

/** O desafio so aparece depois que todas as ilhas foram concluidas. */
export function isChallengeUnlocked(progress: GameProgress): boolean {
  return isArchipelagoComplete(progress);
}

/**
 * Sorteia a proxima conta do desafio: qualquer tabuada, com peso maior para
 * as que a crianca domina menos.
 *
 * Reusa `factWeight` e `applyCooldown` da revisao adaptativa — a "revanche"
 * das contas fracas ja e o comportamento natural daquele peso, sem precisar
 * de uma regra propria aqui.
 */
export function selectChallengeFact(
  rng: Rng,
  stats: FactStats,
  recentKeys: readonly FactKey[],
): MultiplicationFact {
  const pool = applyCooldown(factsForTables(TABLES), recentKeys);
  const weights = pool.map((fact) => factWeight(stats, factKey(fact)));
  return weightedPick(rng, pool, weights);
}

export interface ChallengeRunResult {
  /** Acertos de primeira tentativa. */
  score: number;
  total: number;
  elapsedMs: number;
  completedAt: string;
}

export interface ChallengeOutcome {
  record: ChallengeRecord;
  /** A corrida bateu o melhor resultado anterior. */
  isNewRecord: boolean;
}

/**
 * Guarda o resultado de uma corrida.
 *
 * Recorde e primeiro por acertos e so depois por tempo: o jogo premia acertar,
 * e a velocidade e desempate. Correr rapido errando nunca vira recorde.
 */
export function applyChallengeResult(
  record: ChallengeRecord,
  result: ChallengeRunResult,
): ChallengeOutcome {
  const beatsScore = result.score > record.bestScore;
  const tiesScoreAndIsFaster =
    result.score === record.bestScore &&
    (record.bestTimeMs === null || result.elapsedMs < record.bestTimeMs);
  const isNewRecord = record.runs === 0 || beatsScore || tiesScoreAndIsFaster;

  return {
    record: {
      bestScore: isNewRecord ? result.score : record.bestScore,
      bestTimeMs: isNewRecord ? result.elapsedMs : record.bestTimeMs,
      runs: record.runs + 1,
      lastPlayedAt: result.completedAt,
    },
    isNewRecord,
  };
}

/** Corrida perfeita: todas as contas acertadas de primeira. */
export function isPerfectRun(record: ChallengeRecord): boolean {
  return record.bestScore >= CHALLENGE_QUESTION_COUNT;
}

/** "1:07" — minutos e segundos, o formato que a crianca le no cronometro. */
export function formatDuration(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.round(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
