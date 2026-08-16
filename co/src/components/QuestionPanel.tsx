import type { Question } from '../domain/types';
import { useI18n } from '../i18n/useI18n';
import { VisualHint } from './VisualHint';

export function QuestionPanel({
  question,
  feedback,
  onAnswer,
  onNext,
  final,
}: {
  question: Question;
  feedback: 'correct' | 'incorrect' | null;
  onAnswer(value: number): void;
  onNext(): void;
  final: boolean;
}) {
  const t = useI18n();
  return (
    <section className="question-card" aria-live="polite">
      <p className="eyebrow">{t('game.choose')}</p>
      <h2>{t('game.question', { left: question.left, right: question.right })}</h2>
      <div className="answer-grid">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => onAnswer(option)}
            disabled={feedback === 'correct'}
            className={
              feedback === 'correct' && option === question.answer ? 'answer--correct' : ''
            }
          >
            {option}
          </button>
        ))}
      </div>
      {feedback === 'incorrect' && (
        <>
          <p className="feedback feedback--try">{t('game.incorrect')}</p>
          <VisualHint groups={question.left} size={question.right} />
        </>
      )}
      {feedback === 'correct' && (
        <div className="feedback-row">
          <p className="feedback feedback--correct">{t('game.correct')}</p>
          <button className="primary-button primary-button--small" onClick={onNext}>
            {t(final ? 'game.finish' : 'game.next')}
          </button>
        </div>
      )}
    </section>
  );
}
