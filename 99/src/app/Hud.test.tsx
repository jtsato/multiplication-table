// @vitest-environment jsdom
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { LANTERN } from '../slices/lantern';
import { Hud } from './Hud';
import { useGameStore } from './store';
import { RESOURCE_LABELS, emptyInventory } from '../slices/resources/resources.logic';
import { gardenPlotForRegion } from '../slices/garden/garden.logic';

const state = () => useGameStore.getState();

function relogio(phase: 'dia' | 'entardecer' | 'noite' | 'amanhecer', secondsToNextPhase = 20) {
  act(() => {
    state().publishClock({ phase, day: 1, secondsToNextPhase });
  });
}

describe('Hud', () => {
  beforeEach(() => {
    state().resetResources();
    state().resetBuilding();
    state().resetClock();
    state().resetLantern();
    state().resetEconomy();
    state().setNearbySpot(null);
    state().cancelChallenge();
  });

  it('mostra a barra de carga da lanterna', () => {
    render(<Hud />);

    expect(screen.getByRole('meter', { name: /lanterna/i })).toBeInTheDocument();
  });

  it('nao mostra mais barra de vida nem aviso de perigo', () => {
    render(<Hud />);

    expect(screen.queryByRole('meter', { name: /vida/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/à espreita/i)).not.toBeInTheDocument();
  });

  it('a barra acompanha a carga publicada', () => {
    act(() => {
      state().publishLanternCharge(LANTERN.chargeSeconds);
    });
    render(<Hud />);

    expect(screen.getByRole('meter', { name: /lanterna/i })).toHaveAttribute(
      'aria-valuenow',
      String(LANTERN.chargeSeconds),
    );
  });

  it('no entardecer convida a acender a lanterna, sem ameacar', () => {
    relogio('entardecer', 12);
    render(<Hud />);

    const aviso = screen.getByRole('alert');
    expect(aviso).toHaveTextContent(/lanterna/i);
    expect(aviso.textContent).not.toMatch(/noite está chegando|perigo|monstro/i);
  });

  it('avisa quando a carga esta fraca durante a noite', () => {
    relogio('noite');
    act(() => {
      state().publishLanternCharge(LANTERN.lowChargeSeconds - 1);
    });
    render(<Hud />);

    expect(screen.getByText(/lanterna está fraca/i)).toBeInTheDocument();
  });

  it('nao avisa carga fraca de dia', () => {
    relogio('dia');
    act(() => {
      state().publishLanternCharge(0);
    });
    render(<Hud />);

    expect(screen.queryByText(/lanterna está fraca/i)).not.toBeInTheDocument();
  });
  it('mostra o total de moedas', () => {
    act(() => {
      state().rewardCorrect(2, 4);
    });
    render(<Hud />);

    expect(screen.getByLabelText(/moedas/i)).toHaveTextContent(String(state().coins));
  });

  it('mostra as moedas decompostas em dezenas', () => {
    act(() => {
      // 3 dezenas e 7 unidades.
      useGameStore.setState({ coins: 37 });
    });
    render(<Hud />);

    const moedas = screen.getByLabelText(/moedas/i);
    expect(moedas).toHaveTextContent('3');
    expect(moedas).toHaveTextContent('7');
  });

  it('nao mostra dezenas abaixo de dez', () => {
    act(() => {
      useGameStore.setState({ coins: 7 });
    });
    render(<Hud />);

    expect(screen.queryByTestId('hud-dezenas')).not.toBeInTheDocument();
  });

  it('convida a plantar quando um canteiro vazio esta perto', () => {
    act(() => {
      useGameStore.setState({
        seeds: 1,
        garden: [gardenPlotForRegion('pomar')],
        nearbyGardenId: 'canteiro-pomar',
      });
    });
    render(<Hud />);

    expect(screen.getByText('Aperte E para plantar')).toBeInTheDocument();
  });

  it('convida a colher quando o canteiro esta pronto', () => {
    act(() => {
      useGameStore.setState({
        garden: [{ ...gardenPlotForRegion('pomar'), planted: true, plantedDay: 1 }],
        nearbyGardenId: 'canteiro-pomar',
        clock: { ...state().clock, day: 2 },
      });
    });
    render(<Hud />);

    expect(screen.getByText('Aperte E para colher')).toBeInTheDocument();
  });

  /**
   * O convite da fogueira, do lado de quem le.
   *
   * `BuildingView` decide *quando* a fogueira esta ao alcance; aqui se prova que
   * o HUD **mostra** isso, e que nao mostra dois convites de E ao mesmo tempo.
   */
  it('convida a acender quando a fogueira apagada esta ao alcance', () => {
    relogio('noite');
    act(() => {
      useGameStore.setState({ nearbyCampfireId: 'fogueira-1' });
    });
    render(<Hud />);

    expect(screen.getByText('Aperte E para acender a fogueira')).toBeInTheDocument();
  });

  it('nao convida a acender sem fogueira ao alcance', () => {
    relogio('noite');
    render(<Hud />);

    expect(screen.queryByText('Aperte E para acender a fogueira')).not.toBeInTheDocument();
  });

  it('o recurso ao alcance ganha do convite da fogueira', () => {
    relogio('noite');
    act(() => {
      useGameStore.setState({
        nearbyCampfireId: 'fogueira-1',
        highlightedNodeId: state().nodes[0].id,
      });
    });
    render(<Hud />);

    expect(screen.getByText('Aperte E para colher')).toBeInTheDocument();
    expect(screen.queryByText('Aperte E para acender a fogueira')).not.toBeInTheDocument();
  });

  it('convida a usar o movel de casa ao alcance, dizendo qual e', () => {
    act(() => {
      useGameStore.setState({ nearbySpot: 'espelho' });
    });
    render(<Hud />);

    expect(screen.getByText('Aperte E para usar: Espelho')).toBeInTheDocument();
  });

  it('nao convida a usar movel nenhum longe deles', () => {
    render(<Hud />);

    expect(screen.queryByText(/Aperte E para usar/)).not.toBeInTheDocument();
  });

  it('o desafio aberto tira o convite do movel — o E pertence a conta', () => {
    act(() => {
      useGameStore.setState({ nearbySpot: 'espelho' });
      state().startChallenge(state().nodes[0]);
    });
    render(<Hud />);

    expect(screen.queryByText(/Aperte E para usar/)).not.toBeInTheDocument();
  });
});

describe('a lista de recursos', () => {
  beforeEach(() => {
    state().resetResources();
    state().resetRegions();
  });

  /**
   * Com nove tipos, listar todos deixaria sete zeros permanentes na tela. O que
   * aparece e o que a crianca tem mais o que da para colher onde ela esta — a
   * lista tambem conta o que a regiao oferece.
   */
  it('mostra a colheita da regiao onde a crianca esta', () => {
    render(<Hud />);
    // A praia da concha e madeira; peixe e do porto.
    expect(screen.getByText(RESOURCE_LABELS.concha.many)).toBeInTheDocument();
    expect(screen.queryByText(RESOURCE_LABELS.peixe.many)).not.toBeInTheDocument();
  });

  it('troca a lista ao mudar de regiao', () => {
    act(() => state().publishRegion('porto'));
    render(<Hud />);

    expect(screen.getByText(RESOURCE_LABELS.peixe.many)).toBeInTheDocument();
    expect(screen.queryByText(RESOURCE_LABELS.concha.many)).not.toBeInTheDocument();
  });

  it('o que ela ja tem continua visivel fora da regiao de origem', () => {
    act(() => {
      useGameStore.setState({ inventory: { ...emptyInventory(), concha: 3 } });
      state().publishRegion('porto');
    });
    render(<Hud />);

    expect(screen.getByText(RESOURCE_LABELS.concha.many)).toBeInTheDocument();
  });
});
