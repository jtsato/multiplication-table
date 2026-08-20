// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
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
  it('mostra o evento quando o dia não é comum', () => {
    mudarDia(diaComEvento());
    render(<DailyBanner />);
    expect(screen.getByRole('status')).toHaveTextContent('Hoje');
  });

  it('não renderiza nada em dia comum', () => {
    mudarDia(diaComum());
    const { container } = render(<DailyBanner />);
    expect(container.firstChild).toBeNull();
  });
});
