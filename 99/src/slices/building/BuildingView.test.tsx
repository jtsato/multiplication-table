// @vitest-environment jsdom
// BuildingView escuta B, C, Espaco e Esc em `window`.
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { dayNightClock, resetDayNightClock } from '../daynight/dayNightClock';
import { playerTransform, resetPlayerTransform } from '../player';
import { BuildingView } from './BuildingView';
import { BUILDING, STRUCTURES, fuelRemaining, isLit, placementPosition } from './building.logic';
import { emptyInventory } from '../resources/resources.logic';

const state = () => useGameStore.getState();

function pressKey(code: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  });
}

/** Enche o inventário para os testes que não são sobre custo. */
function encheInventario() {
  act(() => {
    useGameStore.setState({
      inventory: { ...emptyInventory(), madeira: 99, fruta: 99, pedra: 99 },
    });
  });
}

/**
 * Leva o jogador para um ponto onde a construção à frente dele é válida:
 * dentro da ilha e longe dos nós de recurso.
 */
function posicionaEmLocalLivre() {
  const alvoValido = state().nodes.every((node) => {
    const alvo = placementPosition({ x: 0, y: 0, z: 0 }, 0);
    return Math.hypot(alvo.x - node.position.x, alvo.z - node.position.z) > 4;
  });
  expect(alvoValido).toBe(true);
  resetPlayerTransform();
}

describe('BuildingView', () => {
  beforeEach(() => {
    state().resetResources();
    state().resetBuilding();
    state().cancelChallenge();
    state().clearFeedback();
    resetPlayerTransform();
    resetDayNightClock();
  });

  it('B entra no modo fogueira e B de novo sai', async () => {
    const renderer = await renderScene(<BuildingView />);

    pressKey('KeyB');
    expect(state().buildMode).toBe('fogueira');
    pressKey('KeyB');
    expect(state().buildMode).toBeNull();

    await renderer.unmount();
  });

  it('C entra no modo cerca e Esc sai', async () => {
    const renderer = await renderScene(<BuildingView />);

    pressKey('KeyC');
    expect(state().buildMode).toBe('cerca');
    pressKey('Escape');
    expect(state().buildMode).toBeNull();

    await renderer.unmount();
  });

  it('trocar de estrutura substitui o modo em vez de acumular', async () => {
    const renderer = await renderScene(<BuildingView />);

    pressKey('KeyB');
    pressKey('KeyC');
    expect(state().buildMode).toBe('cerca');

    await renderer.unmount();
  });

  it('constroi uma cerca, debita o custo e sai do modo', async () => {
    posicionaEmLocalLivre();
    encheInventario();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');

    expect(state().structures).toHaveLength(1);
    expect(state().structures[0].kind).toBe('cerca');
    expect(state().inventory.madeira).toBe(99 - STRUCTURES.cerca.recipe.madeira!);
    expect(state().buildMode).toBeNull();

    await renderer.unmount();
  });

  it('confirma a segunda cerca encaixada na ponta da primeira', async () => {
    encheInventario();
    act(() => useGameStore.setState({ nodes: [] }));
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');
    const primeira = state().structures[0];

    playerTransform.x = primeira.position.x + 5.4;
    playerTransform.z = primeira.position.z;
    playerTransform.yaw = Math.PI / 2;
    pressKey('KeyC');
    pressKey('Space');

    expect(state().structures).toHaveLength(2);
    expect(state().structures[1].position.x).toBeCloseTo(primeira.position.x + 2);
    expect(state().structures[1].position.z).toBeCloseTo(primeira.position.z);

    await renderer.unmount();
  });

  it('confirma a segunda cerca com a rotacao encaixada', async () => {
    encheInventario();
    act(() => useGameStore.setState({ nodes: [] }));
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');
    const primeira = state().structures[0];

    playerTransform.x = primeira.position.x + 5.4;
    playerTransform.z = primeira.position.z;
    playerTransform.yaw = Math.PI / 2;
    pressKey('KeyC');
    pressKey('Space');

    expect(state().structures[1].rotation).toBeCloseTo(0);

    await renderer.unmount();
  });

  it('confirma a cerca com a transformacao resolvida pelo fantasma', async () => {
    encheInventario();
    act(() => useGameStore.setState({ nodes: [] }));
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');
    const primeira = state().structures[0];

    playerTransform.x = primeira.position.x + 5.4;
    playerTransform.z = primeira.position.z;
    playerTransform.yaw = Math.PI / 2;
    pressKey('KeyC');
    await renderer.advanceFrames(1, 1 / 60);

    const fantasma = renderer.scene
      .findAllByType('Group')
      .find((group) => group.instance.name === 'fantasma-construcao');
    expect(fantasma).toBeDefined();
    const previa = fantasma!.instance;

    pressKey('Space');
    const confirmada = state().structures[1];

    expect(confirmada.position.x).toBeCloseTo(previa.position.x);
    expect(confirmada.position.y).toBeCloseTo(previa.position.y);
    expect(confirmada.position.z).toBeCloseTo(previa.position.z);
    expect(confirmada.rotation).toBeCloseTo(previa.rotation.y);

    await renderer.unmount();
  });

  it('confirma uma cerca encaixada em um canto de 90 graus', async () => {
    encheInventario();
    act(() => useGameStore.setState({ nodes: [] }));
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');
    const primeira = state().structures[0];

    playerTransform.x = primeira.position.x + 4.4;
    playerTransform.z = primeira.position.z - 1;
    playerTransform.yaw = Math.PI / 2;
    pressKey('KeyC');
    pressKey('Space');

    expect(state().structures).toHaveLength(2);
    expect(state().structures[1].position.x).toBeCloseTo(primeira.position.x + 1);
    expect(state().structures[1].position.z).toBeCloseTo(primeira.position.z - 1);
    expect(state().structures[1].rotation).toBeCloseTo(Math.PI / 2);

    await renderer.unmount();
  });

  it('sem recursos nao constroi nem debita nada', async () => {
    posicionaEmLocalLivre();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyB');
    pressKey('Space');

    expect(state().structures).toHaveLength(0);
    expect(state().inventory).toEqual({ ...emptyInventory(), madeira: 0, fruta: 0, pedra: 0 });
    expect(state().buildError).toBe('sem-recursos');

    await renderer.unmount();
  });

  it('recusa construir uma fogueira sobre outra construcao', async () => {
    posicionaEmLocalLivre();
    encheInventario();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');
    const madeiraDepoisDaPrimeira = state().inventory.madeira;

    // A fogueira na mesma posicao nao pode usar o encaixe exclusivo da cerca.
    pressKey('KeyB');
    pressKey('Space');

    expect(state().structures).toHaveLength(1);
    expect(state().buildError).toBe('sobreposta');
    expect(state().inventory.madeira).toBe(madeiraDepoisDaPrimeira);

    await renderer.unmount();
  });

  it('recusa construir fora da ilha', async () => {
    encheInventario();
    const renderer = await renderScene(<BuildingView />);

    // Bem na borda, olhando para fora.
    playerTransform.x = 0;
    playerTransform.z = -29;
    playerTransform.yaw = 0;
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyB');
    pressKey('Space');

    expect(state().structures).toHaveLength(0);
    expect(state().buildError).toBe('fora-da-ilha');

    await renderer.unmount();
  });

  it('Espaco fora do modo construcao nao faz nada', async () => {
    encheInventario();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('Space');

    expect(state().structures).toHaveLength(0);
    expect(state().buildError).toBeNull();

    await renderer.unmount();
  });

  it('a fogueira nasce acesa e apaga quando o combustivel acaba', async () => {
    posicionaEmLocalLivre();
    encheInventario();
    resetDayNightClock();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyB');
    pressKey('Space');

    const fogueira = state().structures[0];
    expect(isLit(fogueira, dayNightClock.seconds)).toBe(true);
    expect(fuelRemaining(fogueira, dayNightClock.seconds)).toBeCloseTo(BUILDING.fireFuelSeconds);

    // O combustivel e um prazo: adiantar o relogio ja apaga o fogo, sem
    // nenhuma escrita por quadro no store.
    dayNightClock.seconds += BUILDING.fireFuelSeconds + 1;
    expect(isLit(fogueira, dayNightClock.seconds)).toBe(false);

    await renderer.unmount();
  });

  it('E perto da fogueira abre o desafio de abastecer — o fecho do loop', async () => {
    posicionaEmLocalLivre();
    encheInventario();
    resetDayNightClock();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyB');
    pressKey('Space');
    const fogueira = state().structures[0];

    // Encosta na fogueira e deixa o fogo quase acabar.
    playerTransform.x = fogueira.position.x;
    playerTransform.z = fogueira.position.z;
    dayNightClock.seconds += BUILDING.fireFuelSeconds - 5;

    pressKey('KeyE');

    expect(state().activeChallenge?.purpose).toBe('abastecer');
    expect(state().activeChallenge?.targetId).toBe(fogueira.id);

    await renderer.unmount();
  });

  it('acertar o desafio de lenha renova o fogo; errar renova menos', async () => {
    resetDayNightClock();
    const renderer = await renderScene(<BuildingView />);

    const criaFogueira = () => {
      encheInventario();
      posicionaEmLocalLivre();
      pressKey('KeyB');
      pressKey('Space');
      return state().structures.at(-1)!;
    };

    const fogueira = criaFogueira();
    playerTransform.x = fogueira.position.x;
    playerTransform.z = fogueira.position.z;
    dayNightClock.seconds += BUILDING.fireFuelSeconds - 4;

    pressKey('KeyE');
    const desafio = state().activeChallenge!;
    act(() => {
      state().answerChallenge(desafio.answer);
    });

    const depoisDoAcerto = fuelRemaining(
      state().structures.find((s) => s.id === fogueira.id)!,
      dayNightClock.seconds,
    );
    expect(depoisDoAcerto).toBeGreaterThan(BUILDING.fireFuelSeconds * 0.9);

    await renderer.unmount();
  });

  it('errar o desafio de lenha rende menos fogo que acertar', async () => {
    resetDayNightClock();
    const renderer = await renderScene(<BuildingView />);
    encheInventario();
    posicionaEmLocalLivre();
    pressKey('KeyB');
    pressKey('Space');

    const fogueira = state().structures.at(-1)!;
    playerTransform.x = fogueira.position.x;
    playerTransform.z = fogueira.position.z;
    dayNightClock.seconds += BUILDING.fireFuelSeconds - 2;

    pressKey('KeyE');
    const desafio = state().activeChallenge!;
    const errada = desafio.options.find((o) => o !== desafio.answer)!;
    act(() => {
      state().answerChallenge(errada);
    });

    const combustivel = fuelRemaining(
      state().structures.find((s) => s.id === fogueira.id)!,
      dayNightClock.seconds,
    );
    // Errar ainda acende alguma coisa — nunca deixa a crianca no escuro.
    expect(combustivel).toBeGreaterThan(0);
    expect(combustivel).toBeLessThan(BUILDING.fireFuelSeconds * 0.9);

    await renderer.unmount();
  });

  it('a fogueira construida entra na cena com a sua luz', async () => {
    posicionaEmLocalLivre();
    encheInventario();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    expect(renderer.scene.findAllByType('PointLight')).toHaveLength(0);

    pressKey('KeyB');
    pressKey('Space');
    await renderer.advanceFrames(1, 1 / 60);

    expect(renderer.scene.findAllByType('PointLight')).toHaveLength(1);

    await renderer.unmount();
  });
});
