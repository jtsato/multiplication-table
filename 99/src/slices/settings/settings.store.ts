import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { setAudioVolume } from '../../shared/audio';
import { clampSensitivity, clampVolume, SETTINGS } from './settings.logic';

/**
 * Configurações no store.
 *
 * Volume e sensibilidade são duráveis (vão para o save); `settingsOpen` é
 * estado de UI e morre com a sessão.
 */
export interface SettingsSlice {
  settingsOpen: boolean;
  /** Volume mestre do áudio, de 0 a 1. */
  volume: number;
  /** Multiplicador da sensibilidade da câmera, de 0.5 a 2. */
  cameraSensitivity: number;
  /** Se `true`, construir não exige acertar a conta — para quem já domina. */
  instantBuild: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  setVolume: (value: number) => void;
  setCameraSensitivity: (value: number) => void;
  setInstantBuild: (value: boolean) => void;
  resetSettings: () => void;
  /** Restaura configurações vindas do save e aplica no áudio. */
  loadSettings: (volume: number, cameraSensitivity: number, instantBuild: boolean) => void;
}

export const createSettingsSlice: StateCreator<GameState, [], [], SettingsSlice> = (set) => ({
  settingsOpen: false,
  volume: SETTINGS.defaultVolume,
  cameraSensitivity: SETTINGS.defaultSensitivity,
  instantBuild: SETTINGS.defaultInstantBuild,

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),

  setVolume: (value) => {
    const volume = clampVolume(value);
    setAudioVolume(volume);
    set({ volume });
  },

  setCameraSensitivity: (value) => set({ cameraSensitivity: clampSensitivity(value) }),

  setInstantBuild: (value) => set({ instantBuild: Boolean(value) }),

  resetSettings: () => {
    setAudioVolume(SETTINGS.defaultVolume);
    set({
      volume: SETTINGS.defaultVolume,
      cameraSensitivity: SETTINGS.defaultSensitivity,
      instantBuild: SETTINGS.defaultInstantBuild,
    });
  },

  loadSettings: (volume, cameraSensitivity, instantBuild) => {
    const ajustado = clampVolume(volume);
    setAudioVolume(ajustado);
    set({
      volume: ajustado,
      cameraSensitivity: clampSensitivity(cameraSensitivity),
      instantBuild: Boolean(instantBuild),
    });
  },
});
