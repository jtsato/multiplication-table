import { useState } from 'react';
import type { Accessory, AvatarStyle, HairStyle, Locale, PlayerProfile } from '../domain/types';
import { useGame } from '../state/GameProvider';
import { useI18n } from '../i18n/useI18n';
import { Avatar } from '../components/Avatar';
import { audioService } from '../services/audioService';

const colors = [
  { value: '#ff5d8f', label: 'onboarding.colorPink' },
  { value: '#5b8cff', label: 'onboarding.colorBlue' },
  { value: '#55c77a', label: 'onboarding.colorGreen' },
  { value: '#ff9f43', label: 'onboarding.colorOrange' },
] as const;

export function OnboardingScreen({ onComplete }: { onComplete(): void }) {
  const { state, updateSettings, createPlayer } = useGame();
  const t = useI18n();
  const [step, setStep] = useState<'locale' | 'name' | 'look'>('locale');
  const [name, setName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('explorer');
  const [outfitColor, setOutfitColor] = useState<string>(colors[0].value);
  const [hairStyle, setHairStyle] = useState<HairStyle>('round');
  const [accessory, setAccessory] = useState<Accessory>('none');

  const chooseLocale = async (locale: Locale) => {
    await updateSettings({ locale });
    setStep('name');
  };
  const finish = async () => {
    const profile: PlayerProfile = {
      name: name.trim(),
      avatarStyle,
      outfitColor,
      hairStyle,
      accessory,
      createdAt: new Date().toISOString(),
    };
    audioService.setMusic(state.settings.musicEnabled);
    await createPlayer(profile);
    onComplete();
  };

  if (step === 'locale')
    return (
      <section className="onboarding-card">
        <div className="block-logo">
          <i />
          <i />
          <i />
          <i />
        </div>
        <h1>{t('onboarding.languageTitle')}</h1>
        <p>{t('onboarding.languageSubtitle')}</p>
        <div className="language-buttons">
          <button onClick={() => chooseLocale('pt-BR')}>
            <b>PT</b>
            {t('onboarding.portuguese')}
          </button>
          <button onClick={() => chooseLocale('en-US')}>
            <b>EN</b>
            {t('onboarding.english')}
          </button>
        </div>
      </section>
    );

  if (step === 'name')
    return (
      <section className="onboarding-card">
        <span className="step-pill">1 / 2</span>
        <h1>{t('onboarding.avatarTitle')}</h1>
        <p>{t('onboarding.avatarSubtitle')}</p>
        <div className="name-step">
          <Avatar
            style={avatarStyle}
            outfitColor={outfitColor}
            hairStyle={hairStyle}
            accessory={accessory}
          />
          <label>
            {t('onboarding.nameLabel')}
            <input
              autoFocus
              value={name}
              maxLength={18}
              placeholder={t('onboarding.namePlaceholder')}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && name.trim()) setStep('look');
              }}
            />
          </label>
        </div>
        <button className="primary-button" disabled={!name.trim()} onClick={() => setStep('look')}>
          {t('onboarding.continue')}
        </button>
      </section>
    );

  return (
    <section className="onboarding-card onboarding-card--wide">
      <span className="step-pill">2 / 2</span>
      <h1>{t('onboarding.lookTitle')}</h1>
      <div className="customizer">
        <div className="avatar-stage">
          <Avatar
            style={avatarStyle}
            outfitColor={outfitColor}
            hairStyle={hairStyle}
            accessory={accessory}
          />
        </div>
        <div className="customizer__options">
          <fieldset>
            <legend>{t('onboarding.avatarTitle')}</legend>
            <div className="segmented">
              <button
                className={avatarStyle === 'explorer' ? 'is-selected' : ''}
                aria-pressed={avatarStyle === 'explorer'}
                onClick={() => setAvatarStyle('explorer')}
              >
                {t('onboarding.explorer')}
              </button>
              <button
                className={avatarStyle === 'builder' ? 'is-selected' : ''}
                aria-pressed={avatarStyle === 'builder'}
                onClick={() => setAvatarStyle('builder')}
              >
                {t('onboarding.builder')}
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend>{t('onboarding.outfit')}</legend>
            <div className="swatches">
              {colors.map((color) => (
                <button
                  key={color.value}
                  className={outfitColor === color.value ? 'is-selected' : ''}
                  style={{ background: color.value }}
                  onClick={() => setOutfitColor(color.value)}
                  aria-label={t(color.label)}
                  aria-pressed={outfitColor === color.value}
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{t('onboarding.hair')}</legend>
            <div className="segmented">
              {(['round', 'spiky', 'curly'] as HairStyle[]).map((hair) => (
                <button
                  key={hair}
                  className={hairStyle === hair ? 'is-selected' : ''}
                  aria-pressed={hairStyle === hair}
                  onClick={() => setHairStyle(hair)}
                >
                  {t(
                    `onboarding.hair${hair[0].toUpperCase()}${hair.slice(1)}` as 'onboarding.hairRound',
                  )}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{t('onboarding.accessory')}</legend>
            <div className="segmented">
              {(['none', 'glasses', 'cap'] as Accessory[]).map((item) => (
                <button
                  key={item}
                  className={accessory === item ? 'is-selected' : ''}
                  aria-pressed={accessory === item}
                  onClick={() => setAccessory(item)}
                >
                  {t(`onboarding.${item}` as 'onboarding.none')}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
      <button className="primary-button" onClick={finish}>
        {t('onboarding.start')}
      </button>
      <span className="locale-note">{state.settings.locale}</span>
    </section>
  );
}
