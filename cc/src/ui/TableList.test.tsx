// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyFactStat } from '../domain/mastery';
import type { FactStats } from '../domain/types';
import { I18nProvider } from '../i18n/I18nProvider';
import { TableList } from './TableList';

function statFor(masteryScore: number, attempts = 4): FactStats[string] {
  return { ...createEmptyFactStat(), attempts, correct: attempts, masteryScore };
}

function renderList(table: number, stats: FactStats = {}) {
  return render(
    <I18nProvider locale="pt-BR">
      <TableList table={table} stats={stats} />
    </I18nProvider>,
  );
}

describe('TableList', () => {
  it('escreve as dez contas da tabuada com o resultado', () => {
    const { container } = renderList(7);

    const rows = container.querySelectorAll('.table-list__row');
    expect(rows).toHaveLength(10);
    expect(within(rows[0] as HTMLElement).getByText('7 × 1')).toBeVisible();
    expect(within(rows[0] as HTMLElement).getByText('7')).toBeVisible();
    expect(within(rows[9] as HTMLElement).getByText('7 × 10')).toBeVisible();
    expect(within(rows[9] as HTMLElement).getByText('70')).toBeVisible();
  });

  it('nao desenha bloco nenhum, nem na tabuada do 10', () => {
    // O desenho da conta vive no HintArray, depois do erro. Aqui manda o
    // numero: e ele que a crianca leva para a missao.
    const { container } = renderList(10);

    expect(container.querySelector('.table-list__block')).toBeNull();
    expect(container.querySelector('.ladder__block')).toBeNull();
    expect(container.querySelectorAll('.table-list__row')).toHaveLength(10);
    expect(screen.getByText('100')).toBeVisible();
  });

  it('marca o que ja esta dominado e o que ainda escorrega', () => {
    const { container } = renderList(2, {
      '2x1': statFor(0.95),
      '2x7': statFor(0.2),
    });

    expect(screen.getByLabelText('Você já domina esta conta')).toBeVisible();
    expect(screen.getByLabelText('Esta conta ainda escorrega')).toBeVisible();
    // O fundo amarelo nunca vem sozinho: a linha fraca tambem ganha o icone.
    expect(container.querySelectorAll('.table-list__row--weak')).toHaveLength(1);
  });
});
