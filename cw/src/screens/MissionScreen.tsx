import { useEffect, useMemo, useState } from 'react';
import { BlockButton } from '../components/BlockButton';
import { HintGrid } from '../components/HintGrid';
import { Modal } from '../components/Modal';
import { ProgressBar } from '../components/ProgressBar';
import { BlockScene } from '../render/BlockScene';
import { Mascot } from '../render/Mascot';
import { useI18n } from '../i18n/I18nProvider';
import { useGame } from '../state/GameProvider';
import { useMission } from '../state/useMission';
import { getIsland, getMission } from '../domain/world';
import { createDefaultAvatar } from '../render/avatarSprite';

interface MissionScreenProps {
  table: number;
  missionId: string;
  onFinish: (result: { correct: number; total: number }) => void;
  onQuit: () => void;
}

/** Tempo que o feedback fica na tela antes de seguir para a próxima pergunta. */
const CORRECT_DELAY = 900;

export function MissionScreen({ table, missionId, onFinish, onQuit }: MissionScreenProps) {
  const { t, tList } = useI18n();
  const { state, markTutorialSeen } = useGame();
  const island = getIsland(table);
  const mission = getMission(table, missionId);
  const session = useMission(table, mission);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [showBrief, setShowBrief] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(state.progress.tutorialSeen ? -1 : 0);

  const avatar = state.player?.avatar ?? createDefaultAvatar();
  const reducedMotion = state.settings.reducedMotion;

  const correctMessages = tList('play.correct');
  const wrongMessages = tList('play.wrong');
  const feedbackMessage = useMemo(() => {
    if (session.feedback === 'correct') {
      return correctMessages[session.questionNumber % correctMessages.length] ?? '';
    }
    if (session.feedback === 'wrong') {
      return wrongMessages[session.wrongCount % wrongMessages.length] ?? '';
    }
    return '';
  }, [session.feedback, session.questionNumber, session.wrongCount, correctMessages, wrongMessages]);

  // Acerto avança sozinho; erro espera a criança tocar em "tentar de novo".
  useEffect(() => {
    if (session.feedback !== 'correct') return;
    const timer = setTimeout(session.dismissFeedback, reducedMotion ? 400 : CORRECT_DELAY);
    return () => clearTimeout(timer);
  }, [session.feedback, session.dismissFeedback, reducedMotion]);

  useEffect(() => {
    if (session.finished) onFinish({ correct: session.correctCount, total: session.total });
  }, [session.finished, session.correctCount, session.total, onFinish]);

  // Suporte a teclado: 1..4 escolhem as alternativas.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!session.question || session.feedback !== 'none') return;
      const digit = Number.parseInt(event.key, 10);
      if (digit >= 1 && digit <= session.question.options.length) {
        session.answer(session.question.options[digit - 1] as number);
      }
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [session]);

  const finishTutorial = () => {
    setTutorialStep(-1);
    markTutorialSeen();
  };

  return (
    <section className="mission" style={{ ['--biome-accent' as string]: island.palette.accent }}>
      <header className="mission__bar">
        <BlockButton variant="ghost" onClick={() => setConfirmQuit(true)}>
          ‹ {t('play.leave')}
        </BlockButton>
        <div className="mission__meta">
          <span className="mission__title">{t(mission.titleKey)}</span>
          {mission.isFinal && <span className="tag tag--final">{t('missions.finalBadge')}</span>}
        </div>
        <ProgressBar
          value={session.questionNumber - (session.feedback === 'correct' ? 0 : 1)}
          total={session.total}
          label={t('play.progress', { current: session.questionNumber, total: session.total })}
        />
      </header>

      <div className="mission__stage">
        <BlockScene
          kind={mission.scene}
          palette={island.palette}
          avatar={avatar}
          progress={session.progress}
          reducedMotion={reducedMotion}
          pulseKey={session.pulseKey}
          label={`${t(island.nameKey)} — ${t(mission.titleKey)}`}
        />
        {feedbackMessage && (
          <p className={`mission__flash mission__flash--${session.feedback}`} role="status">
            {feedbackMessage}
          </p>
        )}
      </div>

      <div className="mission__panel">
        {session.question && (
          <>
            <p className="mission__question" aria-live="polite">
              {t('play.question', { a: session.question.fact.a, b: session.question.fact.b })}
            </p>
            <div className="mission__options">
              {session.question.options.map((option) => {
                const isChosen = session.chosen === option;
                const isAnswer = option === session.question?.answer;
                const state_ =
                  session.feedback === 'none'
                    ? 'idle'
                    : isAnswer && session.feedback === 'correct'
                      ? 'correct'
                      : isChosen
                        ? 'wrong'
                        : 'idle';
                return (
                  <BlockButton
                    key={option}
                    variant="answer"
                    size="xl"
                    state={state_}
                    disabled={session.feedback !== 'none'}
                    onClick={() => session.answer(option)}
                  >
                    {option}
                  </BlockButton>
                );
              })}
            </div>
            {session.showHint && (
              <>
                <HintGrid
                  a={session.question.fact.a}
                  b={session.question.fact.b}
                  title={t('play.hintTitle', {
                    a: session.question.fact.a,
                    b: session.question.fact.b,
                  })}
                  result={t('play.hintCount', {
                    a: session.question.fact.a,
                    b: session.question.fact.b,
                    answer: session.question.answer,
                  })}
                />
                <BlockButton variant="secondary" onClick={session.dismissFeedback}>
                  {t('play.tryAgain')}
                </BlockButton>
              </>
            )}
          </>
        )}
      </div>

      {showBrief && (
        <Modal
          title={t(mission.titleKey)}
          onClose={() => setShowBrief(false)}
          actions={
            <BlockButton variant="primary" size="lg" onClick={() => setShowBrief(false)}>
              {t('common.start')}
            </BlockButton>
          }
        >
          <div className="brief">
            <Mascot mood="think" size={84} />
            <p>{t(mission.briefKey)}</p>
          </div>
        </Modal>
      )}

      {!showBrief && tutorialStep >= 0 && (
        <div className="tutorial" role="dialog" aria-label={t('play.tutorial.step1')}>
          <Mascot mood="happy" size={56} />
          <p>{t(`play.tutorial.step${tutorialStep + 1}`)}</p>
          <BlockButton
            variant="primary"
            onClick={() => (tutorialStep >= 2 ? finishTutorial() : setTutorialStep(tutorialStep + 1))}
          >
            {tutorialStep >= 2 ? t('common.start') : t('common.next')}
          </BlockButton>
        </div>
      )}

      {confirmQuit && (
        <Modal
          title={t('play.leave')}
          onClose={() => setConfirmQuit(false)}
          actions={
            <>
              <BlockButton variant="secondary" onClick={() => setConfirmQuit(false)}>
                {t('common.cancel')}
              </BlockButton>
              <BlockButton variant="danger" onClick={onQuit}>
                {t('play.leave')}
              </BlockButton>
            </>
          }
        >
          <p>{t('play.leaveConfirm')}</p>
        </Modal>
      )}
    </section>
  );
}
