import { interpolate } from '../../i18n';
import type { LocaleBundle } from '../../i18n';
import type { Challenge } from './math.logic';

/**
 * A frase do desafio, montada na hora de desenhar.
 *
 * Mora fora de `math.logic` porque **o enunciado e apresentacao, nao regra**. A
 * conta, a resposta e as alternativas sao as mesmas em qualquer idioma; o que
 * muda e como a frase se monta — e em portugues ela concorda em genero, em
 * ingles nao, e em chines o classificador vem antes do substantivo.
 *
 * Guardar a frase pronta dentro do `Challenge` faria o texto congelar no idioma
 * em que o desafio foi aberto, e obrigaria o store a conhecer traducao.
 */
export interface ChallengeText {
  /** Descreve o que esta em cena: "4 galhos com 2 gravetos cada". */
  prompt: string;
  /** A pergunta em destaque: "Quantos gravetos ao todo?". */
  question: string;
}

export function challengeText(challenge: Challenge, bundle: LocaleBundle): ChallengeText {
  const { group, item } = bundle.resources[challenge.kind];
  const { counted, howMany } = bundle.grammar;

  return {
    prompt: interpolate(bundle.strings.challengePrompt, {
      grupos: counted(challenge.groups, group),
      itens: counted(challenge.perGroup, item),
    }),
    question: howMany(item),
  };
}
