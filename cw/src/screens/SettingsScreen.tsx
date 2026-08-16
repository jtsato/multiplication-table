import { useState } from 'react';
import { BlockButton } from '../components/BlockButton';
import { Modal } from '../components/Modal';
import { Screen } from '../components/Screen';
import { useI18n } from '../i18n/I18nProvider';
import { useGame } from '../state/GameProvider';
import { SUPPORTED_LOCALES } from '../persistence/schema';
import { factsInDifficulty } from '../domain/adaptive';
import type { Locale } from '../domain/types';

const LOCALE_LABELS: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English (US)',
};

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { state, updateSettings, resetProgress } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const hardFacts = factsInDifficulty(state.statistics).slice(0, 6);

  const toggle = (key: 'musicEnabled' | 'soundEffectsEnabled' | 'reducedMotion', label: string) => (
    <div className="setting-row" key={key}>
      <span>{label}</span>
      <BlockButton
        variant={state.settings[key] ? 'primary' : 'secondary'}
        role="switch"
        aria-checked={state.settings[key]}
        onClick={() => updateSettings({ [key]: !state.settings[key] })}
      >
        {state.settings[key] ? t('settings.on') : t('settings.off')}
      </BlockButton>
    </div>
  );

  return (
    <Screen title={t('settings.title')} onBack={onBack} backLabel={t('common.back')}>
      <div className="settings">
        <section className="setting-block">
          <h2>{t('settings.language')}</h2>
          <div className="setting-row">
            {SUPPORTED_LOCALES.map((locale) => (
              <BlockButton
                key={locale}
                variant={state.settings.locale === locale ? 'primary' : 'secondary'}
                aria-pressed={state.settings.locale === locale}
                onClick={() => updateSettings({ locale })}
              >
                {LOCALE_LABELS[locale]}
              </BlockButton>
            ))}
          </div>
        </section>

        <section className="setting-block">
          {toggle('musicEnabled', t('settings.music'))}
          {toggle('soundEffectsEnabled', t('settings.sound'))}
          {toggle('reducedMotion', t('settings.motion'))}
        </section>

        <section className="setting-block">
          <h2>{t('settings.statistics')}</h2>
          <dl className="stats-grid">
            <div>
              <dt>{t('settings.totalQuestions')}</dt>
              <dd>{state.statistics.totalQuestions}</dd>
            </div>
            <div>
              <dt>{t('settings.totalCorrect')}</dt>
              <dd>{state.statistics.totalCorrect}</dd>
            </div>
            <div>
              <dt>{t('settings.bestStreak')}</dt>
              <dd>{state.statistics.bestStreak}</dd>
            </div>
          </dl>
          <h3>{t('settings.practice')}</h3>
          {hardFacts.length === 0 ? (
            <p>{t('settings.practiceEmpty')}</p>
          ) : (
            <ul className="fact-chips">
              {hardFacts.map((fact) => (
                <li key={`${fact.a}x${fact.b}`}>
                  {fact.a} × {fact.b}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="setting-block">
          <BlockButton variant="danger" size="lg" onClick={() => setConfirmReset(true)}>
            {t('settings.reset')}
          </BlockButton>
        </section>
      </div>

      {confirmReset && (
        <Modal
          title={t('settings.resetTitle')}
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <BlockButton variant="secondary" onClick={() => setConfirmReset(false)}>
                {t('common.cancel')}
              </BlockButton>
              <BlockButton
                variant="danger"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  onBack();
                }}
              >
                {t('settings.resetConfirm')}
              </BlockButton>
            </>
          }
        >
          <p>{t('settings.resetBody')}</p>
        </Modal>
      )}
    </Screen>
  );
}
