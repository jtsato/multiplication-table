import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { GARDEN, gardenStatus } from './garden.logic';

const state = () => useGameStore.getState();

describe('garden.logic', () => {
  it('esta vazia sem plantio', () => {
    expect(gardenStatus({ planted: false, plantedDay: 0 }, 3)).toBe('empty');
  });

  it('cresce no mesmo dia do plantio', () => {
    expect(gardenStatus({ planted: true, plantedDay: 3 }, 3)).toBe('growing');
  });

  it('fica pronta no dia seguinte', () => {
    expect(gardenStatus({ planted: true, plantedDay: 3 }, 4)).toBe('ready');
  });
});

describe('garden.store', () => {
  beforeEach(() => {
    state().resetGarden();
    state().resetEconomy();
    state().resetResources();
  });

  it('plantar exige semente e debita uma', () => {
    useGameStore.setState({ seeds: 1, clock: { ...state().clock, day: 5 } });
    state().plantGarden();

    expect(state().seeds).toBe(0);
    expect(state().garden).toEqual({ planted: true, plantedDay: 5 });
  });

  it('sem semente, nao planta', () => {
    useGameStore.setState({ seeds: 0, clock: { ...state().clock, day: 5 } });
    state().plantGarden();

    expect(state().garden.planted).toBe(false);
  });

  it('nao planta por cima de uma horta ja plantada', () => {
    useGameStore.setState({ seeds: 2, clock: { ...state().clock, day: 5 } });
    state().plantGarden();
    state().plantGarden();

    expect(state().seeds).toBe(1);
  });

  it('colhe so quando esta pronta e entrega frutas', () => {
    useGameStore.setState({
      seeds: 1,
      clock: { ...state().clock, day: 5 },
      garden: { planted: true, plantedDay: 5 },
    });
    state().harvestGarden();
    expect(state().inventory.fruta).toBe(0);

    useGameStore.setState({ clock: { ...state().clock, day: 6 } });
    state().harvestGarden();

    expect(state().inventory.fruta).toBe(GARDEN.yield);
    expect(state().garden).toEqual({ planted: false, plantedDay: 0 });
  });
});
