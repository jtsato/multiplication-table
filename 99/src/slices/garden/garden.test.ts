import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { eventForDay, harvestMultiplier } from '../daily/daily.logic';
import { playerTransform, resetPlayerTransform } from '../player';
import { REGIONS, regionAt } from '../regions/regions.logic';
import { emptyInventory } from '../resources/resources.logic';
import {
  GARDEN,
  gardenPlotForRegion,
  gardenPosition,
  gardenStatus,
  type GardenPlot,
} from './garden.logic';

const state = () => useGameStore.getState();

function dayWithout(kind: 'chuva' | 'fartura'): number {
  for (let day = 1; day <= 100; day += 1) {
    if (eventForDay(day).kind !== kind) return day;
  }
  throw new Error(`nenhum dia sem ${kind}`);
}

describe('garden.logic', () => {
  it('cria o canteiro inicial vazio no Pomar', () => {
    const plot = gardenPlotForRegion('pomar');
    expect(plot).toMatchObject({ crop: 'fruta', table: 6, planted: false, plantedDay: 0 });
  });

  it('classifica um canteiro vazio, crescendo e pronto', () => {
    const plot = gardenPlotForRegion('pomar');
    expect(gardenStatus(plot, 3)).toBe('empty');
    expect(gardenStatus({ ...plot, planted: true, plantedDay: 3 }, 3)).toBe('growing');
    expect(gardenStatus({ ...plot, planted: true, plantedDay: 3 }, 4)).toBe('ready');
  });

  it('posiciona um canteiro dentro de cada regiao', () => {
    for (const region of REGIONS) {
      expect(regionAt(gardenPosition(region.id))?.id).toBe(region.id);
    }
  });
});

describe('garden.store', () => {
  beforeEach(() => {
    state().resetGarden();
    state().resetEconomy();
    state().resetResources();
    resetPlayerTransform();
  });

  it('planta o canteiro do Pomar e debita uma semente', () => {
    const dia = dayWithout('chuva');
    useGameStore.setState({ seeds: 1, clock: { ...state().clock, day: dia } });
    state().setNearbyGarden('canteiro-pomar');
    state().plantGarden();

    expect(state().seeds).toBe(0);
    expect(state().garden[0]).toMatchObject({ planted: true, plantedDay: dia, crop: 'fruta' });
  });

  it('planta um canteiro novo em qualquer regiao', () => {
    useGameStore.setState({
      seeds: 1,
      nodes: [],
      structures: [],
    });
    playerTransform.x = 36;
    playerTransform.z = 0;
    playerTransform.yaw = 0;
    state().plantGardenAtPlayer();

    const plot = state().garden.find((candidate) => candidate.id !== 'canteiro-pomar')!;
    expect(plot).toMatchObject({ planted: true, crop: 'peixe', table: 3 });
    expect(regionAt(plot.position)?.id).toBe('porto');
    expect(state().seeds).toBe(0);
  });

  it('nao planta sem semente nem por cima de canteiro plantado', () => {
    useGameStore.setState({ seeds: 1, clock: { ...state().clock, day: 5 } });
    state().setNearbyGarden('canteiro-pomar');
    state().plantGarden();
    state().plantGarden();

    expect(state().seeds).toBe(0);
    expect(state().garden[0].planted).toBe(true);
  });

  it('a chuva deixa o canteiro pronto no mesmo dia', () => {
    const dia = dayWithout('chuva') + 1;
    let chuva = dia;
    while (eventForDay(chuva).kind !== 'chuva') chuva += 1;
    useGameStore.setState({ seeds: 1, clock: { ...state().clock, day: chuva } });
    state().setNearbyGarden('canteiro-pomar');
    state().plantGarden();

    expect(gardenStatus(state().garden[0], chuva)).toBe('ready');
  });

  it('colhe o recurso do canteiro, nao sempre fruta', () => {
    const dia = dayWithout('fartura');
    const plot: GardenPlot = {
      ...gardenPlotForRegion('praia'),
      id: 'canteiro-praia',
      planted: true,
      plantedDay: dia,
    };
    useGameStore.setState({
      garden: [plot],
      clock: { ...state().clock, day: dia + 1 },
      inventory: emptyInventory(),
    });
    state().setNearbyGarden(plot.id);
    state().harvestGarden();

    expect(state().inventory.concha).toBe(GARDEN.yield * harvestMultiplier(eventForDay(dia + 1).kind));
    expect(state().inventory.fruta).toBe(0);
    expect(state().garden[0].planted).toBe(false);
  });

  it('o dia de fartura dobra a colheita', () => {
    let dia = 1;
    while (eventForDay(dia).kind !== 'fartura') dia += 1;
    const plot = { ...gardenPlotForRegion('pomar'), planted: true, plantedDay: dia - 1 };
    useGameStore.setState({ garden: [plot], clock: { ...state().clock, day: dia }, inventory: emptyInventory() });
    state().setNearbyGarden(plot.id);
    state().harvestGarden();

    expect(state().inventory.fruta).toBe(GARDEN.yield * 2);
  });

  it('resetar volta ao canteiro inicial vazio', () => {
    state().setNearbyGarden('canteiro-pomar');
    useGameStore.setState({ seeds: 1 });
    state().plantGarden();
    state().resetGarden();

    expect(state().garden).toEqual([gardenPlotForRegion('pomar')]);
    expect(state().nearbyGardenId).toBeNull();
  });
});
