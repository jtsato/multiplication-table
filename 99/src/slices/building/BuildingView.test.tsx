// @vitest-environment jsdom
// BuildingView escuta B, C, Espaco e Esc em `window`.
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { DAYNIGHT, PHASE_BOUNDS } from '../daynight/daynight.logic';
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

/** Resolve o desafio de construção aberto pelo Espaço. */
function resolveBuildChallenge() {
  const desafio = state().activeChallenge;
  expect(desafio?.purpose).toBe('construir');
  act(() => {
    state().answerChallenge(desafio!.answer);
  });
}

/** Enche o inventário para os testes que não são sobre custo. */
function encheInventario() {
  act(() => {
    useGameStore.setState({
      inventory: { ...emptyInventory(), concha: 99, fruta: 99, pedra: 99 },
    });
  });
}

/**
 * Leva o jogador para um ponto onde a construção à frente dele é válida:
 * dentro da ilha e longe dos nós de recurso.
 */
function setDusk() {
  dayNightClock.seconds = PHASE_BOUNDS.entardecer.start * DAYNIGHT.cycleSeconds + 1;
}

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

  it('B só entra no modo fogueira ao entardecer e B de novo sai', async () => {
    const renderer = await renderScene(<BuildingView />);

    pressKey('KeyB');
    expect(state().buildMode).toBeNull();
    expect(state().buildError).toBe('fora-da-janela-da-fogueira');

    setDusk();
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
    resolveBuildChallenge();

    expect(state().structures).toHaveLength(1);
    expect(state().structures[0].kind).toBe('cerca');
    expect(state().inventory.concha).toBe(99 - STRUCTURES.cerca.recipe.concha!);
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
    resolveBuildChallenge();
    const primeira = state().structures[0];

    playerTransform.x = primeira.position.x + 5.4;
    playerTransform.z = primeira.position.z;
    playerTransform.yaw = Math.PI / 2;
    pressKey('KeyC');
    pressKey('Space');
    resolveBuildChallenge();

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
    resolveBuildChallenge();
    const primeira = state().structures[0];

    playerTransform.x = primeira.position.x + 5.4;
    playerTransform.z = primeira.position.z;
    playerTransform.yaw = Math.PI / 2;
    pressKey('KeyC');
    pressKey('Space');
    resolveBuildChallenge();

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
    resolveBuildChallenge();
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
    resolveBuildChallenge();
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
    resolveBuildChallenge();
    const primeira = state().structures[0];

    playerTransform.x = primeira.position.x + 4.4;
    playerTransform.z = primeira.position.z - 1;
    playerTransform.yaw = Math.PI / 2;
    pressKey('KeyC');
    pressKey('Space');
    resolveBuildChallenge();

    expect(state().structures).toHaveLength(2);
    expect(state().structures[1].position.x).toBeCloseTo(primeira.position.x + 1);
    expect(state().structures[1].position.z).toBeCloseTo(primeira.position.z - 1);
    expect(state().structures[1].rotation).toBeCloseTo(Math.PI / 2);

    await renderer.unmount();
  });

  it('sem recursos nao constroi nem debita nada', async () => {
    posicionaEmLocalLivre();
    setDusk();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyB');
    pressKey('Space');

    expect(state().structures).toHaveLength(0);
    expect(state().inventory).toEqual({ ...emptyInventory(), concha: 0, fruta: 0, pedra: 0 });
    expect(state().buildError).toBe('sem-recursos');

    await renderer.unmount();
  });

  it('recusa construir uma fogueira sobre outra construcao', async () => {
    posicionaEmLocalLivre();
    setDusk();
    encheInventario();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');
    resolveBuildChallenge();
    const conchaDepoisDaPrimeira = state().inventory.concha;

    // A fogueira na mesma posicao nao pode usar o encaixe exclusivo da cerca.
    pressKey('KeyB');
    pressKey('Space');

    expect(state().structures).toHaveLength(1);
    expect(state().buildError).toBe('sobreposta');
    expect(state().inventory.concha).toBe(conchaDepoisDaPrimeira);

    await renderer.unmount();
  });

  it('recusa construir fora da ilha', async () => {
    setDusk();
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

  it('Espaço abre o desafio de construção antes de erguer', async () => {
    posicionaEmLocalLivre();
    encheInventario();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');

    expect(state().structures).toHaveLength(0);
    expect(state().activeChallenge?.purpose).toBe('construir');
    expect(state().pendingBuild?.kind).toBe('cerca');

    await renderer.unmount();
  });

  it('errar o desafio de construção não ergue e permite tentar de novo', async () => {
    posicionaEmLocalLivre();
    encheInventario();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyC');
    pressKey('Space');
    const desafio = state().activeChallenge!;
    const errada = desafio.options.find((opcao) => opcao !== desafio.answer)!;
    act(() => {
      state().answerChallenge(errada);
    });

    expect(state().structures).toHaveLength(0);
    expect(state().buildMode).toBe('cerca');
    expect(state().pendingBuild).not.toBeNull();

    // Tentar de novo: o mesmo Espaço reabre a conta e o acerto ergue a cerca.
    pressKey('Space');
    resolveBuildChallenge();
    expect(state().structures).toHaveLength(1);
    expect(state().buildMode).toBeNull();

    await renderer.unmount();
  });

  it('a fogueira nasce acesa e apaga quando o combustivel acaba', async () => {
    posicionaEmLocalLivre();
    encheInventario();
    resetDayNightClock();
    setDusk();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyB');
    pressKey('Space');
    resolveBuildChallenge();

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
    setDusk();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyB');
    pressKey('Space');
    resolveBuildChallenge();
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
      setDusk();
      encheInventario();
      posicionaEmLocalLivre();
      pressKey('KeyB');
      pressKey('Space');
      resolveBuildChallenge();
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
    setDusk();
    const renderer = await renderScene(<BuildingView />);
    encheInventario();
    posicionaEmLocalLivre();
    pressKey('KeyB');
    pressKey('Space');
    resolveBuildChallenge();

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
    setDusk();
    encheInventario();
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    expect(renderer.scene.findAllByType('PointLight')).toHaveLength(0);

    pressKey('KeyB');
    pressKey('Space');
    resolveBuildChallenge();
    await renderer.advanceFrames(1, 1 / 60);

    expect(renderer.scene.findAllByType('PointLight')).toHaveLength(1);

    await renderer.unmount();
  });
});

/**
 * O convite da fogueira.
 *
 * A acao de acender ja existia e funcionava; o que faltava era **dizer** que ela
 * existe. `nearbyCampfireId` estava declarado no store e nunca era escrito, e o
 * HUD do desktop nao tinha como oferecer nada — a crianca so descobria apertando
 * E na sorte. Estes testes prendem as tres condicoes que a spec pede: distancia,
 * estado da fogueira e periodo do dia.
 */
describe('o aviso da fogueira ao alcance', () => {
  beforeEach(() => {
    state().resetResources();
    state().resetBuilding();
    state().cancelChallenge();
    state().clearFeedback();
    resetPlayerTransform();
    resetDayNightClock();
  });

  /** Fogueira de pe ao lado do jogador, com o combustivel que o teste pedir. */
  function fogueiraAoLado(fuelUntil: number) {
    act(() => {
      useGameStore.setState({
        structures: [
          {
            id: 'fogueira-teste',
            kind: 'fogueira' as const,
            position: { x: playerTransform.x, y: 0, z: playerTransform.z },
            rotation: 0,
            fuelUntil,
          },
        ],
      });
    });
  }

  function setNight() {
    dayNightClock.seconds = PHASE_BOUNDS.noite.start * DAYNIGHT.cycleSeconds + 1;
  }

  it('a noite, perto da fogueira apagada, oferece acender', async () => {
    setNight();
    fogueiraAoLado(0);
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    expect(state().nearbyCampfireId).toBe('fogueira-teste');

    await renderer.unmount();
  });

  it('de dia nao oferece, mesmo colado na fogueira apagada', async () => {
    resetDayNightClock();
    fogueiraAoLado(0);
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    expect(state().nearbyCampfireId).toBeNull();

    await renderer.unmount();
  });

  /**
   * Fogueira no teto do combustivel nao tem o que receber. `nearestRefuelable`
   * ja recusava, e este caso prende a regra na publicacao: oferecer "acender"
   * para um fogo que nao aceita lenha e prometer o que nao acontece.
   */
  it('fogueira ja cheia nao pede para ser acesa de novo', async () => {
    setNight();
    fogueiraAoLado(dayNightClock.seconds + BUILDING.fireFuelSeconds * 2);
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);

    expect(state().nearbyCampfireId).toBeNull();

    await renderer.unmount();
  });

  it('o aviso some ao sair do alcance', async () => {
    setNight();
    fogueiraAoLado(0);
    const renderer = await renderScene(<BuildingView />);
    await renderer.advanceFrames(1, 1 / 60);
    expect(state().nearbyCampfireId).toBe('fogueira-teste');

    // Longe o bastante para sair do alcance de abastecer.
    playerTransform.x += BUILDING.refuelRange + 2;
    await renderer.advanceFrames(1, 1 / 60);

    expect(state().nearbyCampfireId).toBeNull();

    await renderer.unmount();
  });

  /**
   * Nao pode haver dois convites na tela ao mesmo tempo.
   *
   * O no de recurso tem prioridade — e a mesma ordem que a acao `interagir` ja
   * seguia. Sem esta guarda, a crianca leria "aperte E para colher" e "aperte E
   * para acender a fogueira" juntos, sem saber qual dos dois E faria.
   */
  it('cede a vez para o recurso ao alcance', async () => {
    setNight();
    const no = state().nodes[0];
    playerTransform.x = no.position.x;
    playerTransform.z = no.position.z;
    fogueiraAoLado(0);

    const renderer = await renderScene(<BuildingView />);
    act(() => {
      state().setHighlightedNodeId(no.id);
    });
    await renderer.advanceFrames(1, 1 / 60);

    expect(state().nearbyCampfireId).toBeNull();

    await renderer.unmount();
  });
});
