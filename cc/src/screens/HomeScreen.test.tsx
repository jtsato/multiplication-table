// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultState } from '../domain/defaultState';
import { I18nProvider } from '../i18n/I18nProvider';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen avatar interaction', () => {
  it('separa o aceno do avatar da edição do personagem', async () => {
    const user = userEvent.setup();
    const onEditCharacter = vi.fn();
    const state = createDefaultState('en-US');
    state.player.onboardingCompleted = true;

    render(
      <I18nProvider locale="en-US">
        <HomeScreen
          state={state}
          onPlay={vi.fn()}
          onAchievements={vi.fn()}
          onSettings={vi.fn()}
          onEditCharacter={onEditCharacter}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Tap to wave' }));
    expect(onEditCharacter).not.toHaveBeenCalled();
    expect(document.querySelector('.home__avatar--waving')).toBeInTheDocument();
    expect(document.querySelector('.mascot--waving')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change character' }));
    expect(onEditCharacter).toHaveBeenCalledOnce();
  });
});
