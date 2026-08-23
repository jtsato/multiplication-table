import { useEffect } from 'react';
import { useGameStore } from '../../app/store';
import { challengeText } from './challengeText';
import { interpolate } from '../../i18n';
import { useGameAction } from '../../shared/input';
import './challenge.css';

/** Quanto tempo o resultado fica na tela antes do painel sumir. */
const FEEDBACK_MS = 1600;

/**
 * Painel do desafio, centralizado sobre o jogo.
 *
 * O DOM sobre o canvas deixa o texto nítido, acessível e independente da
 * câmera ou da oclusão pelos objetos da cena. O jogo não pausa: a conta é uma
 * ferramenta usada sob pressão, não uma prova com o tempo parado.
 */
export function ChallengePanel() {
  const challenge = useGameStore((state) => state.activeChallenge);
  const feedback = useGameStore((state) => state.feedback);
  const answerChallenge = useGameStore((state) => state.answerChallenge);
  const clearFeedback = useGameStore((state) => state.clearFeedback);
  const bundle = useGameStore((state) => state.text);
  const t = bundle.strings;
  const hiddenOptions = useGameStore((state) => state.hiddenOptions);
  const hints = useGameStore((state) => state.hints);
  const useHintOnChallenge = useGameStore((state) => state.useHintOnChallenge);

  // Lê o desafio do store na hora da tecla, e não da closure do render, para o
  // atalho nunca responder um desafio que já foi trocado ou cancelado.
  const answerByIndex = (index: number) => {
    const option = useGameStore.getState().activeChallenge?.options[index];
    if (option !== undefined) answerChallenge(option);
  };

  // Atalhos 1-2-3 no teclado. No celular, os próprios botões do painel servem.
  useGameAction('responder-1', () => answerByIndex(0));
  useGameAction('responder-2', () => answerByIndex(1));
  useGameAction('responder-3', () => answerByIndex(2));

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(clearFeedback, FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback, clearFeedback]);

  if (!challenge && !feedback) return null;

  // O enunciado e montado aqui, e nao guardado no desafio: assim trocar de
  // idioma repinta a frase sem mexer na conta que esta aberta.
  const texto = challenge ? challengeText(challenge, bundle) : null;

  return (
    <div className="challenge-overlay">
      {challenge && texto ? (
        <div className="challenge">
          <p className="challenge__prompt">{texto.prompt}</p>
          <p className="challenge__question">{texto.question}</p>

          <div className="challenge__options">
            {challenge.options.map((option, index) =>
              hiddenOptions.includes(option) ? null : (
                <button
                  key={option}
                  type="button"
                  className="challenge__option"
                  aria-label={String(option)}
                  onClick={() => answerChallenge(option)}
                >
                  <span className="challenge__key" aria-hidden="true">
                    {index + 1}
                  </span>
                  {option}
                </button>
              ),
            )}
          </div>

          {/* A dica só aparece quando há alguma guardada. Comprar ajuda com
              moeda ganha em conta certa é uma troca honesta — e é o que tira o
              medo de errar sem tornar o erro gratuito. */}
          {hints > 0 && (
            <button type="button" className="challenge__hint" onClick={useHintOnChallenge}>
              {interpolate(t.useHint, { n: hints })}
            </button>
          )}
        </div>
      ) : (
        feedback && (
          <div
            className={`challenge challenge--feedback challenge--${
              feedback.correct ? 'correct' : 'wrong'
            }`}
          >
            <p className="challenge__result">{feedback.correct ? t.correct : t.wrong}</p>
            {!feedback.correct && (
              <p className="challenge__answer">
                {interpolate(t.answerWas, { n: feedback.answer })}
              </p>
            )}
            {!feedback.correct && (
              <p className="challenge__explanation">
                {interpolate(t.errorExplain, {
                  grupos: feedback.groups,
                  porGrupo: feedback.perGroup,
                  resposta: feedback.answer,
                })}
              </p>
            )}
            <p className="challenge__reward">
              {/* A conta na fogueira rende duas coisas, e o feedback diz as
                  duas: sem isso a criança não liga a resposta certa à luz que
                  passou a carregar. Alimentar rende amizade, e o painel diz isso
                  também. */}
              {feedback.purpose === 'abastecer'
                ? feedback.correct
                  ? t.fireFull
                  : t.fireSome
                : feedback.purpose === 'alimentar'
                  ? feedback.correct
                    ? t.feedFriend
                    : ''
                  : feedback.purpose === 'encomenda'
                    ? feedback.correct
                      ? t.orderDone
                      : ''
                    : feedback.purpose === 'pedagio'
                      ? feedback.correct
                        ? t.tollOpen
                        : ''
                      : feedback.purpose === 'construir'
                        ? feedback.correct
                          ? t.buildDone
                          : ''
                        : `+${feedback.reward}`}
            </p>
            {/* A moeda aparece separada do recurso porque são coisas diferentes:
                o recurso é o resultado da conta, a moeda é o prêmio por ter
                acertado. Juntá-las num número só apagaria essa distinção. */}
            <p className="challenge__coins">
              {feedback.coins > 0 ? `+${feedback.coins} ${t.coins}` : ' '}
            </p>
          </div>
        )
      )}
    </div>
  );
}
