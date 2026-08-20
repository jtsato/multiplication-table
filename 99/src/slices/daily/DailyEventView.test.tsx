// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { DailyEventView } from './DailyEventView';
import { eventForDay, type DailyEventKind } from './daily.logic';

function diaCom(kind: DailyEventKind): number {
  for (let day = 1; day <= 500; day += 1) {
    if (eventForDay(day).kind === kind) return day;
  }
  throw new Error(`dia com evento ${kind} não encontrado`);
}

function mudarDia(day: number): void {
  act(() => {
    useGameStore.setState({ clock: { ...useGameStore.getState().clock, day } });
  });
}

describe('DailyEventView', () => {
  it('dia de chuva renderiza a cortina de água', async () => {
    const renderer = await renderScene(<DailyEventView />);
    mudarDia(diaCom('chuva'));
    await renderer.advanceFrames(1, 1 / 60);

    expect(renderer.scene.findAllByType('Points').length).toBeGreaterThan(0);

    await renderer.unmount();
  });

  it('dia de visitante renderiza o barco no Porto', async () => {
    const renderer = await renderScene(<DailyEventView />);
    mudarDia(diaCom('visitante'));
    await renderer.advanceFrames(1, 1 / 60);

    const barcos = renderer.scene
      .findAllByType('Group')
      .filter((grupo) => (grupo.instance as { name?: string }).name === 'barco-visitante');
    expect(barcos.length).toBeGreaterThan(0);

    await renderer.unmount();
  });

  it('dia comum não renderiza evento nenhum', async () => {
    const renderer = await renderScene(<DailyEventView />);
    mudarDia(diaCom('dia-comum'));
    await renderer.advanceFrames(1, 1 / 60);

    expect(renderer.scene.findAllByType('Points')).toHaveLength(0);
    const barcos = renderer.scene
      .findAllByType('Group')
      .filter((grupo) => (grupo.instance as { name?: string }).name === 'barco-visitante');
    expect(barcos).toHaveLength(0);

    await renderer.unmount();
  });
});
