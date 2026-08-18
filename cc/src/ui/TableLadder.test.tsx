// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyFactStat } from '../domain/mastery';
import type { FactStats } from '../domain/types';
import { I18nProvider } from '../i18n/I18nProvider';
import { TableLadder } from './TableLadder';

function statFor(masteryScore: number, attempts = 4): FactStats[string] {
  return { ...createEmptyFactStat(), attempts, correct: attempts, masteryScore };
}

function renderLadder(table: number, stats: FactStats = {}) {
  return render(
    <I18nProvider locale="pt-BR">
      <TableLadder table={table} color="#f0a04b" stats={stats} />
    </I18nProvider>,
  );
}

describe('TableLadder', () => {
  it('mostra as dez contas da tabuada com o resultado', () => {
    const { container } = renderLadder(7);

    const rows = container.querySelectorAll('.ladder__row');
    expect(rows).toHaveLength(10);
    expect(within(rows[0] as HTMLElement).getByText('7 × 1')).toBeVisible();
    expect(within(rows[0] as HTMLElement).getByText('7')).toBeVisible();
    expect(within(rows[9] as HTMLElement).getByText('7 × 10')).toBeVisible();
    expect(within(rows[9] as HTMLElement).getByText('70')).toBeVisible();
  });

  it('desenha b grupos do tamanho da tabuada, e nao o contrario', () => {
    // 10 x 3 sao TRES dezenas. Com a ordem invertida seriam dez grupos de
    // tres, que na tabuada do 10 deixa toda linha com a mesma cara.
    const { container } = renderLadder(10);
    const terceira = container.querySelectorAll('.ladder__row')[2] as HTMLElement;

    expect(terceira.querySelectorAll('.ladder__group')).toHaveLength(3);
    expect(terceira.querySelectorAll('.ladder__block')).toHaveLength(30);
  });

  it('marca o que ja esta dominado e o que ainda escorrega', () => {
    const { container } = renderLadder(2, {
      '2x1': statFor(0.95),
      '2x7': statFor(0.2),
    });

    expect(screen.getByLabelText('Você já domina esta conta')).toBeVisible();
    expect(screen.getByLabelText('Esta conta ainda escorrega')).toBeVisible();
    // O fundo amarelo nunca vem sozinho: a linha fraca tambem ganha o icone.
    expect(container.querySelectorAll('.ladder__row--weak')).toHaveLength(1);
  });

  it('encolhe o bloco nas tabuadas grandes para a ultima linha caber', () => {
    const { container: pequena } = renderLadder(2);
    const { container: grande } = renderLadder(10);

    const ladderPequena = pequena.querySelector('.ladder') as HTMLElement;
    const ladderGrande = grande.querySelector('.ladder') as HTMLElement;

    expect(ladderPequena.style.getPropertyValue('--ladder-block')).toBe('10px');
    expect(ladderGrande.style.getPropertyValue('--ladder-block')).toBe('6px');
    // Grupo de dez vira retangulo 5x2 em vez de uma fita de dez blocos.
    expect(ladderGrande.style.getPropertyValue('--ladder-cols')).toBe('5');
    expect(ladderPequena.style.getPropertyValue('--ladder-cols')).toBe('2');
  });
});
