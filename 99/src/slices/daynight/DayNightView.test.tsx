import { beforeEach, describe, expect, it } from 'vitest';
import type { DirectionalLight } from 'three';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { DayNightView } from './DayNightView';
import { dayNightClock, resetDayNightClock } from './dayNightClock';
import { DAYNIGHT, PHASE_BOUNDS } from './daynight.logic';

const state = () => useGameStore.getState();

/**
 * Avanca o relogio do jogo em `segundos` de tempo simulado.
 *
 * Usa quadros de 50 ms — o teto que `DayNightView` aplica ao delta. Passos
 * maiores seriam truncados e o relogio andaria menos que o pedido.
 */
async function avancaSegundos(renderer: Awaited<ReturnType<typeof renderScene>>, segundos: number) {
  const passo = 0.05;
  await renderer.advanceFrames(Math.round(segundos / passo), passo);
}

describe('DayNightView', () => {
  beforeEach(() => {
    resetDayNightClock();
    state().resetClock();
  });

  it('monta as luzes do ciclo', async () => {
    const renderer = await renderScene(<DayNightView />);

    expect(renderer.scene.findAllByType('HemisphereLight')).toHaveLength(1);
    expect(renderer.scene.findAllByType('DirectionalLight')).toHaveLength(1);

    await renderer.unmount();
  });

  it('avanca o relogio vivo a cada quadro', async () => {
    const renderer = await renderScene(<DayNightView />);
    await avancaSegundos(renderer, 5);

    expect(dayNightClock.seconds).toBeCloseTo(5, 1);

    await renderer.unmount();
  });

  it('comeca de dia e chega ao entardecer, a noite e ao amanhecer', async () => {
    const renderer = await renderScene(<DayNightView />);
    expect(state().clock.phase).toBe('dia');

    await avancaSegundos(renderer, PHASE_BOUNDS.entardecer.start * DAYNIGHT.cycleSeconds + 1);
    expect(state().clock.phase).toBe('entardecer');

    await avancaSegundos(renderer, 0.15 * DAYNIGHT.cycleSeconds);
    expect(state().clock.phase).toBe('noite');

    await avancaSegundos(renderer, 0.27 * DAYNIGHT.cycleSeconds);
    expect(state().clock.phase).toBe('amanhecer');

    await renderer.unmount();
  });

  it('fecha o ciclo e vira o dia', async () => {
    const renderer = await renderScene(<DayNightView />);
    await avancaSegundos(renderer, DAYNIGHT.cycleSeconds + 2);

    expect(state().clock.phase).toBe('dia');
    expect(state().clock.day).toBe(2);

    await renderer.unmount();
  });

  it('escurece o ceu ao anoitecer e clareia ao amanhecer', async () => {
    const renderer = await renderScene(<DayNightView />);
    // `instance` vem tipado como `Object3D`; o renderizador de teste nao estreita
    // pelo nome do tipo consultado.
    const sol = () =>
      renderer.scene.findAllByType('DirectionalLight')[0].instance as unknown as DirectionalLight;

    await avancaSegundos(renderer, 1);
    const deDia = sol().intensity;

    await avancaSegundos(renderer, 0.85 * DAYNIGHT.cycleSeconds);
    const deNoite = sol().intensity;
    expect(deNoite).toBeLessThan(deDia);
    // Nunca apaga de vez: o jogo tem que continuar jogavel no escuro.
    expect(deNoite).toBeGreaterThan(0);

    await avancaSegundos(renderer, 0.14 * DAYNIGHT.cycleSeconds);
    expect(sol().intensity).toBeGreaterThan(deNoite);

    await renderer.unmount();
  });

  it('publica no store sem escrever a cada quadro', async () => {
    const renderer = await renderScene(<DayNightView />);

    let publicacoes = 0;
    const cancelar = useGameStore.subscribe(() => {
      publicacoes += 1;
    });

    // 2 segundos = 40 quadros de 50 ms. Com throttle de 4 Hz e a guarda de
    // segundo inteiro, isso tem que gerar pouquissimas notificacoes.
    await avancaSegundos(renderer, 2);
    cancelar();

    expect(publicacoes).toBeGreaterThan(0);
    expect(publicacoes).toBeLessThanOrEqual(8);

    await renderer.unmount();
  });

  it('conta o tempo que falta para a proxima fase', async () => {
    const renderer = await renderScene(<DayNightView />);
    await avancaSegundos(renderer, 1);

    const restante = state().clock.secondsToNextPhase;
    expect(restante).toBeGreaterThan(0);
    expect(restante).toBeLessThanOrEqual(PHASE_BOUNDS.dia.end * DAYNIGHT.cycleSeconds);

    await avancaSegundos(renderer, 5);
    expect(state().clock.secondsToNextPhase).toBeLessThan(restante);

    await renderer.unmount();
  });
});
