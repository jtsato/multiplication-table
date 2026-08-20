// @vitest-environment jsdom
// A cena R3F precisa de um `window` mesmo sem WebGL.
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PointLight } from 'three';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { dayNightClock, resetDayNightClock } from '../daynight/dayNightClock';
import { playerTransform, resetPlayerTransform } from '../player';
import { HOME } from '../home/home.logic';
import { LanternView } from './LanternView';
import { chargeRemaining } from './lantern.logic';

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
    // Acompanha o jogador de perto, mas nao no centro dele: dentro da capsula a
    // luz deixaria o personagem preto no meio do proprio facho.
    expect(Math.hypot(luz.position.x - 7, luz.position.z - -3)).toBeLessThan(1);
    // Acima da cabeca.
    expect(luz.position.y).toBeGreaterThan(1.5);
    // Atras do jogador, do lado da camera: com yaw = 0, atras e +Z. Na frente
    // ele ficaria em contraluz e viraria silhueta.
    expect(luz.position.z).toBeGreaterThan(-3);

    await renderer.unmount();
  });

  it('projeta sombra pequena com custo controlado', async () => {
    act(() => {
      state().rechargeLantern(1, dayNightClock.seconds);
    });

    const renderer = await renderScene(<LanternView />);
    await renderer.advanceFrames(2, 1 / 60);

    const luz = luzDa(renderer);
    expect(luz.castShadow).toBe(true);
    expect(luz.shadow.mapSize.x).toBe(256);
    expect(luz.shadow.mapSize.y).toBe(256);

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

describe('a lanterna em casa', () => {
  beforeEach(() => {
    state().resetLantern();
    state().resetEconomy();
    resetDayNightClock();
    resetPlayerTransform();
  });

  it('acende de graca ao entrar em casa, sem conta e sem moeda', async () => {
    const renderer = await renderScene(<LanternView />);
    playerTransform.x = HOME.position.x;
    playerTransform.z = HOME.position.z;
    await renderer.advanceFrames(30, 1 / 60);

    expect(chargeRemaining(state().lantern, dayNightClock.seconds)).toBeGreaterThan(0);
    expect(state().coins).toBe(0);

    await renderer.unmount();
  });

  it('a carga nao cai enquanto o jogador esta em casa', async () => {
    act(() => {
      state().rechargeLantern(1, dayNightClock.seconds);
    });
    const renderer = await renderScene(<LanternView />);
    playerTransform.x = HOME.position.x;
    playerTransform.z = HOME.position.z;

    const antes = chargeRemaining(state().lantern, dayNightClock.seconds);
    for (let i = 0; i < 60; i += 1) {
      dayNightClock.seconds += 1 / 60;
      await renderer.advanceFrames(1, 1 / 60);
    }

    expect(chargeRemaining(state().lantern, dayNightClock.seconds)).toBeGreaterThanOrEqual(antes);

    await renderer.unmount();
  });

  it('longe de casa a carga volta a cair', async () => {
    act(() => {
      state().rechargeLantern(1, dayNightClock.seconds);
    });
    const renderer = await renderScene(<LanternView />);
    playerTransform.x = 0;
    playerTransform.z = 0;

    const antes = chargeRemaining(state().lantern, dayNightClock.seconds);
    dayNightClock.seconds += 10;
    await renderer.advanceFrames(2, 1 / 60);

    expect(chargeRemaining(state().lantern, dayNightClock.seconds)).toBeLessThan(antes);

    await renderer.unmount();
  });
});
