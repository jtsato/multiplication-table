// @vitest-environment jsdom
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { LANTERN } from '../slices/lantern';
import { Hud } from './Hud';
import { useGameStore } from './store';

const state = () => useGameStore.getState();

function relogio(phase: 'dia' | 'entardecer' | 'noite' | 'amanhecer', secondsToNextPhase = 20) {
  act(() => {
    state().publishClock({ phase, day: 1, secondsToNextPhase });
  });
}

describe('Hud', () => {
  beforeEach(() => {
    state().resetResources();
    state().resetBuilding();
    state().resetClock();
    state().resetLantern();
  });

  it('mostra a barra de carga da lanterna', () => {
    render(<Hud />);

    expect(screen.getByRole('meter', { name: /lanterna/i })).toBeInTheDocument();
  });

  it('nao mostra mais barra de vida nem aviso de perigo', () => {
    render(<Hud />);

    expect(screen.queryByRole('meter', { name: /vida/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/à espreita/i)).not.toBeInTheDocument();
  });

  it('a barra acompanha a carga publicada', () => {
    act(() => {
      state().publishLanternCharge(LANTERN.chargeSeconds);
    });
    render(<Hud />);

    expect(screen.getByRole('meter', { name: /lanterna/i })).toHaveAttribute(
      'aria-valuenow',
      String(LANTERN.chargeSeconds),
    );
  });

  it('no entardecer convida a acender a lanterna, sem ameacar', () => {
    relogio('entardecer', 12);
    render(<Hud />);

    const aviso = screen.getByRole('alert');
    expect(aviso).toHaveTextContent(/lanterna/i);
    expect(aviso.textContent).not.toMatch(/noite está chegando|perigo|monstro/i);
  });

  it('avisa quando a carga esta fraca durante a noite', () => {
    relogio('noite');
    act(() => {
      state().publishLanternCharge(LANTERN.lowChargeSeconds - 1);
    });
    render(<Hud />);

    expect(screen.getByText(/lanterna está fraca/i)).toBeInTheDocument();
  });

  it('nao avisa carga fraca de dia', () => {
    relogio('dia');
    act(() => {
      state().publishLanternCharge(0);
    });
    render(<Hud />);

    expect(screen.queryByText(/lanterna está fraca/i)).not.toBeInTheDocument();
  });
});
