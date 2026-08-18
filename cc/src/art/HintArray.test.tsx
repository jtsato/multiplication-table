// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n/I18nProvider';
import { HintArray } from './HintArray';

function renderHint(a: number, b: number) {
  return render(
    <I18nProvider locale="pt-BR">
      <HintArray a={a} b={b} color="#f0a04b" />
    </I18nProvider>,
  );
}

describe('HintArray', () => {
  it('desenha b grupos do tamanho da tabuada, na mesma ordem da escada', () => {
    const { container } = renderHint(2, 7);

    expect(screen.getByText('Olha só: 7 grupos de 2')).toBeVisible();
    expect(container.querySelectorAll('.hint__group')).toHaveLength(7);
    expect(container.querySelectorAll('.hint__block')).toHaveLength(14);
    expect(screen.getByText('São 14 blocos no total')).toBeVisible();
  });

  it('quebra o grupo em fileiras de 5 nas tabuadas grandes', () => {
    // 10 x 3 = tres dezenas, cada uma um retangulo 5x2 - e nao uma coluna de
    // dez blocos, que so caberia em pe.
    const { container } = renderHint(10, 3);
    const hint = container.querySelector('.hint') as HTMLElement;

    expect(hint.style.getPropertyValue('--hint-cols')).toBe('5');
    expect(container.querySelectorAll('.hint__group')).toHaveLength(3);
    expect(container.querySelectorAll('.hint__block')).toHaveLength(30);
  });

  it('mantem o grupo em uma fileira so nas tabuadas pequenas', () => {
    const { container } = renderHint(3, 4);
    const hint = container.querySelector('.hint') as HTMLElement;

    expect(hint.style.getPropertyValue('--hint-cols')).toBe('3');
  });
});
