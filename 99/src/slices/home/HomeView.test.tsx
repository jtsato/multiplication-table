// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { Mesh, MeshLambertMaterial, PointLight } from 'three';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { dayNightClock, resetDayNightClock } from '../daynight/dayNightClock';
import { DAYNIGHT, PHASE_BOUNDS } from '../daynight/daynight.logic';
import { playerTransform, resetPlayerTransform } from '../player';
import { HomeView } from './HomeView';
import { HOME, HOME_SPOTS } from './home.logic';

const state = () => useGameStore.getState();

/** Leva o jogador a um ponto do mapa, sem fisica. */
function levarPara(x: number, z: number) {
  playerTransform.x = x;
  playerTransform.z = z;
}

/** `instance` vem como `Object3D`; o renderizador de teste nao estreita pelo tipo. */
function luzes(renderer: Awaited<ReturnType<typeof renderScene>>): PointLight[] {
  return renderer.scene
    .findAllByType('PointLight')
    .map((no) => no.instance as unknown as PointLight);
}

/** Opacidade do telhado — a unica malha transparente da cena. */
function opacidadeDoTelhado(renderer: Awaited<ReturnType<typeof renderScene>>): number {
  const telhado = renderer.scene
    .findAllByType('Mesh')
    .map((no) => no.instance as unknown as Mesh)
    .find((malha) => (malha.material as MeshLambertMaterial).transparent);
  expect(telhado).toBeDefined();
  return (telhado!.material as MeshLambertMaterial).opacity;
}

describe('HomeView', () => {
  beforeEach(() => {
    resetDayNightClock();
    resetPlayerTransform();
    state().setInsideHome(false);
    state().setNearbySpot(null);
  });

  it('monta a casa na cena', async () => {
    const renderer = await renderScene(<HomeView />);
    await renderer.advanceFrames(2, 1 / 60);

    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(5);
    // Duas luzes: a de dentro e o lampiao da porta.
    expect(renderer.scene.findAllByType('PointLight')).toHaveLength(2);

    await renderer.unmount();
  });

  it('o telhado fica opaco com o jogador do lado de fora', async () => {
    levarPara(0, 0);
    const renderer = await renderScene(<HomeView />);
    await renderer.advanceFrames(20, 1 / 60);

    expect(opacidadeDoTelhado(renderer)).toBeGreaterThan(0.9);

    await renderer.unmount();
  });

  it('o telhado abre quando o jogador entra', async () => {
    const renderer = await renderScene(<HomeView />);
    levarPara(HOME.position.x, HOME.position.z);
    // Interpolado, entao precisa de alguns quadros para chegar la.
    await renderer.advanceFrames(90, 1 / 60);

    expect(opacidadeDoTelhado(renderer)).toBeLessThan(0.3);

    await renderer.unmount();
  });

  it('publica que o jogador esta dentro e de que movel esta perto', async () => {
    const renderer = await renderScene(<HomeView />);
    levarPara(HOME_SPOTS.mural.x, HOME_SPOTS.mural.z);
    await renderer.advanceFrames(30, 1 / 60);

    expect(state().insideHome).toBe(true);
    expect(state().nearbySpot).toBe('mural');

    await renderer.unmount();
  });

  it('as janelas acendem quando escurece', async () => {
    const renderer = await renderScene(<HomeView />);
    await renderer.advanceFrames(2, 1 / 60);
    const deDia = luzes(renderer)[0].intensity;

    dayNightClock.seconds =
      ((PHASE_BOUNDS.noite.start + PHASE_BOUNDS.noite.end) / 2) * DAYNIGHT.cycleSeconds;
    await renderer.advanceFrames(2, 1 / 60);

    expect(luzes(renderer)[0].intensity).toBeGreaterThan(deDia);

    await renderer.unmount();
  });
});
