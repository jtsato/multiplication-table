// @vitest-environment jsdom
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { useGameStore } from '../../app/store';
import { resetPlayerTransform } from '../player/playerTransform';
import { Minimapa } from './Minimapa';
import { WorldMap } from './WorldMap';

const state = () => useGameStore.getState();

describe('Minimapa', () => {
  beforeEach(() => {
    resetPlayerTransform();
    act(() => state().closeMap());
  });

  /**
   * O minimapa fixo no canto virou um botao. O mapa inteiro nao cabe num
   * quadrado de 150 px sem virar borrao, entao ele passou a abrir em tela cheia.
   */
  it('é um botão, e não um painel de mapa fixo', () => {
    const { container } = render(<Minimapa />);

    expect(screen.getByRole('button', { name: 'Mapa da ilha' })).toBeInTheDocument();
    expect(container.querySelector('.minimap__player')).toBeNull();
  });

  it('abrir o botão abre o mapa em tela cheia', async () => {
    render(<Minimapa />);

    await userEvent.click(screen.getByRole('button', { name: 'Mapa da ilha' }));

    expect(state().mapOpen).toBe(true);
  });
});

describe('WorldMap', () => {
  beforeEach(() => {
    resetPlayerTransform();
    act(() => state().closeMap());
  });

  it('não renderiza nada com o mapa fechado', () => {
    const { container } = render(<WorldMap />);
    expect(container.firstChild).toBeNull();
  });

  it('aberto, mostra as regiões e o ponto do jogador', () => {
    act(() => state().openMap());
    const { container } = render(<WorldMap />);

    expect(screen.getByRole('dialog', { name: 'Mapa da ilha' })).toBeInTheDocument();
    for (const nome of ['Praia', 'Porto', 'Bosque', 'Cachoeira', 'Pomar', 'Pico']) {
      expect(screen.getByText(nome)).toBeInTheDocument();
    }
    expect(container.querySelector('.worldmap__player')).not.toBeNull();
  });

  it('o botão Fechar fecha o mapa', async () => {
    act(() => state().openMap());
    render(<WorldMap />);

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(state().mapOpen).toBe(false);
  });
});
