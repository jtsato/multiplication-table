import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameProvider';
import { useI18n } from '../i18n/useI18n';
import { audioService } from '../services/audioService';

export function SettingsScreen({ onBack, onReset }: { onBack(): void; onReset(): void }) {
  const { state, updateSettings, resetProgress } = useGame();
  const t = useI18n();
  const [confirming, setConfirming] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const resetOpenerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!confirming || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const controls = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button'));
    controls[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirming(false);
        return;
      }
      if (event.key !== 'Tab' || controls.length === 0) return;
      const first = controls[0];
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      resetOpenerRef.current?.focus();
    };
  }, [confirming]);
  const reset = async () => {
    await resetProgress();
    onReset();
  };
  return (
    <section className="screen-card auxiliary-screen">
      <div className="screen-heading">
        <button className="back-button" onClick={onBack}>
          ← {t('nav.back')}
        </button>
        <div>
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
      </div>
      <div className="settings-list">
        <article>
          <h2>{t('settings.language')}</h2>
          <div className="segmented">
            <button
              className={state.settings.locale === 'pt-BR' ? 'is-selected' : ''}
              aria-pressed={state.settings.locale === 'pt-BR'}
              onClick={() => updateSettings({ locale: 'pt-BR' })}
            >
              PT-BR
            </button>
            <button
              className={state.settings.locale === 'en-US' ? 'is-selected' : ''}
              aria-pressed={state.settings.locale === 'en-US'}
              onClick={() => updateSettings({ locale: 'en-US' })}
            >
              EN-US
            </button>
          </div>
        </article>
        <article>
          <h2>{t('settings.audio')}</h2>
          <label>
            <span>{t('settings.music')}</span>
            <button
              role="switch"
              aria-checked={state.settings.musicEnabled}
              className="toggle"
              onClick={() => {
                const enabled = !state.settings.musicEnabled;
                audioService.setMusic(enabled);
                void updateSettings({ musicEnabled: enabled });
              }}
            >
              <i />
              {t(state.settings.musicEnabled ? 'settings.on' : 'settings.off')}
            </button>
          </label>
          <label>
            <span>{t('settings.effects')}</span>
            <button
              role="switch"
              aria-checked={state.settings.soundEffectsEnabled}
              className="toggle"
              onClick={() =>
                updateSettings({ soundEffectsEnabled: !state.settings.soundEffectsEnabled })
              }
            >
              <i />
              {t(state.settings.soundEffectsEnabled ? 'settings.on' : 'settings.off')}
            </button>
          </label>
        </article>
        <article className="danger-zone">
          <h2>{t('settings.resetTitle')}</h2>
          <p>{t('settings.resetDescription')}</p>
          <button
            className="danger-button"
            onClick={(event) => {
              resetOpenerRef.current = event.currentTarget;
              setConfirming(true);
            }}
          >
            {t('settings.reset')}
          </button>
        </article>
      </div>
      {confirming && (
        <div className="modal-backdrop" role="presentation">
          <div
            ref={dialogRef}
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <span>!</span>
            <h2 id="confirm-title">{t('settings.confirmTitle')}</h2>
            <p>{t('settings.confirmDescription')}</p>
            <div>
              <button className="secondary-button" onClick={() => setConfirming(false)}>
                {t('settings.cancel')}
              </button>
              <button className="danger-button" onClick={reset}>
                {t('settings.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
