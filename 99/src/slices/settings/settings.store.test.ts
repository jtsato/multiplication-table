// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../../app/store';
import { setAudioVolume } from '../../shared/audio';
import { SETTINGS } from './settings.logic';

vi.mock('../../shared/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/audio')>();
  return { ...actual, setAudioVolume: vi.fn() };
});

const state = () => useGameStore.getState();

describe('settings.store', () => {
  beforeEach(() => {
    state().resetSettings();
    vi.clearAllMocks();
  });

  it('setVolume aplica no áudio e limita ao intervalo', () => {
    state().setVolume(2);
    expect(state().volume).toBe(SETTINGS.maxVolume);
    expect(setAudioVolume).toHaveBeenCalledWith(SETTINGS.maxVolume);
  });

  it('setCameraSensitivity limita ao intervalo', () => {
    state().setCameraSensitivity(9);
    expect(state().cameraSensitivity).toBe(SETTINGS.maxSensitivity);
    state().setCameraSensitivity(0.1);
    expect(state().cameraSensitivity).toBe(SETTINGS.minSensitivity);
  });

  it('setCameraZoom limita ao intervalo', () => {
    state().setCameraZoom(9);
    expect(state().cameraZoom).toBe(SETTINGS.maxZoom);
    state().setCameraZoom(0.1);
    expect(state().cameraZoom).toBe(SETTINGS.minZoom);
  });

  it('loadSettings restaura valores e aplica o volume', () => {
    state().loadSettings(0.2, 1.8, 1.4);
    expect(state().volume).toBe(0.2);
    expect(state().cameraSensitivity).toBe(1.8);
    expect(state().cameraZoom).toBe(1.4);
    expect(setAudioVolume).toHaveBeenCalledWith(0.2);
  });
});
