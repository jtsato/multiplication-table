import { useCallback, useMemo, useRef, useState } from 'react';
import { selectFacts } from '../domain/adaptive';
import { buildQuestion, factKey, optionCountForTable } from '../domain/questions';
import { defaultRng } from '../domain/random';
import { unlockedTables } from '../domain/progression';
import { audioService } from '../audio/audioService';
import { useGame } from './GameProvider';
import type { MissionDef } from '../domain/world';
import type { Question } from '../domain/types';

export type Feedback = 'none' | 'correct' | 'wrong';

export interface MissionSession {
  question: Question | null;
  questionNumber: number;
  total: number;
  /** Avanço da construção, 0..1. */
  progress: number;
  feedback: Feedback;
  showHint: boolean;
  finished: boolean;
  correctCount: number;
  wrongCount: number;
  /** Muda a cada bloco colocado, para animar a cena. */
  pulseKey: number;
  chosen: number | null;
  answer: (value: number) => void;
  dismissFeedback: () => void;
}

/**
 * Um "queue" de fatos é sorteado uma única vez ao entrar na missão, usando as
 * estatísticas do momento. Isso mantém a sessão previsível para a criança e
 * ainda assim adaptada ao seu histórico.
 */
export function useMission(table: number, mission: MissionDef): MissionSession {
  const { state, registerAnswer } = useGame();
  const statsRef = useRef(state.statistics);
  const progressRef = useRef(state.progress);

  const questions = useMemo(() => {
    const facts = selectFacts(
      {
        table,
        stats: statsRef.current,
        unlockedTables: unlockedTables(progressRef.current),
      },
      mission.questionCount,
      defaultRng,
    );
    const optionCount = optionCountForTable(table);
    return facts.map((fact) => buildQuestion(fact, optionCount, defaultRng));
  }, [table, mission.questionCount]);

  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>('none');
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const missedCurrent = useRef(false);

  const total = questions.length;
  const finished = index >= total;
  const question = finished ? null : (questions[index] as Question);

  const answer = useCallback(
    (value: number) => {
      if (!question || feedback !== 'none') return;
      audioService.unlock();
      const isCorrect = value === question.answer;
      setChosen(value);
      registerAnswer(question.fact, isCorrect);

      if (isCorrect) {
        // Só conta como acerto da missão quem acertou sem errar antes.
        if (!missedCurrent.current) setCorrectCount((c) => c + 1);
        setFeedback('correct');
        setShowHint(false);
        setPulseKey((k) => k + 1);
        audioService.play('place');
      } else {
        missedCurrent.current = true;
        setWrongCount((c) => c + 1);
        setFeedback('wrong');
        setShowHint(true);
        audioService.play('wrong');
      }
    },
    [question, feedback, registerAnswer],
  );

  const dismissFeedback = useCallback(() => {
    setChosen(null);
    if (feedback === 'correct') {
      missedCurrent.current = false;
      setShowHint(false);
      setIndex((i) => i + 1);
    }
    setFeedback('none');
  }, [feedback]);

  const placed = index + (feedback === 'correct' ? 1 : 0);

  return {
    question,
    questionNumber: Math.min(index + 1, total),
    total,
    progress: total === 0 ? 1 : Math.min(1, placed / total),
    feedback,
    showHint,
    finished,
    correctCount,
    wrongCount,
    pulseKey,
    chosen,
    answer,
    dismissFeedback,
  };
}

/** Chave estável do fato atual (útil para depuração e testes de UI). */
export function currentFactKey(session: MissionSession): string | null {
  return session.question ? factKey(session.question.fact.a, session.question.fact.b) : null;
}
