import { useTranslation } from '../i18n/I18nProvider';

interface SoundToggleProps {
  muted: boolean;
  onToggle: () => void;
}

/**
 * Icone flutuante de som, visivel em qualquer tela.
 * Alterna musica e efeitos juntos, sem precisar abrir as configuracoes.
 */
export function SoundToggle({ muted, onToggle }: SoundToggleProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={onToggle}
      aria-pressed={!muted}
      aria-label={muted ? t('settings.unmute') : t('settings.mute')}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}
