// @vitest-environment jsdom
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { DaySummary } from './DaySummary';
import { useGameStore } from './store';

const state = () => useGameStore.getState();

describe('DaySummary', () => {
  beforeEach(() => {
    state().resetEconomy();
    state().resetClock();
  });

  it('nao aparece durante o dia', () => {
    const { container } = render(<DaySummary />);
    expect(container).toBeEmptyDOMElement();
  });

  it('aparece quando o dia fecha', () => {
    act(() => state().openSummary(1));
    render(<DaySummary />);

    expect(screen.getByRole('dialog', { name: 'Resumo do dia' })).toBeInTheDocument();
  });

  it('mostra contas certas, moedas do dia e o que foi aprendido', () => {
    act(() => {
      state().rewardCorrect(2, 7);
      state().openSummary(1);
    });
    render(<DaySummary />);

    const resumo = screen.getByRole('dialog', { name: 'Resumo do dia' });
    expect(resumo).toHaveTextContent('1');
    expect(resumo).toHaveTextContent(String(state().coinsToday));
    expect(screen.getByText(/Você aprendeu/)).toHaveTextContent('2 × 7');
  });

  it('nao lista descobertas quando nao houve nenhuma', () => {
    act(() => {
      state().rewardCorrect(2, 7);
      state().resetDaily();
      state().openSummary(1);
    });
    render(<DaySummary />);

    expect(screen.queryByText(/Você aprendeu/)).not.toBeInTheDocument();
  });

  it('nao reabre no mesmo amanhecer depois de fechado', async () => {
    act(() => state().openSummary(1));
    render(<DaySummary />);

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(state().summaryOpen).toBe(false);

    act(() => state().openSummary(1));
    expect(state().summaryOpen).toBe(false);
  });

  it('reabre no dia seguinte', () => {
    act(() => {
      state().openSummary(1);
      state().closeSummary();
      state().openSummary(2);
    });

    expect(state().summaryOpen).toBe(true);
  });

  it('fechar zera os contadores do dia, mas nao as moedas', async () => {
    act(() => {
      state().rewardCorrect(2, 7);
      state().openSummary(1);
    });
    const moedas = state().coins;
    render(<DaySummary />);

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(state().correctToday).toBe(0);
    expect(state().coinsToday).toBe(0);
    expect(state().coins).toBe(moedas);
    expect(state().knownFacts).toContain('2x7');
  });
});
