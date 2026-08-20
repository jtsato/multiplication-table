// @vitest-environment jsdom
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { useGameStore } from '../../app/store';
import { SettingsPanel } from './SettingsPanel';

const state = () => useGameStore.getState();

function montar() {
  return render(<SettingsPanel />);
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    state().resetSettings();
    state().resetLocale();
  });

  it('não renderiza nada com as configurações fechadas', () => {
    montar();
    expect(screen.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument();
  });

  it('abre com volume, sensibilidade, idioma e tela cheia', () => {
    act(() => state().openSettings());
    montar();

    const dialogo = screen.getByRole('dialog', { name: 'Configurações' });
    expect(dialogo).toBeInTheDocument();
    expect(screen.getByLabelText('Volume')).toBeInTheDocument();
    expect(screen.getByLabelText('Sensibilidade da câmera')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar em tela cheia' })).toBeInTheDocument();
  });

  it('muda o volume e a sensibilidade pelo painel', async () => {
    act(() => state().openSettings());
    montar();

    fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '0.3' } });
    expect(state().volume).toBeCloseTo(0.3);

    fireEvent.change(screen.getByLabelText('Sensibilidade da câmera'), { target: { value: '1.8' } });
    expect(state().cameraSensitivity).toBeCloseTo(1.8);
  });

  it('troca o idioma pelo painel', async () => {
    act(() => state().openSettings());
    montar();

    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(state().locale).toBe('en-US');
  });

  it('o botão Fechar fecha o painel', async () => {
    act(() => state().openSettings());
    montar();

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument();
  });
});
