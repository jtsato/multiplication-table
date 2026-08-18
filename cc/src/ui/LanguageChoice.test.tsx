// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageChoice } from './LanguageChoice';

describe('LanguageChoice', () => {
  it('apresenta os idiomas como escolha unica, e nao como botoes de acao', () => {
    render(<LanguageChoice legend="Idioma" value="pt-BR" onChange={vi.fn()} />);

    // Radio, nao botao: a tela de idioma nao pode parecer que cada opcao
    // dispara uma acao (era o que confundia no primeiro acesso).
    expect(screen.getByRole('radiogroup', { name: 'Idioma' })).toBeVisible();
    expect(screen.getByRole('radio', { name: /Português/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /English/ })).not.toBeChecked();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('marca a opcao clicada e avisa quem controla o idioma', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageChoice legend="Idioma" value="pt-BR" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /English/ }));

    expect(onChange).toHaveBeenCalledWith('en-US');
  });

  it('escreve cada idioma nele mesmo, para quem ainda nao le o atual', () => {
    render(<LanguageChoice legend="Language" value="en-US" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /Português/ })).toHaveAttribute('lang', 'pt-BR');
    expect(screen.getByRole('radio', { name: /English/ })).toHaveAttribute('lang', 'en-US');
  });
});
