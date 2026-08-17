// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultState } from '../domain/defaultState';
import { TABLES } from '../domain/facts';
import type { GameState } from '../domain/types';
import { I18nProvider } from '../i18n/I18nProvider';
import { HomeScreen } from './HomeScreen';

function renderHome(state: GameState, overrides: Partial<Parameters<typeof HomeScreen>[0]> = {}) {
  render(
    <I18nProvider locale="en-US">
      <HomeScreen
        state={state}
        onPlay={vi.fn()}
        onAchievements={vi.fn()}
        onSettings={vi.fn()}
        onEditCharacter={vi.fn()}
        onDiploma={vi.fn()}
        onChallenge={vi.fn()}
        {...overrides}
      />
    </I18nProvider>,
  );
}

describe('HomeScreen avatar interaction', () => {
  it('separa o aceno do avatar da edição do personagem', async () => {
    const user = userEvent.setup();
    const onEditCharacter = vi.fn();
    const state = createDefaultState('en-US');
    state.player.onboardingCompleted = true;

    renderHome(state, { onEditCharacter });

    await user.click(screen.getByRole('button', { name: 'Tap to wave' }));
    expect(onEditCharacter).not.toHaveBeenCalled();
    expect(document.querySelector('.home__avatar--waving')).toBeInTheDocument();
    expect(document.querySelector('.mascot--waving')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change character' }));
    expect(onEditCharacter).toHaveBeenCalledOnce();
  });
});

describe('HomeScreen troféu de conclusão', () => {
  it('esconde o diploma enquanto o arquipélago não está completo', () => {
    renderHome(createDefaultState('en-US'));
    expect(screen.queryByRole('button', { name: /My master diploma/ })).not.toBeInTheDocument();
  });

  it('deixa reabrir o final depois de concluir todas as ilhas', async () => {
    const user = userEvent.setup();
    const onDiploma = vi.fn();
    const state = createDefaultState('en-US');
    for (const table of TABLES) {
      state.progress.islands[String(table)] = {
        table,
        unlocked: true,
        completed: true,
        completedMissionIds: [],
        stars: 3,
        questionsAnswered: 10,
        firstTryCorrect: 9,
        completedAt: '2026-05-30T10:00:00.000Z',
      };
    }

    renderHome(state, { onDiploma });

    await user.click(screen.getByRole('button', { name: /My master diploma/ }));
    expect(onDiploma).toHaveBeenCalledOnce();
  });
});
