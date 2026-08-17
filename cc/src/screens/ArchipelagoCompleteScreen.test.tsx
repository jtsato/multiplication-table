// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultState } from '../domain/defaultState';
import { TABLES } from '../domain/facts';
import { recordAnswer } from '../domain/statistics';
import type { GameState } from '../domain/types';
import { I18nProvider } from '../i18n/I18nProvider';
import { ArchipelagoCompleteScreen } from './ArchipelagoCompleteScreen';

function masteredState(): GameState {
  const base = createDefaultState('en-US');
  const islands = { ...base.progress.islands };
  for (const table of TABLES) {
    islands[String(table)] = {
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

  // Uma conta que custou tres erros e hoje esta dominada.
  const outcomes = [false, false, false, ...Array.from({ length: 12 }, () => true)];
  const statistics = outcomes.reduce(
    (current, wasCorrect) => recordAnswer(current, '7x8', wasCorrect),
    base.statistics,
  );

  return { ...base, progress: { ...base.progress, islands }, statistics };
}

function renderScreen(origin: 'map' | 'home', onBack = vi.fn()) {
  const utils = render(
    <I18nProvider locale="en-US">
      <ArchipelagoCompleteScreen
        state={masteredState()}
        origin={origin}
        onBack={onBack}
        onChallenge={vi.fn()}
      />
    </I18nProvider>,
  );
  return { ...utils, onBack };
}

describe('ArchipelagoCompleteScreen', () => {
  it('celebra e entrega o diploma com os números da jornada', () => {
    const { container } = renderScreen('map');

    expect(screen.getByRole('heading', { name: 'Times Table Master!' })).toBeVisible();
    expect(container.querySelectorAll('.confetti').length).toBeGreaterThanOrEqual(40);
    expect(container.querySelector('.mascot--cheering')).toBeInTheDocument();

    // Uma ilha acesa por tabuada — o arquipelago inteiro de uma vez.
    expect(container.querySelectorAll('.finale__island')).toHaveLength(TABLES.length);

    // 9 ilhas x 3 estrelas.
    expect(screen.getByText(String(TABLES.length * 3))).toBeInTheDocument();
    expect(screen.getByText(`/${TABLES.length * 3}`)).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('mostra a coroa de mestre sem alterar o personagem salvo', () => {
    const state = masteredState();
    render(
      <I18nProvider locale="en-US">
        <ArchipelagoCompleteScreen
          state={state}
          origin="map"
          onBack={vi.fn()}
          onChallenge={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('img', { name: /crown/i })).toBeInTheDocument();
    expect(state.player.avatar.accessory).toBe('none');
  });

  it('nomeia a conta mais difícil já vencida', () => {
    renderScreen('map');

    expect(screen.getByText('7 × 8')).toBeInTheDocument();
    expect(screen.getByText(/missed it 3 times/i)).toBeInTheDocument();
  });

  it('rotula a saída conforme de onde a criança chegou', async () => {
    const user = userEvent.setup();
    const { onBack, unmount } = renderScreen('map');
    await user.click(screen.getByRole('button', { name: /See the map/ }));
    expect(onBack).toHaveBeenCalledOnce();
    unmount();

    renderScreen('home');
    expect(screen.getByRole('button', { name: /Back to start/ })).toBeVisible();
  });
});
