// @vitest-environment jsdom
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { useGameStore } from '../../app/store';
import { KeyboardBridge } from '../../test/KeyboardBridge';
import { ShopPanel } from './ShopPanel';
import { SHOP_ITEMS } from './economy.logic';
import { emptyInventory } from '../resources/resources.logic';

const state = () => useGameStore.getState();

function montar() {
  return render(
    <>
      <KeyboardBridge />
      <ShopPanel />
    </>,
  );
}

function enriquecer() {
  act(() => {
    useGameStore.setState({
      coins: 200,
      inventory: { ...emptyInventory(), concha: 50, fruta: 50, pedra: 50 },
    });
  });
}

describe('ShopPanel', () => {
  beforeEach(() => {
    state().resetEconomy();
    state().resetResources();
    state().cancelChallenge();
  });

  it('nao renderiza nada com a loja fechada', () => {
    const { container } = montar();
    expect(container).toBeEmptyDOMElement();
  });

  it('abre e fecha pela tecla', async () => {
    montar();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL' }));
    });
    expect(screen.getByRole('dialog', { name: 'Loja' })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL' }));
    });
    expect(screen.queryByRole('dialog', { name: 'Loja' })).not.toBeInTheDocument();
  });

  it('nao abre com um desafio na tela', () => {
    act(() => {
      state().startChallenge(state().nodes[0]);
    });
    montar();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL' }));
    });

    expect(screen.queryByRole('dialog', { name: 'Loja' })).not.toBeInTheDocument();
  });

  it('mostra o custo de cada item e desabilita o que nao da para pagar', () => {
    act(() => state().toggleShop());
    montar();

    const botas = screen.getByRole('button', { name: /Botas/ });
    expect(botas).toBeDisabled();
    expect(botas).toHaveTextContent(`${SHOP_ITEMS.botas.coins} moedas`);
    // Diz o que falta, não só que não dá.
    expect(botas).toHaveTextContent(/Faltam moedas/);
  });

  it('comprar debita e marca o item como já comprado', async () => {
    enriquecer();
    act(() => state().toggleShop());
    montar();

    await userEvent.click(screen.getByRole('button', { name: /Botas/ }));

    expect(state().owned).toContain('botas');
    expect(state().coins).toBe(200 - SHOP_ITEMS.botas.coins);
    expect(screen.getByRole('button', { name: /Botas/ })).toHaveTextContent(/já tem/i);
  });

  it('a dica comprada aparece no estoque', async () => {
    enriquecer();
    act(() => state().toggleShop());
    montar();

    await userEvent.click(screen.getByRole('button', { name: /Dica/ }));

    expect(screen.getByText(/Dicas guardadas/)).toHaveTextContent('1');
  });

  it('o botao fechar fecha a loja', async () => {
    act(() => state().toggleShop());
    montar();

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(state().shopOpen).toBe(false);
  });
});
