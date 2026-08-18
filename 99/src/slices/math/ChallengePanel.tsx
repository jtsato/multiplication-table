import { useEffect } from 'react';
import { useGameStore } from '../../app/store';
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

  return (
    <div className="challenge-overlay">
      {challenge ? (
        <div className="challenge">
          <p className="challenge__prompt">{challenge.prompt}</p>
          <p className="challenge__question">{challenge.question}</p>

          <div className="challenge__options">
            {challenge.options.map((option, index) => (
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
            ))}
          </div>
        </div>
      ) : (
        feedback && (
          <div
            className={`challenge challenge--feedback challenge--${
              feedback.correct ? 'correct' : 'wrong'
            }`}
          >
            <p className="challenge__result">{feedback.correct ? 'Isso!' : 'Quase!'}</p>
            {!feedback.correct && (
              <p className="challenge__answer">A resposta era {feedback.answer}</p>
            )}
            <p className="challenge__reward">
              {/* A conta na fogueira rende duas coisas, e o feedback diz as
                  duas: sem isso a criança não liga a resposta certa à luz que
                  passou a carregar. */}
              {feedback.purpose === 'abastecer'
                ? feedback.correct
                  ? 'Fogueira cheia e lanterna acesa!'
                  : 'Um pouco de lenha e de luz'
                : `+${feedback.reward}`}
            </p>
          </div>
        )
      )}
    </div>
  );
}
