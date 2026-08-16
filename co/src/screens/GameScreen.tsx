import { useEffect, useRef, useState } from 'react';
import { BlockScene } from '../components/BlockScene';
import { QuestionPanel } from '../components/QuestionPanel';
import { getIsland } from '../content/islands';
import { generateQuestion, selectQuestionFact } from '../domain/questions';
import type { GameState, Question, TableNumber } from '../domain/types';
import { useI18n } from '../i18n/useI18n';
import { audioService } from '../services/audioService';
import { useGame } from '../state/GameProvider';

const TOTAL_QUESTIONS = 6;

export interface ResultSummary {
  table: TableNumber;
  correct: number;
  incorrect: number;
  state: GameState;
}

export function GameScreen({
  table,
  onLeave,
  onComplete,
}: {
  table: TableNumber;
  onLeave(): void;
  onComplete(result: ResultSummary): void;
}) {
  const { state, startSession, saveMissionProgress, answer, finishIsland } = useGame();
  const t = useI18n();
  const island = getIsland(table);
  const completedTables = Object.entries(state.progress.tables)
    .filter(([, progress]) => progress.status === 'completed')
    .map(([value]) => Number(value) as TableNumber)
    .filter((value) => value < table);
  const makeQuestion = (previous: string | null, questionIndex = 0): Question => {
    const fact = selectQuestionFact(
      table,
      state.progress.mastery,
      completedTables,
      questionIndex > 0 && (questionIndex + 1) % 3 === 0,
      previous,
    );
    return generateQuestion(fact.table, fact.factor);
  };
  const activeMission =
    state.progress.activeMission?.table === table ? state.progress.activeMission : null;
  const [question, setQuestion] = useState(
    () => activeMission?.currentQuestion ?? makeQuestion(null),
  );
  const [index, setIndex] = useState(activeMission?.completedSteps ?? 0);
  const [correct, setCorrect] = useState(activeMission?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(activeMission?.incorrect ?? 0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(
    activeMission?.feedback ?? null,
  );
  const startedTable = useRef<TableNumber | null>(null);
  useEffect(() => {
    if (startedTable.current === table) return;
    startedTable.current = table;
    void startSession(table, question);
  }, [question, startSession, table]);

  const choose = async (value: number) => {
    if (feedback === 'correct') return;
    const isCorrect = value === question.answer;
    await answer(question.left, question.right, isCorrect);
    audioService.play(isCorrect ? 'correct' : 'incorrect', state.settings.soundEffectsEnabled);
    if (isCorrect) {
      setCorrect((count) => count + 1);
      setFeedback('correct');
    } else {
      setIncorrect((count) => count + 1);
      setFeedback('incorrect');
    }
  };

  const next = async () => {
    if (index === TOTAL_QUESTIONS - 1) {
      const finished = await finishIsland(table, correct, incorrect);
      audioService.play('complete', state.settings.soundEffectsEnabled);
      onComplete({ table, correct, incorrect, state: finished });
      return;
    }
    const nextQuestion = makeQuestion(question.key, index + 1);
    await saveMissionProgress(table, index + 1, correct, incorrect, nextQuestion);
    setIndex((value) => value + 1);
    setQuestion(nextQuestion);
    setFeedback(null);
  };

  return (
    <section className="game-screen">
      <div className="game-topline">
        <button className="back-button back-button--light" onClick={onLeave}>
          ← {t('game.leave')}
        </button>
        <div className="mission-title">
          <span>{t('game.missionLabel')}</span>
          <strong>{t(`mission.${table}.title` as 'mission.2.title')}</strong>
        </div>
        <div className="question-count">
          {index + 1} / {TOTAL_QUESTIONS}
        </div>
      </div>
      <div className="game-layout">
        <div className="scene-panel">
          <BlockScene island={island} built={index + (feedback === 'correct' ? 1 : 0)} />
          <div className="build-progress">
            <span>
              {t('game.progress', {
                current: index + (feedback === 'correct' ? 1 : 0),
                total: TOTAL_QUESTIONS,
              })}
            </span>
            <div>
              <i
                style={{
                  width: `${((index + (feedback === 'correct' ? 1 : 0)) / TOTAL_QUESTIONS) * 100}%`,
                }}
              />
            </div>
          </div>
          {index === 0 && feedback === null && (
            <p className="tutorial-bubble">{t('game.tutorial')}</p>
          )}
        </div>
        <div className="play-panel">
          <div className="mission-brief">
            <span className="mission-icon" aria-hidden="true">
              ◆
            </span>
            <div>
              <h1>{t(`mission.${table}.title` as 'mission.2.title')}</h1>
              <p>{t(`mission.${table}.description` as 'mission.2.description')}</p>
            </div>
          </div>
          <QuestionPanel
            question={question}
            feedback={feedback}
            onAnswer={choose}
            onNext={next}
            final={index === TOTAL_QUESTIONS - 1}
          />
        </div>
      </div>
    </section>
  );
}
