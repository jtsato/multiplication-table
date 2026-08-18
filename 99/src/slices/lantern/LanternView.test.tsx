// @vitest-environment jsdom
// A cena R3F precisa de um `window` mesmo sem WebGL.
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PointLight } from 'three';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { dayNightClock, resetDayNightClock } from '../daynight/dayNightClock';
import { playerTransform, resetPlayerTransform } from '../player';
import { LanternView } from './LanternView';

const state = () => useGameStore.getState();

/**
 * A unica `pointLight` da cena — a lanterna e a unica coisa montada aqui.
 *
 * `instance` vem tipado como `Object3D`; o renderizador de teste nao estreita
 * pelo tipo do no, entao a conversao e necessaria.
 */
const luzDa = (renderer: Awaited<ReturnType<typeof renderScene>>) =>
  renderer.scene.findByType('PointLight').instance as unknown as PointLight;

describe('LanternView', () => {
  beforeEach(() => {
    state().resetLantern();
    resetDayNightClock();
    resetPlayerTransform();
  });

  it('nao ilumina nada com a lanterna apagada', async () => {
    const renderer = await renderScene(<LanternView />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(luzDa(renderer).intensity).toBe(0);

    await renderer.unmount();
  });

  it('acende com carga e acompanha o jogador', async () => {
    act(() => {
      state().rechargeLantern(1, dayNightClock.seconds);
    });

    const renderer = await renderScene(<LanternView />);
    playerTransform.x = 7;
    playerTransform.z = -3;
    await renderer.advanceFrames(2, 1 / 60);

    const luz = luzDa(renderer);
    expect(luz.intensity).toBeGreaterThan(0);
    expect(luz.position.x).toBeCloseTo(7);
    expect(luz.position.z).toBeCloseTo(-3);

    await renderer.unmount();
  });

  it('apaga sozinha quando a carga acaba, sem passar pelo store', async () => {
    act(() => {
      state().rechargeLantern(1, dayNightClock.seconds);
    });

    const renderer = await renderScene(<LanternView />);
    await renderer.advanceFrames(2, 1 / 60);
    expect(luzDa(renderer).intensity).toBeGreaterThan(0);

    // So o relogio anda: nenhuma acao do store e chamada.
    dayNightClock.seconds += 999;
    await renderer.advanceFrames(2, 1 / 60);

    expect(luzDa(renderer).intensity).toBe(0);

    await renderer.unmount();
  });
});
