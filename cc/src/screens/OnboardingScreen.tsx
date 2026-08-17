import { useState } from 'react';
import {
  ACCESSORIES,
  AVATAR_BASES,
  HAIR_STYLES,
  OUTFIT_COLORS,
  OUTFIT_COLORS_HEX,
  randomAvatar,
  SKIN_COLORS,
  SKIN_TONES,
} from '../domain/avatar';
import { DEFAULT_AVATAR, DEFAULT_MASCOT_ID } from '../domain/defaultState';
import { getMascotDefinition, MASCOT_IDS } from '../domain/mascots';
import { SUPPORTED_LOCALES, type AvatarConfig, type Locale, type MascotId } from '../domain/types';
import { localeMeta } from '../i18n/translate';
import { useTranslation } from '../i18n/I18nProvider';
import { Avatar } from '../art/Avatar';
import { Mascot } from '../art/Mascot';
import { Button } from '../ui/Button';
import { OptionPicker } from '../ui/OptionPicker';

interface OnboardingScreenProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onFinish: (avatar: AvatarConfig, mascotId: MascotId) => void;
  /** Modo edicao: entra pela escolha do personagem, sem escolher idioma. */
  initialAvatar?: AvatarConfig;
  initialMascotId?: MascotId;
  editing?: boolean;
  onCancel?: () => void;
}

type Step = 'language' | 'character' | 'customize';

/**
 * Primeiro acesso: idioma -> personagem -> customizacao -> mapa.
 * Tres passos curtos, cada um com uma pergunta so.
 */
export function OnboardingScreen({
  locale,
  onLocaleChange,
  onFinish,
  initialAvatar,
  initialMascotId,
  editing = false,
  onCancel,
}: OnboardingScreenProps) {
  const { t } = useTranslation();
  // Editar comeca em 'character', e nao em 'customize': trocar entre menino e
  // menina precisa estar ao alcance de quem ja criou o personagem, nao so de
  // quem esta abrindo o jogo pela primeira vez.
  const [step, setStep] = useState<Step>(editing ? 'character' : 'language');
  const [avatar, setAvatar] = useState<AvatarConfig>(initialAvatar ?? DEFAULT_AVATAR);
  const [mascotId, setMascotId] = useState<MascotId>(initialMascotId ?? DEFAULT_MASCOT_ID);

  const patch = (changes: Partial<AvatarConfig>) =>
    setAvatar((current) => ({ ...current, ...changes }));

  return (
    <div className="onboarding">
      <div className="onboarding__stage">
        <Avatar avatar={avatar} size={190} celebrating={step === 'customize'} />
      </div>

      <div className="onboarding__panel">
        {step === 'language' && (
          <>
            <h1 className="onboarding__title">{t('onboarding.languageTitle')}</h1>
            <p className="onboarding__subtitle">{t('onboarding.languageSubtitle')}</p>

            <div className="onboarding__languages">
              {SUPPORTED_LOCALES.map((option) => {
                const meta = localeMeta(option);
                return (
                  <Button
                    key={option}
                    variant={option === locale ? 'primary' : 'secondary'}
                    size="lg"
                    block
                    icon={meta.flag}
                    aria-pressed={option === locale}
                    onClick={() => onLocaleChange(option)}
                  >
                    {meta.name}
                  </Button>
                );
              })}
            </div>

            <Button size="lg" block onClick={() => setStep('character')}>
              {t('common.next')}
            </Button>
          </>
        )}

        {step === 'character' && (
          <>
            <h1 className="onboarding__title">{t('onboarding.characterTitle')}</h1>
            <p className="onboarding__subtitle">{t('onboarding.characterSubtitle')}</p>

            <div className="onboarding__bases">
              {AVATAR_BASES.map((base) => (
                <button
                  key={base}
                  type="button"
                  className={`base-card ${avatar.base === base ? 'base-card--selected' : ''}`}
                  aria-pressed={avatar.base === base}
                  onClick={() => patch({ base })}
                >
                  <Avatar avatar={{ ...avatar, base }} size={120} />
                  <span className="base-card__label">{t(`onboarding.base.${base}`)}</span>
                </button>
              ))}
            </div>

            <div className="onboarding__actions">
              {/* Voltar sempre recua um passo; no primeiro passo da edicao,
                  recuar e sair sem salvar. */}
              <Button
                variant="secondary"
                size="lg"
                onClick={editing && onCancel ? onCancel : () => setStep('language')}
              >
                {t('common.back')}
              </Button>
              <Button size="lg" onClick={() => setStep('customize')}>
                {t('common.next')}
              </Button>
            </div>
          </>
        )}

        {step === 'customize' && (
          <>
            <h1 className="onboarding__title">{t('onboarding.customizeTitle')}</h1>
            <p className="onboarding__subtitle">{t('onboarding.customizeSubtitle')}</p>

            <div className="onboarding__pickers">
              <OptionPicker
                legend={t('onboarding.skinLabel')}
                options={SKIN_TONES}
                value={avatar.skin}
                onChange={(skin) => patch({ skin })}
                labelFor={(option) => t(`onboarding.skin.${option}`)}
                renderSwatch={(option) => (
                  <span className="swatch" style={{ background: SKIN_COLORS[option] }} />
                )}
              />

              <OptionPicker
                legend={t('onboarding.hairLabel')}
                options={HAIR_STYLES}
                value={avatar.hair}
                onChange={(hair) => patch({ hair })}
                labelFor={(option) => t(`onboarding.hair.${option}`)}
              />

              <OptionPicker
                legend={t('onboarding.outfitLabel')}
                options={OUTFIT_COLORS}
                value={avatar.outfit}
                onChange={(outfit) => patch({ outfit })}
                labelFor={(option) => t(`onboarding.outfit.${option}`)}
                renderSwatch={(option) => (
                  <span className="swatch" style={{ background: OUTFIT_COLORS_HEX[option] }} />
                )}
              />

              <OptionPicker
                legend={t('onboarding.accessoryLabel')}
                options={ACCESSORIES}
                value={avatar.accessory}
                onChange={(accessory) => patch({ accessory })}
                labelFor={(option) => t(`onboarding.accessory.${option}`)}
              />

              <OptionPicker
                legend={t('onboarding.mascotLabel')}
                options={MASCOT_IDS}
                value={mascotId}
                onChange={setMascotId}
                labelFor={(option) => t(`onboarding.mascot.${option}`)}
                renderSwatch={(option) => {
                  const definition = getMascotDefinition(option);
                  // 32px cabe na pilula de 48px sem esticar a linha.
                  return <Mascot palette={definition.colors} kind={definition.kind} size={32} />;
                }}
              />
            </div>

            <div className="onboarding__actions">
              <Button
                variant="secondary"
                size="lg"
                icon="🎲"
                onClick={() => {
                  setAvatar(randomAvatar((max) => Math.floor(Math.random() * max)));
                  setMascotId(
                    MASCOT_IDS[Math.floor(Math.random() * MASCOT_IDS.length)] ?? DEFAULT_MASCOT_ID,
                  );
                }}
              >
                {t('onboarding.surprise')}
              </Button>

              {editing && (
                <Button variant="ghost" size="lg" onClick={() => setStep('character')}>
                  {t('common.back')}
                </Button>
              )}

              <Button size="lg" onClick={() => onFinish(avatar, mascotId)}>
                {editing ? t('common.confirm') : t('onboarding.start')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
