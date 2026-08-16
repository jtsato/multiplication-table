import { useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../app/store';
import { useGameAction } from '../../shared/input';
import type { Vec3 } from '../../shared/vec';
import './challenge.css';

/** Quanto tempo o resultado fica na tela antes do painel sumir. */
const FEEDBACK_MS = 1600;

/**
 * Painel do desafio, ancorado no proprio recurso.
 *
 * Decisoes de renderizacao:
 *
 * - `Html` do drei em vez de texto em textura: o texto fica nitido em qualquer
 *   distancia, e selecionavel por leitor de tela e responde a teclado nativo.
 * - `distanceFactor` faz o painel encolher com a distancia, entao ele pertence a
 *   cena em vez de flutuar como HUD.
 * - **Sem `occlude`**: a oclusao por raycast do drei se comporta de forma
 *   instavel com paineis interativos, e nao havia navegador neste ambiente para
 *   validar visualmente. Um painel que some atras de uma arvore seria pior que
 *   um painel sempre visivel.
 * - O jogo **nao pausa**. E a decisao central da fatia: com o mundo rodando, a
 *   conta e uma ferramenta usada sob pressao, nao uma prova com o tempo parado.
 */
export function ChallengePanel() {
  const challenge = useGameStore((state) => state.activeChallenge);
  const feedback = useGameStore((state) => state.feedback);
  const nodes = useGameStore((state) => state.nodes);
  const structures = useGameStore((state) => state.structures);
  const answerChallenge = useGameStore((state) => state.answerChallenge);
  const clearFeedback = useGameStore((state) => state.clearFeedback);

  /**
   * Ponto do mundo onde o painel fica preso.
   *
   * Procurado entre nos e construcoes porque o desafio serve as duas coisas —
   * colher um recurso e abastecer a fogueira. Os nos sao consultados inteiros, e
   * nao so os disponiveis: o feedback aparece logo depois da colheita, quando o
   * no ja esta esgotado mas o painel ainda precisa de uma ancora.
   */
  const targetId = challenge?.targetId ?? feedback?.targetId ?? null;
  const anchor: Vec3 | null = targetId
    ? (nodes.find((node) => node.id === targetId)?.position ??
      structures.find((structure) => structure.id === targetId)?.position ??
      null)
    : null;

  // Le o desafio do store na hora da tecla, e nao da closure do render, para o
  // atalho nunca responder um desafio que ja foi trocado ou cancelado.
  const answerByIndex = (index: number) => {
    const option = useGameStore.getState().activeChallenge?.options[index];
    if (option !== undefined) answerChallenge(option);
  };

  // Atalhos 1-2-3 no teclado. No celular, os proprios botoes do painel servem.
  useGameAction('responder-1', () => answerByIndex(0));
  useGameAction('responder-2', () => answerByIndex(1));
  useGameAction('responder-3', () => answerByIndex(2));

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(clearFeedback, FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback, clearFeedback]);

  if ((!challenge && !feedback) || !anchor) return null;

  return (
    <Html position={[anchor.x, anchor.y + 3.1, anchor.z]} center distanceFactor={11}>
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
                // Sem isto o nome acessivel do botao concatena o numero do
                // atalho com a alternativa ("3" + "20" = "320"), e o leitor de
                // tela anuncia um numero que nao existe na tela.
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
              {feedback.purpose === 'abastecer'
                ? feedback.correct
                  ? 'Fogueira cheia!'
                  : 'Um pouco de lenha'
                : `+${feedback.reward}`}
            </p>
          </div>
        )
      )}
    </Html>
  );
}
