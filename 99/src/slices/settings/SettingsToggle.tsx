import { useGameStore } from '../../app/store';
import './settings.css';

/**
 * Botão que abre as configurações.
 *
 * Fica sempre visível no canto superior direito, fora do canvas — no celular ele
 * não compete com o joystick, e no computador não compete com o painel de
 * controles.
 */
export function SettingsToggle() {
  const toggleSettings = useGameStore((state) => state.toggleSettings);
  const title = useGameStore((state) => state.text.strings.settingsTitle);

  return (
    <button
      type="button"
      className="settings-toggle"
      onClick={toggleSettings}
      aria-haspopup="dialog"
      aria-label={title}
    >
      {title}
    </button>
  );
}
