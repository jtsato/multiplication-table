import { useState } from 'react';
import { SUPPORTED_LOCALES, type GameState, type Locale } from '../domain/types';
import { localeMeta } from '../i18n/translate';
import { useTranslation } from '../i18n/I18nProvider';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ScreenLayout } from '../ui/ScreenLayout';
import { ToggleRow } from '../ui/ToggleRow';

interface SettingsScreenProps {
  state: GameState;
  storageAvailable: boolean;
  onBack: () => void;
  onLocaleChange: (locale: Locale) => void;
  onMusicChange: (enabled: boolean) => void;
  onSoundChange: (enabled: boolean) => void;
  onMotionChange: (enabled: boolean) => void;
  onReset: () => void;
}

/** Configuracoes: idioma, audio, animacoes e reset de progresso. */
export function SettingsScreen({
  state,
  storageAvailable,
  onBack,
  onLocaleChange,
  onMusicChange,
  onSoundChange,
  onMotionChange,
  onReset,
}: SettingsScreenProps) {
  const { t } = useTranslation();
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <ScreenLayout
      title={t('settings.title')}
      onBack={onBack}
      backLabel={t('common.back')}
      className="settings"
    >
      {!storageAvailable && <p className="settings__warning">{t('settings.storageWarning')}</p>}

      <section className="settings__section">
        <h2 className="settings__section-title">{t('settings.language')}</h2>
        <div className="settings__languages">
          {SUPPORTED_LOCALES.map((locale) => {
            const meta = localeMeta(locale);
            const selected = state.settings.locale === locale;
            return (
              <Button
                key={locale}
                variant={selected ? 'primary' : 'secondary'}
                size="lg"
                icon={meta.flag}
                aria-pressed={selected}
                onClick={() => onLocaleChange(locale)}
              >
                {meta.name}
              </Button>
            );
          })}
        </div>
      </section>

      <section className="settings__section">
        <ToggleRow
          label={t('settings.music')}
          icon="🎵"
          checked={state.settings.musicEnabled}
          onChange={onMusicChange}
          onLabel={t('settings.on')}
          offLabel={t('settings.off')}
        />
        <ToggleRow
          label={t('settings.sound')}
          icon="🔊"
          checked={state.settings.soundEffectsEnabled}
          onChange={onSoundChange}
          onLabel={t('settings.on')}
          offLabel={t('settings.off')}
        />
        <ToggleRow
          label={t('settings.motion')}
          icon="🍃"
          checked={state.settings.reducedMotion}
          onChange={onMotionChange}
          onLabel={t('settings.on')}
          offLabel={t('settings.off')}
        />
      </section>

      <section className="settings__section settings__section--danger">
        <h2 className="settings__section-title">{t('settings.dangerZone')}</h2>
        <Button variant="danger" size="lg" icon="🗑️" onClick={() => setConfirmingReset(true)}>
          {t('settings.reset')}
        </Button>
      </section>

      <ConfirmDialog
        open={confirmingReset}
        tone="danger"
        title={t('settings.resetTitle')}
        message={t('settings.resetMessage')}
        confirmLabel={t('settings.resetConfirm')}
        cancelLabel={t('settings.resetCancel')}
        onConfirm={() => {
          setConfirmingReset(false);
          onReset();
        }}
        onCancel={() => setConfirmingReset(false)}
      />
    </ScreenLayout>
  );
}
