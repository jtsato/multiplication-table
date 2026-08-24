// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useGameStore } from '../../app/store';
import { DailyBanner } from './DailyBanner';
import { eventForDay, hasDailyEvent } from './daily.logic';

function diaComEvento(): number {
  for (let day = 1; day <= 200; day += 1) {
    if (hasDailyEvent(eventForDay(day).kind)) return day;
  }
  throw new Error('nenhum dia com evento encontrado');
}

function diaComum(): number {
  for (let day = 1; day <= 200; day += 1) {
    if (!hasDailyEvent(eventForDay(day).kind)) return day;
  }
  throw new Error('nenhum dia comum encontrado');
}

function mudarDia(day: number): void {
  useGameStore.setState({ clock: { ...useGameStore.getState().clock, day } });
}

describe('DailyBanner', () => {
  beforeEach(() => {
    useGameStore.setState({ clock: { ...useGameStore.getState().clock, day: 1 } });
  });

  it('mostra um botão de novidade quando o dia tem evento', () => {
    mudarDia(diaComEvento());
    render(<DailyBanner />);
    expect(screen.getByRole('button', { name: 'Novidade de hoje' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre a mensagem centralizada', async () => {
    mudarDia(diaComEvento());
    render(<DailyBanner />);

    await userEvent.click(screen.getByRole('button', { name: 'Novidade de hoje' }));

    expect(screen.getByRole('dialog', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Dia de|Visitante|baleia/i);
  });

  it('marca a mensagem como lida e remove o ponto de alerta', async () => {
    mudarDia(diaComEvento());
    render(<DailyBanner />);

    await userEvent.click(screen.getByRole('button', { name: 'Novidade de hoje' }));
    await userEvent.click(screen.getByRole('button', { name: 'Entendi' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelector('.daily-bell__dot')).toBeNull();
  });

  it('não renderiza nada em dia comum', () => {
    mudarDia(diaComum());
    const { container } = render(<DailyBanner />);
    expect(container.firstChild).toBeNull();
  });
});
