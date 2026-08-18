// @vitest-environment jsdom
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { useGameStore } from '../../app/store';
import { AvatarPanel } from '../avatar';
import { DAYNIGHT, PHASE_BOUNDS, cyclePosition, phaseFor } from '../daynight/daynight.logic';
import { dayNightClock, resetDayNightClock } from '../daynight/dayNightClock';
import { factKey } from '../economy';
import { BedPanel } from './BedPanel';
import { WallChart } from './WallChart';

const state = () => useGameStore.getState();

/** Domina uma tabuada inteira, como a economia registraria. */
function dominarTabuada(table: number) {
  const fatos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((factor) => factKey(table, factor));
  act(() => {
    useGameStore.setState((atual) => ({ knownFacts: [...atual.knownFacts, ...fatos] }));
  });
}

/** Coloca o jogador em frente a um móvel e abre o painel dele. */
function abrir(spot: 'espelho' | 'mural' | 'cama') {
  act(() => {
    state().setNearbySpot(spot);
    state().openNearbySpot();
  });
}

describe('painéis da casa', () => {
  beforeEach(() => {
    state().resetEconomy();
    state().resetAvatar();
    state().closeSpot();
    state().setNearbySpot(null);
    state().cancelChallenge();
    resetDayNightClock();
  });

  describe('mural da tabuada', () => {
    it('nao aparece longe do mural', () => {
      const { container } = render(<WallChart />);
      expect(container).toBeEmptyDOMElement();
    });

    it('mostra a grade inteira, de 1 a 10', () => {
      abrir('mural');
      render(<WallChart />);

      const grade = screen.getByRole('table');
      // 10 linhas de dados, cada uma com o cabecalho + 10 celulas.
      expect(grade.querySelectorAll('tbody tr')).toHaveLength(10);
      expect(grade.querySelectorAll('.chart__cell')).toHaveLength(100);
    });

    /**
     * A decisao pedagogica da fase: em casa, consultar e de graca. O numero
     * aparece mesmo sem estar dominado — esconde-lo transformaria o mural em
     * prova, que e o oposto de porto seguro.
     */
    it('mostra o resultado mesmo do que ainda nao foi dominado, e nao cobra nada', () => {
      abrir('mural');
      render(<WallChart />);

      expect(screen.getByLabelText('7 vezes 8 é 56')).toHaveTextContent('56');
      expect(state().coins).toBe(0);
      expect(state().hints).toBe(0);
    });

    it('marca como conhecido so o que ja foi resolvido', () => {
      act(() => {
        state().rewardCorrect(2, 4);
      });
      abrir('mural');
      render(<WallChart />);

      expect(screen.getByLabelText('2 vezes 4 é 8, você já sabe')).toHaveClass(
        'chart__cell--known',
      );
      expect(screen.getByLabelText('7 vezes 8 é 56')).not.toHaveClass('chart__cell--known');
    });

    it('conta quantos fatos ja foram dominados', () => {
      act(() => {
        state().rewardCorrect(2, 4);
      });
      abrir('mural');
      render(<WallChart />);

      // 2x4 e 4x2 sao a mesma descoberta, mas ocupam duas casas da grade.
      expect(screen.getByText(/de 100/)).toHaveTextContent('2 de 100');
    });

    it('fechar volta ao jogo', async () => {
      abrir('mural');
      render(<WallChart />);

      await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
      expect(state().openSpot).toBeNull();
    });
  });

  describe('espelho', () => {
    it('oferece as cores desde o comeco', () => {
      abrir('espelho');
      render(<AvatarPanel />);

      expect(screen.getByLabelText('Tom de pele 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Cor de roupa 8')).toBeInTheDocument();
    });

    it('escolher troca a aparencia na hora', async () => {
      abrir('espelho');
      render(<AvatarPanel />);

      await userEvent.click(screen.getByLabelText('Tom de pele 5'));
      await userEvent.click(screen.getByRole('button', { name: 'Menina' }));

      expect(state().avatar.skin).toBe(4);
      expect(state().avatar.silhouette).toBe('menina');
    });

    /** Nenhum item tem "de menino" ou "de menina" escrito nele. */
    it('as duas silhuetas oferecem exatamente as mesmas opcoes', async () => {
      abrir('espelho');
      const { unmount } = render(<AvatarPanel />);
      const comMenino = screen.getAllByRole('button').map((b) => b.textContent);
      unmount();

      act(() => state().setAvatar({ silhouette: 'menina' }));
      render(<AvatarPanel />);
      const comMenina = screen.getAllByRole('button').map((b) => b.textContent);

      expect(comMenina).toEqual(comMenino);
    });

    it('nao oferece acessorio que ainda nao foi conquistado', () => {
      abrir('espelho');
      render(<AvatarPanel />);

      expect(screen.getByRole('button', { name: 'Boné' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Coroa' })).not.toBeInTheDocument();
    });

    it('a coroa aparece quando a tabuada do 9 fica pronta', async () => {
      dominarTabuada(9);
      abrir('espelho');
      render(<AvatarPanel />);

      await userEvent.click(screen.getByRole('button', { name: 'Coroa' }));
      expect(state().avatar.head).toBe('coroa');
    });

    it('o store recusa vestir um acessorio nao conquistado', () => {
      act(() => state().setAvatar({ head: 'coroa' }));
      expect(state().avatar.head).toBe('nenhum');
    });
  });

  describe('cama', () => {
    it('dormir leva ao amanhecer', async () => {
      abrir('cama');
      render(<BedPanel />);

      await userEvent.click(screen.getByRole('button', { name: /Dormir/ }));

      expect(phaseFor(cyclePosition(dayNightClock.seconds))).toBe('amanhecer');
      expect(state().openSpot).toBeNull();
    });

    it('dormir ja no amanhecer leva ao amanhecer seguinte, e nao para tras', async () => {
      dayNightClock.seconds = (PHASE_BOUNDS.amanhecer.start + 0.01) * DAYNIGHT.cycleSeconds;
      const antes = dayNightClock.seconds;

      abrir('cama');
      render(<BedPanel />);
      await userEvent.click(screen.getByRole('button', { name: /Dormir/ }));

      expect(dayNightClock.seconds).toBeGreaterThan(antes);
      expect(phaseFor(cyclePosition(dayNightClock.seconds))).toBe('amanhecer');
    });

    it('"ainda nao" fecha sem mexer no relogio', async () => {
      const antes = dayNightClock.seconds;
      abrir('cama');
      render(<BedPanel />);

      await userEvent.click(screen.getByRole('button', { name: 'Ainda não' }));

      expect(dayNightClock.seconds).toBe(antes);
      expect(state().openSpot).toBeNull();
    });
  });

  it('nenhum painel abre com um desafio na tela', () => {
    act(() => {
      state().startChallenge(state().nodes[0]);
      state().setNearbySpot('mural');
      state().openNearbySpot();
    });

    expect(state().openSpot).toBeNull();
  });
});
