import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { audioService } from '../audio/audioService';
import { getIsland } from '../domain/islands';
import type { MissionDefinition } from '../domain/missions';
import { missionsForTable } from '../domain/missions';
import { unlockedTables } from '../domain/progression';
import { systemRng } from '../domain/rng';
import type { GameState } from '../domain/types';
import {
  advance,
  buildProgress,
  createLevelState,
  currentQuestionNumber,
  retryQuestion,
  startQuestions,
  submitAnswer,
  type LevelContext,
  type LevelState,
} from '../game/levelSession';
import { useTranslation } from '../i18n/I18nProvider';
import { HintArray } from '../art/HintArray';
import { Mascot } from '../art/Mascot';
import { SceneView } from '../art/SceneView';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProgressBar } from '../ui/ProgressBar';

interface LevelScreenProps {
  state: GameState;
  mission: MissionDefinition;
  onAnswer: (factKey: string, wasCorrect: boolean) => void;
  onFinish: (level: LevelState) => void;
  onExit: () => void;
  /** Abre a tabuada da ilha; a fase e remontada ao voltar. */
  onStudy: () => void;
  onTutorialSeen: () => void;
}

/** Tempo que a comemoracao fica na tela antes da proxima pergunta. */
const CORRECT_PAUSE_MS = 950;
/** Tempo com a dica na tela antes de liberar nova tentativa. */
const WRONG_PAUSE_MS = 1500;

/** Papel picado do acerto: posicoes fixas, so a cor muda por ilha. */
const CONFETTI_PIECES = Array.from({ length: 12 }, (_, index) => ({
  left: (index * 8.5 + 4) % 100,
  delay: (index % 5) * 0.05,
  drift: index % 2 === 0 ? -(20 + (index % 3) * 10) : 20 + (index % 3) * 10,
}));

/**
 * A fase.
 *
 * A tela nao sabe nada de regras: ela pinta o `LevelState` e chama as funcoes
 * puras de `levelSession`. Toda resposta certa coloca blocos no cenario -
 * a matematica muda o mundo, nao um contador.
 */
export function LevelScreen({
  state,
  mission,
  onAnswer,
  onFinish,
  onExit,
  onStudy,
  onTutorialSeen,
}: LevelScreenProps) {
  const { t, tVariant } = useTranslation();
  const island = getIsland(mission.table);
  const reducedMotion = state.settings.reducedMotion;

  const context = useMemo<LevelContext>(
    () => ({
      mission,
      optionCount: island.optionCount,
      stats: state.statistics.facts,
      unlockedTables: unlockedTables(state.progress),
    }),
    [mission, island.optionCount, state.statistics.facts, state.progress],
  );

  // O contexto muda a cada resposta (as estatisticas mudam), mas os
  // temporizadores precisam sempre da versao mais recente.
  //
  // A copia acontece em efeito, e nao durante o render: escrever num ref no
  // corpo do componente quebra a pureza que o React exige (e o modo estrito
  // acusa). Efeito basta porque ninguem le este ref durante o render — so os
  // callbacks de clique e os `setTimeout`, todos depois do commit.
  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const [level, setLevel] = useState<LevelState>(() => createLevelState(context));
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const progress = buildProgress(level);
  const totalMissions = missionsForTable(mission.table).length;

  const begin = useCallback(() => {
    onTutorialSeen();
    setLevel((current) => startQuestions(current, systemRng, contextRef.current));
  }, [onTutorialSeen]);

  const answer = useCallback(
    (optionIndex: number) => {
      if (level.phase !== 'question' || !level.question) {
        return;
      }

      const outcome = submitAnswer(level, optionIndex, systemRng);
      setLevel(outcome.state);
      onAnswer(outcome.key, outcome.wasCorrect);

      if (outcome.wasCorrect) {
        audioService.play('correct');
        audioService.play('build');
        timerRef.current = setTimeout(() => {
          setLevel((current) => advance(current, systemRng, contextRef.current));
        }, CORRECT_PAUSE_MS);
      } else {
        audioService.play('wrong');
        timerRef.current = setTimeout(() => {
          setLevel((current) => retryQuestion(current));
        }, WRONG_PAUSE_MS);
      }
    },
    [level, onAnswer],
  );

  // Encerrou a construcao: avisa quem cuida do progresso.
  const finishedRef = useRef(false);
  useEffect(() => {
    if (level.phase === 'finished' && !finishedRef.current) {
      finishedRef.current = true;
      audioService.play('complete');
      onFinish(level);
    }
  }, [level, onFinish]);

  // Teclado: 1..4 respondem, util para quem joga sem toque.
  useEffect(() => {
    if (level.phase !== 'question' || !level.question) {
      return;
    }
    const options = level.question.options;
    const onKeyDown = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < options.length) {
        answer(index);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [level.phase, level.question, answer]);

  const question = level.question;
  const showingFeedback = level.phase === 'correct' || level.phase === 'wrong';

  return (
    <div className="level" style={{ background: island.palette.skyBottom }}>
      <header className="level__bar">
        <Button variant="ghost" size="sm" icon="✕" onClick={() => setShowQuitDialog(true)}>
          {t('game.quit')}
        </Button>

        <div className="level__meta">
          <span className="level__mission">
            {t(`missions.${mission.scene}.title`)}
            {mission.isFinalChallenge && (
              <span className="level__final-badge">{t('missions.finalBadge')}</span>
            )}
          </span>
          <span className="level__counter">
            {t('missions.counter', { order: mission.order, total: totalMissions })}
          </span>
        </div>

        <div className="level__progress">
          <ProgressBar
            value={progress}
            label={t('game.blocks', { placed: level.resolved, total: level.totalQuestions })}
            caption={`${level.resolved}/${level.totalQuestions}`}
            tone={progress >= 1 ? 'success' : 'default'}
          />
        </div>
      </header>

      <div className="level__stage">
        <SceneView
          scene={mission.scene}
          palette={island.palette}
          decor={island.decor}
          progress={progress}
          avatar={state.player.avatar}
          mascotId={state.player.mascotId}
          celebrating={level.phase === 'correct'}
          reducedMotion={reducedMotion}
          ariaLabel={t('a11y.buildProgress', { percent: Math.round(progress * 100) })}
        />

        {level.phase === 'correct' && !reducedMotion && (
          <div className="level__confetti" aria-hidden="true">
            {CONFETTI_PIECES.map((piece, index) => (
              <span
                key={index}
                className="confetti confetti--burst"
                style={
                  {
                    left: `${piece.left}%`,
                    background: [
                      island.palette.accent,
                      island.palette.accentSoft,
                      '#ffd23f',
                      '#ffffff',
                    ][index % 4],
                    animationDelay: `${piece.delay}s`,
                    '--confetti-drift': `${piece.drift}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      {level.phase === 'briefing' && (
        <div className="level__panel level__panel--briefing">
          <Mascot palette={island.palette} size={80} mood="happy" />
          <div className="level__brief">
            <h2 className="level__brief-title">{t(`missions.${mission.scene}.title`)}</h2>
            <p className="level__brief-text">{t(`missions.${mission.scene}.brief`)}</p>

            {!state.player.tutorialSeen && (
              <ol className="level__tutorial">
                <li>{t('game.tutorial.step1')}</li>
                <li>{t('game.tutorial.step2')}</li>
                <li>{t('game.tutorial.step3')}</li>
              </ol>
            )}
          </div>
          {/* Duas saidas do briefing: estudar a tabuada da ilha ou comecar.
              O verde continua sendo so o que avanca. */}
          <div className="level__brief-actions">
            <Button variant="secondary" size="lg" icon="📖" onClick={onStudy}>
              {t('game.study')}
            </Button>
            <Button size="lg" onClick={begin}>
              {t('game.startMission')}
            </Button>
          </div>
        </div>
      )}

      {question && level.phase !== 'briefing' && (
        <div className="level__panel">
          <div className="level__question-row">
            <p className="level__counter-small">
              {t('game.questionCounter', {
                current: currentQuestionNumber(level),
                total: level.totalQuestions,
              })}
            </p>
            <h2 className="level__question">
              {t('game.question', { a: question.fact.a, b: question.fact.b })}
            </h2>
          </div>

          <div className="level__options">
            {question.options.map((option, index) => {
              const isChosen = level.selectedOption === index;
              const isCorrectOption = index === question.correctIndex;
              const classes = [
                'option',
                showingFeedback && isChosen && level.phase === 'correct' ? 'option--correct' : '',
                showingFeedback && isChosen && level.phase === 'wrong' ? 'option--wrong' : '',
                level.revealAnswer && isCorrectOption ? 'option--revealed' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={`${question.key}-${index}`}
                  type="button"
                  className={classes}
                  disabled={level.phase !== 'question'}
                  aria-label={t('a11y.answerOption', { value: option })}
                  onClick={() => answer(index)}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="level__feedback" aria-live="polite">
            {level.phase === 'correct' && (
              <p className="level__feedback-text level__feedback-text--correct">
                {tVariant('feedback.correct', level.feedbackVariant)}
              </p>
            )}
            {level.phase === 'wrong' && (
              <p className="level__feedback-text level__feedback-text--wrong">
                {tVariant('feedback.wrong', level.feedbackVariant)}
              </p>
            )}
            {level.revealAnswer && level.phase !== 'correct' && (
              <p className="level__reveal">{t('game.showAnswer', { answer: question.answer })}</p>
            )}
          </div>

          {level.showHint && (
            <HintArray a={question.fact.a} b={question.fact.b} color={island.palette.block} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={showQuitDialog}
        title={t('game.quitTitle')}
        message={t('game.quitMessage')}
        confirmLabel={t('game.quitConfirm')}
        cancelLabel={t('game.quitCancel')}
        onConfirm={() => {
          clearTimer();
          setShowQuitDialog(false);
          onExit();
        }}
        onCancel={() => setShowQuitDialog(false)}
      />
    </div>
  );
}
