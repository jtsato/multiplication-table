// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageChoice } from './LanguageChoice';

describe('LanguageChoice', () => {
  it('fica recolhido e mostra o codigo regional e o nome nativo', () => {
    render(<LanguageChoice legend="Idioma" value="pt-BR" onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Idioma.*Portugu/ });

    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('BR')).toBeVisible();
    expect(screen.getByText(/Portugu/)).toBeVisible();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/🇧🇷/)).not.toBeInTheDocument();
  });

  it('abre o listbox, marca a opcao atual e move o foco para ele', async () => {
    const user = userEvent.setup();
    render(<LanguageChoice legend="Idioma" value="pt-BR" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Idioma.*Portugu/ }));

    const listbox = screen.getByRole('listbox', { name: 'Idioma' });
    const selectedOption = screen.getByRole('option', { name: /Portugu/ });
    expect(listbox).toHaveFocus();
    expect(listbox).toHaveAttribute('aria-activedescendant', selectedOption.id);
    expect(screen.getAllByRole('option')).toHaveLength(8);
    expect(screen.getByRole('option', { name: /Portugu/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: /English/ })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('navega com setas, Home e End sem alterar ate confirmar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageChoice legend="Idioma" value="pt-BR" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Idioma.*Portugu/ }));
    const listbox = screen.getByRole('listbox');

    await user.keyboard('{ArrowDown}');
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /English/ }).id,
    );
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard('{End}');
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /中文/ }).id,
    );

    await user.keyboard('{Home}');
    expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /Portugu/ }).id,
    );
  });

  it('confirma com Enter, avisa o controlador e devolve o foco ao gatilho', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageChoice legend="Idioma" value="pt-BR" onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /Idioma.*Portugu/ });
    await user.click(trigger);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('en-US');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('confirma a opcao focada com Space', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageChoice legend="Idioma" value="pt-BR" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Idioma.*Portugu/ }));
    await user.keyboard('{ArrowDown}{Space}');

    expect(onChange).toHaveBeenCalledWith('en-US');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('fecha com Escape sem alterar a escolha e restaura o foco', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageChoice legend="Idioma" value="pt-BR" onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /Idioma.*Portugu/ });
    await user.click(trigger);
    await user.keyboard('{ArrowDown}{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('fecha ao tabular para fora e permite chegar ao proximo controle', async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageChoice legend="Idioma" value="pt-BR" onChange={vi.fn()} />
        <button type="button">Depois</button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: /Idioma.*Portugu/ }));
    await user.tab();

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Depois' })).toHaveFocus();
  });

  it('fecha ao clicar fora', async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageChoice legend="Idioma" value="pt-BR" onChange={vi.fn()} />
        <button type="button">Fora</button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: /Idioma.*Portugu/ }));
    await user.click(screen.getByRole('button', { name: 'Fora' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
