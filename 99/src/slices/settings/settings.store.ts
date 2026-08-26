import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { setAudioVolume } from '../../shared/audio';
import { clampSensitivity, clampVolume, clampZoom, SETTINGS } from './settings.logic';

/**
 * Configurações no store.
 *
 * Volume e sensibilidade são duráveis (vão para o save); `settingsOpen` é
 * estado de UI e morre com a sessão.
 */
export interface SettingsSlice {
  settingsOpen: boolean;
  /** Tela de mapa cheio aberta? */
  mapOpen: boolean;
  /** Volume mestre do áudio, de 0 a 1. */
  volume: number;
  /** Multiplicador da sensibilidade da câmera, de 0.5 a 2. */
  cameraSensitivity: number;
  /** Multiplicador da distância da câmera, de 0.6 a 1.8: perto de 0.6, longe de 1.8. */
  cameraZoom: number;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  openMap: () => void;
  closeMap: () => void;
  toggleMap: () => void;
  setVolume: (value: number) => void;
  setCameraSensitivity: (value: number) => void;
  setCameraZoom: (value: number) => void;
  resetSettings: () => void;
  /** Restaura configurações vindas do save e aplica no áudio. */
  loadSettings: (volume: number, cameraSensitivity: number, cameraZoom: number) => void;
}

export const createSettingsSlice: StateCreator<GameState, [], [], SettingsSlice> = (set) => ({
  settingsOpen: false,
  mapOpen: false,
  volume: SETTINGS.defaultVolume,
  cameraSensitivity: SETTINGS.defaultSensitivity,
  cameraZoom: SETTINGS.defaultZoom,

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),

  openMap: () => set({ mapOpen: true }),
  closeMap: () => set({ mapOpen: false }),
  toggleMap: () => set((state) => ({ mapOpen: !state.mapOpen })),

  setVolume: (value) => {
    const volume = clampVolume(value);
    setAudioVolume(volume);
    set({ volume });
  },

  setCameraSensitivity: (value) => set({ cameraSensitivity: clampSensitivity(value) }),

  setCameraZoom: (value) => set({ cameraZoom: clampZoom(value) }),

  resetSettings: () => {
    setAudioVolume(SETTINGS.defaultVolume);
    set({
      volume: SETTINGS.defaultVolume,
      cameraSensitivity: SETTINGS.defaultSensitivity,
      cameraZoom: SETTINGS.defaultZoom,
      mapOpen: false,
    });
  },

  loadSettings: (volume, cameraSensitivity, cameraZoom) => {
    const ajustado = clampVolume(volume);
    setAudioVolume(ajustado);
    set({
      volume: ajustado,
      cameraSensitivity: clampSensitivity(cameraSensitivity),
      cameraZoom: clampZoom(cameraZoom),
    });
  },
});
