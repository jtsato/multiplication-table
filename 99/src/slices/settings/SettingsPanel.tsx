import { useEffect, useState } from 'react';
import { useGameStore } from '../../app/store';
import { LOCALE_ENDONYMS, SUPPORTED_LOCALES } from '../../i18n';
import { isFullscreen, SETTINGS, toggleFullscreen } from './settings.logic';
import './settings.css';

/**
 * Painel de configurações.
 *
 * Volume e sensibilidade são duráveis; idioma já vivia no save; tela cheia é um
 * efeito do navegador, então o rótulo acompanha o evento `fullscreenchange`.
 */
export function SettingsPanel() {
  const open = useGameStore((state) => state.settingsOpen);
  const volume = useGameStore((state) => state.volume);
  const cameraSensitivity = useGameStore((state) => state.cameraSensitivity);
  const instantBuild = useGameStore((state) => state.instantBuild);
  const setVolume = useGameStore((state) => state.setVolume);
  const setCameraSensitivity = useGameStore((state) => state.setCameraSensitivity);
  const setInstantBuild = useGameStore((state) => state.setInstantBuild);
  const closeSettings = useGameStore((state) => state.closeSettings);
  const locale = useGameStore((state) => state.locale);
  const setLocale = useGameStore((state) => state.setLocale);
  const t = useGameStore((state) => state.text).strings;

  const [fullscreen, setFullscreen] = useState(isFullscreen());

  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  if (!open) return null;

  return (
    <div className="settings-overlay">
      <div className="settings" role="dialog" aria-label={t.settingsTitle}>
        <h2 className="settings__title">{t.settingsTitle}</h2>

        <label className="settings__field">
          <span>
            {t.settingsVolume}: {Math.round(volume * 100)}%
          </span>
          <input
            type="range"
            min={SETTINGS.minVolume}
            max={SETTINGS.maxVolume}
            step={0.05}
            value={volume}
            aria-label={t.settingsVolume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>

        <label className="settings__field">
          <span>
            {t.settingsSensitivity}: {cameraSensitivity.toFixed(2)}×
          </span>
          <input
            type="range"
            min={SETTINGS.minSensitivity}
            max={SETTINGS.maxSensitivity}
            step={0.05}
            value={cameraSensitivity}
            aria-label={t.settingsSensitivity}
            onChange={(event) => setCameraSensitivity(Number(event.target.value))}
          />
        </label>

        <label className="settings__field settings__field--check">
          <input
            type="checkbox"
            checked={instantBuild}
            aria-label={t.settingsInstantBuild}
            onChange={(event) => setInstantBuild(event.target.checked)}
          />
          <span>{t.settingsInstantBuild}</span>
        </label>

        <div className="settings__field">
          <span>{t.settingsLanguage}</span>
          <div className="settings__languages" role="group" aria-label={t.settingsLanguage}>
            {SUPPORTED_LOCALES.map((opcao) => (
              <button
                key={opcao}
                type="button"
                className={`settings__language ${
                  opcao === locale ? 'settings__language--on' : ''
                }`}
                aria-pressed={opcao === locale}
                onClick={() => setLocale(opcao)}
              >
                {LOCALE_ENDONYMS[opcao]}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="settings__button" onClick={toggleFullscreen}>
          {fullscreen ? t.settingsExitFullscreen : t.settingsFullscreen}
        </button>

        <button
          type="button"
          className="settings__button settings__button--close"
          onClick={closeSettings}
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
