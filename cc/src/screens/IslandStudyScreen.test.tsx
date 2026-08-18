// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultState } from '../domain/defaultState';
import type { GameState } from '../domain/types';
import { I18nProvider } from '../i18n/I18nProvider';
import { IslandStudyScreen } from './IslandStudyScreen';

function renderStudy(table: number, mutate?: (state: GameState) => GameState) {
  const base = createDefaultState('pt-BR');
  const state = mutate ? mutate(base) : base;
  const onPlay = vi.fn();
  const onBack = vi.fn();

  render(
    <I18nProvider locale="pt-BR">
      <IslandStudyScreen state={state} table={table} onPlay={onPlay} onBack={onBack} />
    </I18nProvider>,
  );

  return { onPlay, onBack };
}

describe('IslandStudyScreen', () => {
  it('apresenta a tabuada da ilha inteira antes de jogar', () => {
    renderStudy(2);

    expect(screen.getByRole('heading', { name: 'Tabuada do 2' })).toBeVisible();
    expect(screen.getByText('0 de 4 missões')).toBeVisible();
    expect(document.querySelectorAll('.table-list__row')).toHaveLength(10);
  });

  it('leva para a proxima missao ainda nao concluida', async () => {
    const user = userEvent.setup();
    const { onPlay } = renderStudy(2, (state) => ({
      ...state,
      progress: {
        ...state.progress,
        islands: {
          ...state.progress.islands,
          '2': { ...state.progress.islands['2']!, completedMissionIds: ['t2-m1'] },
        },
      },
    }));

    // Uma missao concluida: o botao chama a de numero 2, nao a 1.
    const play = screen.getByRole('button', { name: 'Jogar a missão 2' });
    await user.click(play);
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('na ilha ja concluida aponta para a missao que o jogo vai abrir', () => {
    renderStudy(2, (state) => ({
      ...state,
      progress: {
        ...state.progress,
        islands: {
          ...state.progress.islands,
          '2': {
            ...state.progress.islands['2']!,
            completed: true,
            completedMissionIds: ['t2-m1', 't2-m2', 't2-m3', 't2-final'],
          },
        },
      },
    }));

    // Sem "proxima missao", o jogo recomeca pela primeira - e o rotulo tem de
    // dizer isso, nao prometer a quarta.
    expect(screen.getByRole('button', { name: 'Jogar a missão 1' })).toBeVisible();
  });

  it('deixa voltar ao mapa sem jogar', async () => {
    const user = userEvent.setup();
    const { onBack, onPlay } = renderStudy(5);

    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onPlay).not.toHaveBeenCalled();
  });
});
