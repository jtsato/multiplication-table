import { type Rng, shuffle } from '../../shared/rng';
import { type ResourceKind } from '../resources/resources.logic';

/** Quantas alternativas o painel oferece. */
export const OPTION_COUNT = 3;

/**
 * Fracao da colheita entregue quando a crianca erra.
 *
 * Nunca zero, de proposito: errar precisa custar progresso, nao punir. Um erro
 * que zera a recompensa ensina a evitar o desafio; um erro que rende menos
 * ensina a tentar de novo.
 */
export const WRONG_ANSWER_RATIO = 0.25;

/**
 * Para que serve o desafio.
 *
 * `colher` rende recurso; `abastecer` rende tempo de fogueira; `alimentar`
 * rende amizade com um animal; `encomenda` entrega um pedido de NPC e paga
 * moedas; `pedagio` libera a ponte depois da conta da guardia. A conta e a
 * mesma — o que muda e o que ela compra. A matematica continua sendo a unica
 * moeda de progresso.
 */
export type ChallengePurpose =
  | 'colher'
  | 'abastecer'
  | 'alimentar'
  | 'encomenda'
  | 'pedagio'
  | 'construir';

/**
 * Alvo minimo de um desafio.
 *
 * `ResourceNode` satisfaz esta forma estruturalmente; a fogueira monta uma na
 * hora de pedir lenha. Assim a slice de matematica nao precisa conhecer nem
 * recurso nem construcao.
 */
export interface ChallengeTarget {
  id: string;
  kind: ResourceKind;
  groups: number;
  /** Itens por grupo — a tabuada que este alvo pergunta. */
  perGroup: number;
}

/**
 * Um desafio.
 *
 * **So dados.** O enunciado nao mora aqui: ele e montado na hora de desenhar,
 * pela gramatica do idioma escolhido. Guardar a frase pronta no store faria o
 * texto congelar no idioma em que o desafio foi aberto — e obrigaria o store,
 * que e regra de jogo, a conhecer traducao.
 */
export interface Challenge {
  targetId: string;
  purpose: ChallengePurpose;
  kind: ResourceKind;
  /** Numero de grupos que o objeto exibe — o multiplicando. */
  groups: number;
  /** Itens por grupo — a tabuada perguntada. */
  perGroup: number;
  answer: number;
  options: number[];
}

export interface ChallengeOutcome {
  correct: boolean;
  /** Itens creditados no inventario. */
  reward: number;
}

/**
 * Alternativas erradas plausiveis.
 *
 * Nao sao numeros aleatorios: cada candidato representa um erro que a crianca
 * comete de verdade nesta idade —
 *
 * - `groups + perGroup`: somou em vez de multiplicar (o erro mais comum);
 * - `answer ± perGroup`: contou um grupo a mais ou a menos;
 * - `answer ± 1`: escorregou na contagem item a item.
 *
 * Um distrator obviamente absurdo deixaria a resposta certa adivinhavel sem
 * fazer a conta, que e o oposto do objetivo.
 */
export function buildDistractors(groups: number, perGroup: number, rng: Rng): number[] {
  const answer = groups * perGroup;
  const candidates = [
    groups + perGroup,
    answer + perGroup,
    answer - perGroup,
    answer + 1,
    answer - 1,
  ];

  const viable: number[] = [];
  for (const candidate of candidates) {
    if (candidate > 0 && candidate !== answer && !viable.includes(candidate)) {
      viable.push(candidate);
    }
  }

  const chosen = shuffle(rng, viable).slice(0, OPTION_COUNT - 1);

  // Rede de seguranca: com numeros muito pequenos a lista pode ficar curta.
  // Completa com os proximos multiplos, que continuam plausiveis.
  let extra = answer + perGroup * 2;
  while (chosen.length < OPTION_COUNT - 1) {
    if (extra !== answer && !chosen.includes(extra)) chosen.push(extra);
    extra += perGroup;
  }

  return chosen;
}

/**
 * Monta o desafio a partir do que o no exibe na cena.
 *
 * O multiplicando vem de `node.groups`, o mesmo numero que `itemPlacements` usa
 * para desenhar os grupos. Enunciado e geometria nao podem divergir: a crianca
 * tem que conseguir conferir a resposta contando na tela.
 */
export function generateChallenge(
  target: ChallengeTarget,
  rng: Rng,
  purpose: ChallengePurpose = 'colher',
): Challenge {
  const groups = target.groups;
  const perGroup = target.perGroup;
  const answer = groups * perGroup;

  return {
    targetId: target.id,
    purpose,
    kind: target.kind,
    groups,
    perGroup,
    answer,
    options: shuffle(rng, [answer, ...buildDistractors(groups, perGroup, rng)]),
  };
}

/** Avalia a escolha e diz quanto recurso ela rende. */
export function resolveAnswer(challenge: Challenge, choice: number): ChallengeOutcome {
  if (choice === challenge.answer) {
    return { correct: true, reward: challenge.answer };
  }
  return {
    correct: false,
    // Pelo menos 1: sair de maos vazias ensina a fugir do desafio.
    reward: Math.max(1, Math.floor(challenge.answer * WRONG_ANSWER_RATIO)),
  };
}
