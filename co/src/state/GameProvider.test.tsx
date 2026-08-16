import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createDefaultGameState } from '../domain/defaultState';
import type { GameState, PlayerProfile } from '../domain/types';
import { generateQuestion } from '../domain/questions';
import type { ProgressRepository } from '../services/progressRepository';
import { GameProvider, useGame } from './GameProvider';

class MemoryRepository implements ProgressRepository {
  state = createDefaultGameState();
  async load() {
    return structuredClone(this.state);
  }
  async save(state: GameState) {
    this.state = structuredClone(state);
  }
  async reset() {
    this.state = createDefaultGameState();
  }
}

class FailingSaveRepository extends MemoryRepository {
  override async save(): Promise<void> {
    throw new Error('quota exceeded');
  }
}

const profile: PlayerProfile = {
  name: 'Lumi',
  avatarStyle: 'explorer',
  outfitColor: '#ff5d8f',
  hairStyle: 'curly',
  accessory: 'glasses',
  createdAt: '2026-08-15T12:00:00.000Z',
};

describe('GameProvider', () => {
  it('creates a profile and changes locale without losing it', async () => {
    const repository = new MemoryRepository();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <GameProvider repository={repository}>{children}</GameProvider>
    );
    const { result } = renderHook(() => useGame(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createPlayer(profile);
    });
    await act(async () => {
      await result.current.updateSettings({ locale: 'en-US' });
    });
    expect(result.current.state.player?.name).toBe('Lumi');
    expect(result.current.state.settings.locale).toBe('en-US');
    expect(repository.state.player?.accessory).toBe('glasses');
  });

  it('resets to first access defaults', async () => {
    const repository = new MemoryRepository();
    repository.state.player = profile;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <GameProvider repository={repository}>{children}</GameProvider>
    );
    const { result } = renderHook(() => useGame(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.resetProgress();
    });
    expect(result.current.state.player).toBeNull();
    expect(result.current.state.progress.tables['2'].status).toBe('available');
  });

  it('persists the active mission checkpoint for an exact resume', async () => {
    const repository = new MemoryRepository();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <GameProvider repository={repository}>{children}</GameProvider>
    );
    const { result } = renderHook(() => useGame(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstQuestion = generateQuestion(2, 3, () => 0.4);
    const nextQuestion = generateQuestion(2, 4, () => 0.6);
    await act(async () => {
      await result.current.startSession(2, firstQuestion);
    });
    await act(async () => {
      await result.current.answer(2, 3, false);
    });
    expect(repository.state.progress.activeMission).toMatchObject({
      feedback: 'incorrect',
      incorrect: 1,
      completedSteps: 0,
    });
    await act(async () => {
      await result.current.answer(2, 3, true);
    });
    expect(repository.state.progress.activeMission).toMatchObject({
      feedback: 'correct',
      correct: 1,
    });
    await act(async () => {
      await result.current.saveMissionProgress(2, 1, 1, 1, nextQuestion);
    });
    const saved = await repository.load();
    expect(saved.progress.activeMission).toMatchObject({
      table: 2,
      completedSteps: 1,
      correct: 1,
      incorrect: 1,
      feedback: null,
    });
    expect(saved.progress.activeMission?.currentQuestion).toEqual(nextQuestion);
  });

  it('keeps the in-memory session playable when persistence fails', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <GameProvider repository={new FailingSaveRepository()}>{children}</GameProvider>
    );
    const { result } = renderHook(() => useGame(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await expect(result.current.createPlayer(profile)).resolves.toBeDefined();
    });
    expect(result.current.state.player?.name).toBe('Lumi');
  });
});
