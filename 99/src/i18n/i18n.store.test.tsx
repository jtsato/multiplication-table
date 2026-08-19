// @vitest-environment jsdom
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { useGameStore } from '../app/store';
import { Hud } from '../app/Hud';
import { DEFAULT_LOCALE, bundleFor } from './index';

const state = () => useGameStore.getState();

describe('o idioma no store', () => {
  beforeEach(() => {
    state().resetLocale();
    state().resetRegions();
    state().resetEconomy();
    state().resetResources();
  });

  it('comeca no padrao', () => {
    expect(state().locale).toBe(DEFAULT_LOCALE);
    expect(state().text.strings.tagline).toBe('A ilha da tabuada');
  });

  it('trocar o idioma troca o pacote inteiro', () => {
    act(() => state().setLocale('en-US'));

    expect(state().locale).toBe('en-US');
    expect(state().text.strings.tagline).toBe('The times table island');
    expect(state().text.regions.praia).toBe('Beach');
    expect(state().text.resources.concha.item.many).toBe('shells');
  });

  /**
   * O pacote e o mesmo objeto enquanto o idioma nao muda. E o que faz um seletor
   * `state.text` nao repintar a tela a cada quadro — a mesma regra de igualdade
   * que o resto do store segue.
   */
  it('o pacote e estavel enquanto o idioma nao muda', () => {
    const antes = state().text;
    act(() => state().setLocale(DEFAULT_LOCALE));
    expect(state().text).toBe(antes);
  });

  it('um idioma desconhecido cai no padrao, sem quebrar', () => {
    act(() => state().setLocale('klingon' as never));
    expect(state().locale).toBe(DEFAULT_LOCALE);
  });

  it('bundleFor devolve o padrao para um idioma sem arquivo', () => {
    expect(bundleFor('ja-JP' as never).locale).toBe(DEFAULT_LOCALE);
  });
});

describe('a tela acompanha a troca', () => {
  beforeEach(() => {
    state().resetLocale();
    state().resetRegions();
    state().resetResources();
  });

  /**
   * O teste que prova a entrega: trocar o idioma repinta o HUD **sem recarregar
   * a pagina**. Se isto falhasse, a escolha so valeria na proxima partida.
   */
  it('o HUD repinta no idioma novo', () => {
    render(<Hud />);
    expect(screen.getByText('Praia')).toBeInTheDocument();

    act(() => state().setLocale('en-US'));

    expect(screen.getByText('Beach')).toBeInTheDocument();
    expect(screen.queryByText('Praia')).not.toBeInTheDocument();
  });

  it('a colheita da regiao tambem muda de idioma', () => {
    render(<Hud />);
    expect(screen.getByText('conchas')).toBeInTheDocument();

    act(() => state().setLocale('en-US'));
    expect(screen.getByText('shells')).toBeInTheDocument();
  });
});
