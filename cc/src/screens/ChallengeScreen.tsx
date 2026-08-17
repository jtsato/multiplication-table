import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audioService } from '../audio/audioService';
import {
  CHALLENGE_MISSION,
  CHALLENGE_OPTION_COUNT,
  formatDuration,
  selectChallengeFact,
} from '../domain/challenge';
import { getPalette } from '../domain/islands';
import { getMascotDefinition } from '../domain/mascots';
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
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProgressBar } from '../ui/ProgressBar';
import type { ChallengeCompletion } from '../state/GameProvider';

/**
 * Modo Desafio: a corrida de contas misturadas.
 *
 * Reaproveita a maquina de estados das fases inteira — muda so o sorteio
 * (injetado por `selectFact`) e o que envolve a pergunta: sem cenario de
 * construcao, com cronometro e com um placar no fim.
 *
 * O cronometro conta para cima e nunca acaba: ele existe para dar um recorde
 * a superar, nao para apressar a crianca. Errar continua sem punicao, igual
 * ao resto do jogo.
 */

/** Mesmos tempos das fases, para o ritmo nao mudar entre os modos. */
const CORRECT_PAUSE_MS = 950;
const WRONG_PAUSE_MS = 1500;

interface ChallengeScreenProps {
  state: GameState;
  onAnswer: (factKey: string, wasCorrect: boolean) => void;
  onFinish: (score: number, elapsedMs: number) => ChallengeCompletion;
  /** Nova corrida; remonta a tela pela chave, zerando a sessao. */
  onRestart: () => void;
  onExit: () => void;
}

export function ChallengeScreen({
  state,
  onAnswer,
  onFinish,
  onRestart,
  onExit,
}: ChallengeScreenProps) {
  const { t, tVariant } = useTranslation();
  // A Ilha Lendaria empresta as cores da ultima ilha do arquipelago.
  const palette = getPalette(10);
  // Quem acompanha aqui e o companheiro escolhido pela crianca, nao um
  // mascote generico — e a mesma presenca que fechou o arquipelago.
  const mascot = getMascotDefinition(state.player.mascotId);

  const context = useMemo<LevelContext>(
    () => ({
      mission: CHALLENGE_MISSION,
      optionCount: CHALLENGE_OPTION_COUNT,
      stats: state.statistics.facts,
      unlockedTables: [],
      selectFact: (rng, recentKeys) => selectChallengeFact(rng, state.statistics.facts, recentKeys),
    }),
    [state.statistics.facts],
  );

  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const [level, setLevel] = useState<LevelState>(() => createLevelState(context));
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [completion, setCompletion] = useState<ChallengeCompletion | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  // Cronometro: so corre durante as perguntas, e para no placar final.
  const running = startedAt !== null && level.phase !== 'finished';
  useEffect(() => {
    if (!running || startedAt === null) {
      return;
    }
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [running, startedAt]);

  const begin = useCallback(() => {
    setStartedAt(Date.now());
    setLevel((current) => startQuestions(current, systemRng, contextRef.current));
  }, []);

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

  // Corrida encerrada: registra o resultado uma unica vez.
  const finishedRef = useRef(false);
  useEffect(() => {
    if (level.phase !== 'finished' || finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    audioService.play('complete');
    const total = startedAt === null ? 0 : Date.now() - startedAt;
    setElapsedMs(total);
    setCompletion(onFinish(level.firstTryCorrect, total));
  }, [level, onFinish, startedAt]);

  // Teclado: 1..4 respondem, igual as fases.
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
  const progress = buildProgress(level);

  return (
    <div
      className="challenge"
      style={{ background: `linear-gradient(170deg, ${palette.skyTop}, ${palette.skyBottom})` }}
    >
      <header className="level__bar">
        <Button variant="ghost" size="sm" icon="✕" onClick={() => setShowQuitDialog(true)}>
          {t('challenge.quit')}
        </Button>

        <div className="level__meta">
          <span className="level__mission">{t('challenge.title')}</span>
          <span className="challenge__clock" aria-label={t('challenge.clockLabel')}>
            ⏱ {formatDuration(elapsedMs)}
          </span>
        </div>

        <div className="level__progress">
          <ProgressBar
            value={progress}
            label={t('challenge.progress', {
              resolved: level.resolved,
              total: level.totalQuestions,
            })}
            caption={`${level.resolved}/${level.totalQuestions}`}
            tone={progress >= 1 ? 'success' : 'default'}
          />
        </div>
      </header>

      {level.phase === 'briefing' && (
        <div className="challenge__panel challenge__panel--briefing">
          <Mascot palette={mascot.colors} kind={mascot.kind} size={88} mood="cheering" />
          <h1 className="challenge__heading">{t('challenge.briefingTitle')}</h1>
          <p className="challenge__text">
            {t('challenge.briefingText', { total: level.totalQuestions })}
          </p>
          <p className="challenge__note">{t('challenge.briefingNote')}</p>

          {state.challenge.runs > 0 && (
            <p className="challenge__record">
              {t('challenge.currentRecord', {
                score: state.challenge.bestScore,
                total: level.totalQuestions,
                time:
                  state.challenge.bestTimeMs === null
                    ? '—'
                    : formatDuration(state.challenge.bestTimeMs),
              })}
            </p>
          )}

          <Button size="lg" icon="⚔️" onClick={begin}>
            {t('challenge.start')}
          </Button>
        </div>
      )}

      {question && level.phase !== 'briefing' && level.phase !== 'finished' && (
        <div className="challenge__panel">
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
            <HintArray a={question.fact.a} b={question.fact.b} color={palette.block} />
          )}
        </div>
      )}

      {level.phase === 'finished' && (
        <div className="challenge__panel challenge__panel--result">
          <Mascot palette={mascot.colors} kind={mascot.kind} size={80} mood="cheering" />
          <h1 className="challenge__heading">
            {completion?.isNewRecord ? t('challenge.newRecord') : t('challenge.finished')}
          </h1>

          <dl className="challenge__scoreboard">
            <div className="challenge__score-item">
              <dt>{t('challenge.score')}</dt>
              <dd>
                {level.firstTryCorrect}
                <span className="challenge__score-of">/{level.totalQuestions}</span>
              </dd>
            </div>
            <div className="challenge__score-item">
              <dt>{t('challenge.time')}</dt>
              <dd>{formatDuration(elapsedMs)}</dd>
            </div>
            <div className="challenge__score-item">
              <dt>{t('challenge.best')}</dt>
              <dd>
                {completion?.record.bestScore ?? state.challenge.bestScore}
                <span className="challenge__score-of">/{level.totalQuestions}</span>
              </dd>
            </div>
          </dl>

          <p className="challenge__note">{t('challenge.resultNote')}</p>

          <div className="challenge__actions">
            <Button size="lg" icon="↺" onClick={onRestart}>
              {t('challenge.again')}
            </Button>
            <Button variant="secondary" size="lg" icon="🏠" onClick={onExit}>
              {t('challenge.back')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showQuitDialog}
        title={t('challenge.quitTitle')}
        message={t('challenge.quitMessage')}
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
