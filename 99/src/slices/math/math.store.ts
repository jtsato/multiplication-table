import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { createRng, randomInt } from '../../shared/rng';
import { DEFAULT_WORLD_SEED } from '../world/world.store';
import { WRONG_ANSWER_RATIO, generateChallenge, resolveAnswer } from './math.logic';
import type { Challenge, ChallengePurpose, ChallengeTarget } from './math.logic';

/** Resultado da ultima resposta, exibido como feedback antes do painel fechar. */
export interface ChallengeFeedback {
  targetId: string;
  purpose: ChallengePurpose;
  correct: boolean;
  /** Resposta certa, mostrada tambem no erro — errar tem que ensinar. */
  answer: number;
  reward: number;
  /** Moedas pagas por esta resposta. Zero no erro: moeda so sai do acerto. */
  coins: number;
}

export interface MathSlice {
  activeChallenge: Challenge | null;
  feedback: ChallengeFeedback | null;
  /**
   * Alternativas apagadas pela dica.
   *
   * Vive aqui, e nao na economia: e estado da *apresentacao do desafio*, e some
   * junto com ele. A economia so sabe quantas dicas restam.
   */
  hiddenOptions: number[];
  /** Gasta uma dica e apaga uma alternativa errada do desafio aberto. */
  useHintOnChallenge: () => void;
  /** Abre um desafio ancorado no alvo. Ignorado se ja houver um aberto. */
  startChallenge: (target: ChallengeTarget, purpose?: ChallengePurpose) => void;
  /** Sorteia quantos feixes de lenha a fogueira vai pedir. */
  rollFuelGroups: () => number;
  /** Responde o desafio aberto e entrega a recompensa correspondente. */
  answerChallenge: (choice: number) => void;
  /** Fecha sem responder — usado quando o jogador se afasta. */
  cancelChallenge: () => void;
  clearFeedback: () => void;
}

export const createMathSlice: StateCreator<GameState, [], [], MathSlice> = (set, get) => {
  /**
   * Um unico gerador para toda a sessao, em vez de um novo por desafio.
   * Recriar o gerador a cada desafio a partir de uma semente derivada do alvo
   * faria o mesmo alvo repetir sempre as mesmas alternativas na mesma ordem.
   */
  const rng = createRng(DEFAULT_WORLD_SEED ^ 0x5f3a);

  return {
    activeChallenge: null,
    feedback: null,
    hiddenOptions: [],

    startChallenge: (target, purpose = 'colher') =>
      set((state) => {
        if (state.activeChallenge) return state;
        // Guarda defensiva: se o alvo for um no ja colhido, nao ha o que
        // desafiar. A view tambem checa, mas quem chama o store direto — outra
        // slice, um teste — nao deveria conseguir abrir um desafio invalido.
        const node = state.nodes.find((candidate) => candidate.id === target.id);
        if (node?.depleted) return state;

        return {
          activeChallenge: generateChallenge(target, rng, purpose),
          feedback: null,
          hiddenOptions: [],
        };
      }),

    rollFuelGroups: () => randomInt(rng, 1, 10),

    answerChallenge: (choice) => {
      const challenge = get().activeChallenge;
      if (!challenge) return;

      const outcome = resolveAnswer(challenge, choice);

      if (challenge.purpose === 'colher') {
        // A colheita passa pela slice de recursos: e ela que sabe esgotar o no e
        // somar no inventario. A slice de matematica so decide *quanto*.
        get().collectNode(challenge.targetId, outcome.reward);
      } else if (challenge.purpose === 'alimentar') {
        // Alimentar so acontece no acerto: errar nao paga a comida nem vira
        // amigo — a crianca ve a resposta certa e pode tentar de novo.
        if (outcome.correct) get().feedAnimal(challenge.targetId);
      } else if (challenge.purpose === 'encomenda') {
        // Entrega so no acerto: errar nao tira recurso da mochila.
        if (outcome.correct) get().completeOrder(challenge.targetId);
      } else if (challenge.purpose === 'pedagio') {
        // A conta da guardia libera a ponte; a compra em si (moedas, recursos e
        // tabuada) continua sendo validada pela slice de regioes.
        if (outcome.correct) get().buyBridge(challenge.targetId);
      } else {
        /**
         * Uma conta, dois efeitos: o fogo do acampamento e a luz que a crianca
         * leva com ela.
         *
         * A proporcao e calculada uma vez so e aplicada aos dois destinos, para
         * que fogueira e lanterna nunca contem historias diferentes sobre a
         * mesma resposta. A divisao de responsabilidade continua a mesma: aqui
         * se decide *quanto* o acerto vale, e cada slice de destino sabe aplicar.
         */
        const ratio = outcome.correct ? 1 : WRONG_ANSWER_RATIO;
        get().refuelStructure(challenge.targetId, ratio);
        get().rechargeLantern(ratio);
      }

      /**
       * A moeda e paga aqui, para os dois propositos.
       *
       * Colher e abastecer sao contas iguais em exigencia, entao pagam igual —
       * o que muda e o que a *outra* recompensa compra. Quem calcula quanto e a
       * slice de economia; esta so avisa que houve acerto.
       */
      const coinsAntes = get().coins;
      if (outcome.correct) {
        get().rewardCorrect(challenge.perGroup, challenge.groups);
      } else {
        get().breakStreak();
      }

      set({
        activeChallenge: null,
        hiddenOptions: [],
        feedback: {
          targetId: challenge.targetId,
          purpose: challenge.purpose,
          correct: outcome.correct,
          answer: challenge.answer,
          reward: outcome.reward,
          coins: get().coins - coinsAntes,
        },
      });
    },

    useHintOnChallenge: () => {
      const state = get();
      const challenge = state.activeChallenge;
      if (!challenge) return;

      const candidatas = challenge.options.filter(
        // A resposta certa nunca some: a dica reduz a duvida, nao entrega o
        // resultado nem pode deixar a crianca sem o que acertar.
        (option) => option !== challenge.answer && !state.hiddenOptions.includes(option),
      );
      // Sobrando uma so alternativa errada, apagar deixaria a resposta obvia e
      // a dica compraria o acerto em vez de ajudar a pensar.
      if (candidatas.length <= 1) return;
      if (!state.useHint()) return;

      set({ hiddenOptions: [...state.hiddenOptions, candidatas[0]] });
    },

    cancelChallenge: () => set({ activeChallenge: null, hiddenOptions: [] }),

    clearFeedback: () => set({ feedback: null }),
  };
};
