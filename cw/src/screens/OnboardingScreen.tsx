import { useState } from 'react';
import { BlockButton } from '../components/BlockButton';
import { SwatchPicker } from '../components/SwatchPicker';
import { AvatarPreview } from '../render/AvatarPreview';
import { Mascot } from '../render/Mascot';
import { useI18n } from '../i18n/I18nProvider';
import { useGame } from '../state/GameProvider';
import {
  ACCESSORY_LABEL_KEYS,
  ACCESSORY_OPTIONS,
  HAIR_OPTIONS,
  OUTFIT_OPTIONS,
  SKIN_OPTIONS,
  createDefaultAvatar,
  type AccessoryId,
} from '../render/avatarSprite';
import { SUPPORTED_LOCALES } from '../persistence/schema';
import type { AvatarBase, Locale } from '../domain/types';

interface OnboardingScreenProps {
  onDone: () => void;
}

const LOCALE_LABELS: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English (US)',
};

/** Primeiro acesso: idioma → personagem → customização → nome. */
export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { t } = useI18n();
  const { state, updateSettings, createPlayer } = useGame();
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState(createDefaultAvatar());
  const [name, setName] = useState('');

  const finish = () => {
    createPlayer({ name: name.trim(), avatar, createdAt: new Date().toISOString() });
    onDone();
  };

  return (
    <section className="onboarding">
      <div className="onboarding__mascot">
        <Mascot mood="cheer" size={72} />
        <p>{t('onboarding.welcome')}</p>
      </div>

      {step === 0 && (
        <div className="onboarding__step">
          <h1>{t('onboarding.languageTitle')}</h1>
          <div className="onboarding__choices">
            {SUPPORTED_LOCALES.map((locale) => (
              <BlockButton
                key={locale}
                variant={state.settings.locale === locale ? 'primary' : 'secondary'}
                size="lg"
                aria-pressed={state.settings.locale === locale}
                onClick={() => updateSettings({ locale })}
              >
                {LOCALE_LABELS[locale]}
              </BlockButton>
            ))}
          </div>
          <BlockButton variant="primary" size="lg" onClick={() => setStep(1)}>
            {t('common.next')}
          </BlockButton>
        </div>
      )}

      {step === 1 && (
        <div className="onboarding__step">
          <h1>{t('onboarding.characterTitle')}</h1>
          <div className="onboarding__bases">
            {(['sprout', 'pebble'] as AvatarBase[]).map((base) => (
              <button
                key={base}
                type="button"
                className={`base-card${avatar.base === base ? ' is-selected' : ''}`}
                aria-pressed={avatar.base === base}
                onClick={() => setAvatar({ ...avatar, base })}
              >
                <AvatarPreview avatar={{ ...avatar, base }} size={112} label={t(`character.base.${base}`)} />
                <span>{t(`character.base.${base}`)}</span>
              </button>
            ))}
          </div>
          <BlockButton variant="primary" size="lg" onClick={() => setStep(2)}>
            {t('common.next')}
          </BlockButton>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding__step">
          <h1>{t('onboarding.customizeTitle')}</h1>
          <div className="customizer">
            <AvatarPreview avatar={avatar} size={150} />
            <div className="customizer__controls">
              <SwatchPicker
                legend={t('character.skin')}
                options={SKIN_OPTIONS}
                value={avatar.skinId}
                onChange={(skinId) => setAvatar({ ...avatar, skinId })}
              />
              <SwatchPicker
                legend={t('character.hair')}
                options={HAIR_OPTIONS}
                value={avatar.hairId}
                onChange={(hairId) => setAvatar({ ...avatar, hairId })}
              />
              <SwatchPicker
                legend={t('character.outfit')}
                options={OUTFIT_OPTIONS}
                value={avatar.outfitId}
                onChange={(outfitId) => setAvatar({ ...avatar, outfitId })}
              />
              <fieldset className="swatches">
                <legend className="swatches__legend">{t('character.accessory')}</legend>
                <div className="swatches__row">
                  {ACCESSORY_OPTIONS.map((id: AccessoryId) => (
                    <BlockButton
                      key={id}
                      variant={avatar.accessoryId === id ? 'primary' : 'secondary'}
                      aria-pressed={avatar.accessoryId === id}
                      onClick={() => setAvatar({ ...avatar, accessoryId: id })}
                    >
                      {t(ACCESSORY_LABEL_KEYS[id])}
                    </BlockButton>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
          <BlockButton variant="primary" size="lg" onClick={() => setStep(3)}>
            {t('common.next')}
          </BlockButton>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding__step">
          <h1>{t('onboarding.nameTitle')}</h1>
          <AvatarPreview avatar={avatar} size={130} />
          <input
            className="text-input"
            value={name}
            maxLength={16}
            placeholder={t('onboarding.namePlaceholder')}
            aria-label={t('onboarding.nameTitle')}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="onboarding__choices">
            <BlockButton variant="secondary" size="lg" onClick={finish}>
              {t('onboarding.nameSkip')}
            </BlockButton>
            <BlockButton variant="primary" size="lg" onClick={finish}>
              {t('onboarding.confirm')}
            </BlockButton>
          </div>
        </div>
      )}
    </section>
  );
}
