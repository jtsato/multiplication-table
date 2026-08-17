import { parseFactKey, TABLES } from './facts';
import { isMastered } from './mastery';
import { accuracy, getIslandProgress, isArchipelagoComplete } from './progression';
import { globalAccuracy } from './statistics';
import type { FactKey, GameState, MultiplicationFact } from './types';

/**
 * O retrato da jornada inteira — o que a crianca ve no fechamento do jogo.
 *
 * Nada aqui e guardado: tudo e derivado do progresso e das estatisticas que
 * ja existem. Assim o diploma pode ser aberto de novo a qualquer momento e
 * continua verdadeiro, sem depender de ter sido "capturado" no dia certo.
 */

/** Teto de estrelas por ilha; espelha `computeStars`. */
export const STARS_PER_ISLAND = 3;

export interface JourneyIsland {
  table: number;
  stars: number;
  /** Precisao de primeira tentativa naquela ilha, 0..1. */
  accuracy: number;
}

/** A conta que mais custou e que, no fim, a crianca dominou. */
export interface ToughestVictory {
  key: FactKey;
  fact: MultiplicationFact;
  /** Quantas vezes ela errou esta conta antes de domina-la. */
  mistakes: number;
}

export interface JourneySummary {
  complete: boolean;
  islands: JourneyIsland[];
  totalStars: number;
  maxStars: number;
  totalQuestions: number;
  totalCorrect: number;
  /** Precisao global, 0..1. */
  accuracy: number;
  bestStreak: number;
  playSessions: number;
  /** Conclusao da ultima ilha: a data em que a jornada terminou. */
  finishedAt: string | null;
  toughestVictory: ToughestVictory | null;
}

/**
 * A conta mais dificil ja vencida.
 *
 * Exige dominio atual, e nao apenas muitos erros: o texto diz "voce venceu",
 * entao mostrar uma conta ainda fraca seria mentira. Sem candidata, devolve
 * null e a tela simplesmente omite a linha.
 */
export function findToughestVictory(state: GameState): ToughestVictory | null {
  const entries = Object.entries(state.statistics.facts)
    .filter(([key, stat]) => stat.incorrect > 0 && isMastered(state.statistics.facts, key))
    // Mais erros primeiro; empate desempatado por tentativas e depois pela
    // chave, para que a mesma jornada mostre sempre a mesma conta.
    .sort(
      ([keyA, a], [keyB, b]) =>
        b.incorrect - a.incorrect || b.attempts - a.attempts || keyA.localeCompare(keyB),
    );

  const best = entries[0];
  if (!best) {
    return null;
  }

  const [key, stat] = best;
  const fact = parseFactKey(key);
  if (!fact) {
    return null;
  }

  return { key, fact, mistakes: stat.incorrect };
}

export function buildJourneySummary(state: GameState): JourneySummary {
  const islands: JourneyIsland[] = TABLES.map((table) => {
    const island = getIslandProgress(state.progress, table);
    return {
      table,
      stars: island.stars,
      accuracy: accuracy(island.firstTryCorrect, island.questionsAnswered),
    };
  });

  // A jornada termina na ultima ilha concluida, nao na primeira. Datas ISO
  // comparam como texto na mesma ordem em que acontecem.
  const finishedAt = TABLES.reduce<string | null>((latest, table) => {
    const date = getIslandProgress(state.progress, table).completedAt;
    if (date === null) {
      return latest;
    }
    return latest === null || date > latest ? date : latest;
  }, null);

  return {
    complete: isArchipelagoComplete(state.progress),
    islands,
    totalStars: islands.reduce((sum, island) => sum + island.stars, 0),
    maxStars: TABLES.length * STARS_PER_ISLAND,
    totalQuestions: state.statistics.totalQuestions,
    totalCorrect: state.statistics.totalCorrect,
    accuracy: globalAccuracy(state.statistics),
    bestStreak: state.statistics.bestStreak,
    playSessions: state.statistics.playSessions,
    finishedAt,
    toughestVictory: findToughestVictory(state),
  };
}
