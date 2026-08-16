import { factKey } from '../domain/facts';
import type { MissionDefinition } from '../domain/missions';
import { createQuestion } from '../domain/questions';
import { pushRecentKey, selectNextFact } from '../domain/review';
import { randomInt, type Rng } from '../domain/rng';
import type { MissionResult } from '../domain/progression';
import type { FactKey, FactStats, Question } from '../domain/types';

/**
 * Maquina de estados de UMA missao.
 *
 * Funcoes puras: recebem o estado e devolvem um estado novo. Quem guarda o
 * estado e a tela (`useLevelSession`), quem guarda estatisticas e o
 * GameProvider. Assim o loop de jogo inteiro e testavel sem montar React.
 *
 * Ciclo de vida:
 *   briefing -> question -> (correct | wrong) -> question -> ... -> finished
 */

export type LevelPhase = 'briefing' | 'question' | 'correct' | 'wrong' | 'finished';

/** Quantos erros seguidos ate revelar a resposta e deixar a crianca seguir. */
export const REVEAL_AFTER_WRONG_ATTEMPTS = 2;

/** Quantidade de variacoes de mensagem de acerto/erro nos dicionarios. */
export const FEEDBACK_VARIANTS = 4;

export interface LevelState {
  missionId: string;
  table: number;
  optionCount: number;
  totalQuestions: number;
  phase: LevelPhase;
  question: Question | null;
  /** Perguntas ja resolvidas = blocos ja colocados no cenario. */
  resolved: number;
  /** Tentativas na pergunta atual. */
  attemptsOnCurrent: number;
  /** Perguntas acertadas de primeira; base da precisao da ilha. */
  firstTryCorrect: number;
  totalAttempts: number;
  wrongAttempts: number;
  /** Alternativa tocada por ultimo, para destacar na tela. */
  selectedOption: number | null;
  /** Mostra a ajuda visual (grupos de blocos) depois de um erro. */
  showHint: boolean;
  /** Depois de errar demais, a resposta certa fica destacada. */
  revealAnswer: boolean;
  /** Indice da variacao de mensagem a exibir. */
  feedbackVariant: number;
  recentKeys: FactKey[];
  /** Posicao da correta na pergunta anterior, para nao repetir. */
  lastCorrectIndex: number | undefined;
}

export interface LevelContext {
  mission: MissionDefinition;
  optionCount: number;
  stats: FactStats;
  unlockedTables: readonly number[];
}

export function createLevelState(context: LevelContext): LevelState {
  return {
    missionId: context.mission.id,
    table: context.mission.table,
    optionCount: context.optionCount,
    totalQuestions: context.mission.questionCount,
    phase: 'briefing',
    question: null,
    resolved: 0,
    attemptsOnCurrent: 0,
    firstTryCorrect: 0,
    totalAttempts: 0,
    wrongAttempts: 0,
    selectedOption: null,
    showHint: false,
    revealAnswer: false,
    feedbackVariant: 0,
    recentKeys: [],
    lastCorrectIndex: undefined,
  };
}

/** Sorteia a proxima pergunta usando o sistema de revisao adaptativa. */
function nextQuestion(state: LevelState, rng: Rng, context: LevelContext): Question {
  const fact = selectNextFact(rng, {
    table: state.table,
    unlockedTables: context.unlockedTables,
    stats: context.stats,
    recentKeys: state.recentKeys,
  });
  return createQuestion(rng, fact, state.optionCount, state.lastCorrectIndex);
}

/** Sai do briefing e apresenta a primeira pergunta. */
export function startQuestions(state: LevelState, rng: Rng, context: LevelContext): LevelState {
  const question = nextQuestion(state, rng, context);
  return {
    ...state,
    phase: 'question',
    question,
    attemptsOnCurrent: 0,
    selectedOption: null,
    showHint: false,
    revealAnswer: false,
    recentKeys: pushRecentKey(state.recentKeys, question.key),
    lastCorrectIndex: question.correctIndex,
  };
}

export interface AnswerOutcome {
  state: LevelState;
  wasCorrect: boolean;
  /** Chave da conta respondida, para registrar nas estatisticas. */
  key: FactKey;
  /** Verdadeiro apenas no acerto de primeira tentativa. */
  firstTry: boolean;
}

/**
 * Registra a resposta escolhida.
 *
 * Erro nao tira progresso e nao encerra nada: mostra a ajuda visual e deixa
 * tentar de novo. Depois de dois erros a resposta certa fica destacada, para
 * que ninguem trave numa pergunta.
 */
export function submitAnswer(state: LevelState, optionIndex: number, rng: Rng): AnswerOutcome {
  if (state.phase !== 'question' || !state.question) {
    return { state, wasCorrect: false, key: '', firstTry: false };
  }

  const question = state.question;
  const wasCorrect = optionIndex === question.correctIndex;
  const attemptsOnCurrent = state.attemptsOnCurrent + 1;
  const firstTry = wasCorrect && attemptsOnCurrent === 1;
  const feedbackVariant = randomInt(rng, 0, FEEDBACK_VARIANTS - 1);

  if (wasCorrect) {
    return {
      state: {
        ...state,
        phase: 'correct',
        attemptsOnCurrent,
        totalAttempts: state.totalAttempts + 1,
        resolved: state.resolved + 1,
        firstTryCorrect: state.firstTryCorrect + (firstTry ? 1 : 0),
        selectedOption: optionIndex,
        feedbackVariant,
        showHint: false,
        revealAnswer: false,
      },
      wasCorrect: true,
      key: question.key,
      firstTry,
    };
  }

  return {
    state: {
      ...state,
      phase: 'wrong',
      attemptsOnCurrent,
      totalAttempts: state.totalAttempts + 1,
      wrongAttempts: state.wrongAttempts + 1,
      selectedOption: optionIndex,
      feedbackVariant,
      showHint: true,
      revealAnswer: attemptsOnCurrent >= REVEAL_AFTER_WRONG_ATTEMPTS,
    },
    wasCorrect: false,
    key: question.key,
    firstTry: false,
  };
}

/** Volta para a mesma pergunta depois do erro, com a dica visivel. */
export function retryQuestion(state: LevelState): LevelState {
  if (state.phase !== 'wrong') {
    return state;
  }
  return { ...state, phase: 'question', selectedOption: null };
}

/** Segue para a proxima pergunta, ou encerra a missao. */
export function advance(state: LevelState, rng: Rng, context: LevelContext): LevelState {
  if (state.phase !== 'correct') {
    return state;
  }
  if (state.resolved >= state.totalQuestions) {
    return { ...state, phase: 'finished', question: null, selectedOption: null };
  }
  return startQuestions(state, rng, context);
}

/** Fracao da construcao pronta, 0..1. Alimenta o desenho do cenario. */
export function buildProgress(state: LevelState): number {
  if (state.totalQuestions <= 0) {
    return 0;
  }
  return Math.min(1, state.resolved / state.totalQuestions);
}

/** Numero da pergunta atual mostrado para a crianca (base 1). */
export function currentQuestionNumber(state: LevelState): number {
  return Math.min(state.totalQuestions, state.resolved + 1);
}

export function isFinished(state: LevelState): boolean {
  return state.phase === 'finished';
}

/** Converte a sessao encerrada no resultado que o progresso consome. */
export function toMissionResult(state: LevelState, completedAt: string): MissionResult {
  return {
    missionId: state.missionId,
    table: state.table,
    questionsAnswered: state.totalQuestions,
    firstTryCorrect: state.firstTryCorrect,
    completedAt,
  };
}

/** Precisao da missao, 0..1, contando apenas acertos de primeira. */
export function levelAccuracy(state: LevelState): number {
  if (state.totalQuestions <= 0) {
    return 0;
  }
  return state.firstTryCorrect / state.totalQuestions;
}

/** Chave da conta atual, util para registrar estatisticas. */
export function currentFactKey(state: LevelState): FactKey | null {
  return state.question ? factKey(state.question.fact) : null;
}
