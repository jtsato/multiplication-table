// @vitest-environment jsdom
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { useGameStore } from '../../app/store';
import { AnimalBookPanel } from './AnimalBookPanel';
import { emptyAnimalBook } from './wildlife.logic';

const state = () => useGameStore.getState();

function abrirCaderneta() {
  act(() => {
    state().setNearbySpot('caderneta');
    state().openNearbySpot();
  });
}

function comAmigo() {
  act(() => {
    const livro = emptyAnimalBook().map((entry) =>
      entry.kind === 'cachorro' ? { ...entry, seen: true, friend: true } : entry,
    );
    useGameStore.setState({ animalBook: livro });
  });
}

describe('AnimalBookPanel', () => {
  beforeEach(() => {
    state().resetWildlife();
    state().resetCompanion();
    state().closeSpot();
    state().setNearbySpot(null);
  });

  it('nao aparece longe da caderneta', () => {
    const { container } = render(<AnimalBookPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra quem ainda nao foi visto', () => {
    abrirCaderneta();
    render(<AnimalBookPanel />);

    expect(screen.getByRole('dialog', { name: 'Caderneta dos animais' })).toBeInTheDocument();
    expect(screen.getAllByText('Ainda não visto').length).toBeGreaterThan(0);
  });

  it('mostra o amigo e permite leva-lo como pet', async () => {
    comAmigo();
    abrirCaderneta();
    render(<AnimalBookPanel />);

    expect(screen.getByText('Cachorro')).toBeInTheDocument();
    expect(screen.getByText('Amigo')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Levar comigo Cachorro/ }));

    expect(state().pet).toBe('cachorro');
  });

  it('nao oferece levar um animal que ainda nao virou amigo', () => {
    abrirCaderneta();
    render(<AnimalBookPanel />);

    const levar = screen.getAllByRole('button', { name: /Levar comigo/ });
    expect(levar.length).toBeGreaterThan(0);
    expect(levar[0]).toBeDisabled();
  });

  it('fechar volta ao jogo', async () => {
    abrirCaderneta();
    render(<AnimalBookPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(state().openSpot).toBeNull();
  });
});
