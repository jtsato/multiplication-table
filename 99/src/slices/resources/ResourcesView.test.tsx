// @vitest-environment jsdom
// ResourcesView escuta a tecla E em `window`.
import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { useGameStore } from '../../app/store';
import { renderScene } from '../../test/sceneHarness';
import { playerTransform, resetPlayerTransform } from '../player';
import { ResourcesView } from './ResourcesView';
import { RESOURCE_KINDS, fullYield, itemPlacements } from './resources.logic';
import { emptyInventory } from './resources.logic';
import { vec3 } from '../../shared/vec';

const state = () => useGameStore.getState();

/** Teleporta o jogador para junto de um no, sem precisar de fisica. */
function standNextTo(nodeId: string) {
  const node = state().nodes.find((candidate) => candidate.id === nodeId)!;
  playerTransform.x = node.position.x;
  playerTransform.y = node.position.y;
  playerTransform.z = node.position.z;
  return node;
}

function pressKey(code: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  });
}

/**
 * Teste de integracao da fatia: percorre o caminho real de coleta — aproximar,
 * destacar, apertar E, creditar o inventario — pelos mesmos componentes e
 * eventos que o navegador usa.
 */
describe('ResourcesView', () => {
  beforeEach(() => {
    state().resetResources();
    state().cancelChallenge();
    state().clearFeedback();
    resetPlayerTransform();
  });

  it('destaca o no mais proximo quando o jogador se aproxima', async () => {
    const alvo = standNextTo(state().nodes[0].id);
    const renderer = await renderScene(<ResourcesView />);

    await renderer.advanceFrames(1, 1 / 60);
    expect(state().highlightedNodeId).toBe(alvo.id);

    await renderer.unmount();
  });

  it('nao destaca nada quando o jogador esta longe de tudo', async () => {
    // Centro da ilha: a area de spawn e mantida livre de nos.
    const renderer = await renderScene(<ResourcesView />);

    await renderer.advanceFrames(1, 1 / 60);
    expect(state().highlightedNodeId).toBeNull();

    await renderer.unmount();
  });

  it('E abre o desafio no lugar de coletar direto', async () => {
    const alvo = standNextTo(state().nodes[0].id);
    const renderer = await renderScene(<ResourcesView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyE');

    // A colheita so acontece depois de responder — este e o ponto da fatia 3.
    expect(state().activeChallenge?.targetId).toBe(alvo.id);
    expect(state().inventory[alvo.kind]).toBe(0);
    expect(state().nodes.find((n) => n.id === alvo.id)?.depleted).toBe(false);

    await renderer.unmount();
  });

  it('apertar E longe de tudo nao abre desafio nem coleta', async () => {
    const renderer = await renderScene(<ResourcesView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyE');

    expect(state().activeChallenge).toBeNull();
    expect(state().inventory).toEqual(emptyInventory());

    await renderer.unmount();
  });

  it('apertar E duas vezes seguidas nao abre dois desafios', async () => {
    const alvo = standNextTo(state().nodes[0].id);
    const renderer = await renderScene(<ResourcesView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyE');
    const primeiro = state().activeChallenge;
    pressKey('KeyE');

    expect(state().activeChallenge).toBe(primeiro);
    expect(state().activeChallenge?.targetId).toBe(alvo.id);

    await renderer.unmount();
  });

  it('responder corretamente credita a colheita cheia e limpa a cena', async () => {
    const alvo = standNextTo(state().nodes[0].id);
    const renderer = await renderScene(<ResourcesView />);
    await renderer.advanceFrames(1, 1 / 60);

    const antes = renderer.scene.findAllByType('Mesh').length;

    pressKey('KeyE');
    act(() => {
      state().answerChallenge(state().activeChallenge!.answer);
    });
    await renderer.advanceFrames(1, 1 / 60);

    expect(state().inventory[alvo.kind]).toBe(fullYield(alvo));
    // O no sai da cena junto com os itens que ele exibia.
    expect(renderer.scene.findAllByType('Mesh').length).toBeLessThan(antes);
    expect(itemPlacements(alvo).length).toBeGreaterThan(0);

    await renderer.unmount();
  });

  it('afastar-se cancela o desafio aberto sem colher', async () => {
    const alvo = standNextTo(state().nodes[0].id);
    const renderer = await renderScene(<ResourcesView />);
    await renderer.advanceFrames(1, 1 / 60);

    pressKey('KeyE');
    expect(state().activeChallenge).not.toBeNull();

    // O jogador se afasta: como o jogo nao pausa, sair de perto e a forma
    // natural de desistir da conta.
    resetPlayerTransform();
    await renderer.advanceFrames(1, 1 / 60);

    expect(state().activeChallenge).toBeNull();
    expect(state().inventory[alvo.kind]).toBe(0);
    expect(state().nodes.find((n) => n.id === alvo.id)?.depleted).toBe(false);

    await renderer.unmount();
  });
});

describe('todo tipo de recurso chega a cena', () => {
  /**
   * O teste que pega a classe de defeito certa.
   *
   * A view desenhava tres blocos escritos a mao — madeira, fruta e pedra —
   * enquanto `itemsByKind` ja era montado para os nove tipos. Os seis recursos
   * novos eram calculados e jogados fora, e os nos de mel apareciam pelados na
   * tela. Contar a malha instanciada de cada tipo prova que o que foi calculado
   * chegou ao render.
   */
  it('desenha uma malha de itens para cada tipo presente no mundo', async () => {
    const porTipo = RESOURCE_KINDS.map((kind, i) => ({
      id: `no-${kind}`,
      kind,
      position: vec3(i * 12, 0, 0),
      groups: 3,
      perGroup: 4,
      depleted: false,
    }));
    useGameStore.setState({ nodes: porTipo, highlightedNodeId: null });

    const renderer = await renderScene(<ResourcesView />);

    // O renderizador de teste nao materializa `InstancedMesh`, mas cada
    // `<Instance>` aparece como um `Group`. Contar os grupos e, na pratica,
    // contar os itens que chegaram a cena.
    const esperados = porTipo.reduce((soma, no) => soma + itemPlacements(no).length, 0);
    const grupos = renderer.scene.findAllByType('Group').length;

    expect(esperados).toBe(RESOURCE_KINDS.length * 3 * 4);
    expect(grupos, 'itens calculados que nao chegaram ao render').toBeGreaterThanOrEqual(esperados);

    await renderer.unmount();
  });
});
