import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { fullYield } from './resources.logic';
import { emptyInventory } from './resources.logic';

const state = () => useGameStore.getState();

describe('slice de recursos', () => {
  beforeEach(() => {
    state().resetResources();
  });

  it('comeca com o inventario zerado e todos os nos disponiveis', () => {
    expect(state().inventory).toEqual(emptyInventory());
    expect(state().nodes.every((node) => !node.depleted)).toBe(true);
  });

  it('colher credita o inventario no tipo certo e esgota o no', () => {
    const target = state().nodes[0];
    state().collectNode(target.id, fullYield(target));

    expect(state().inventory[target.kind]).toBe(fullYield(target));
    expect(state().nodes.find((node) => node.id === target.id)?.depleted).toBe(true);
  });

  it('colher duas vezes o mesmo no nao rende recurso em dobro', () => {
    const target = state().nodes[0];
    state().collectNode(target.id, fullYield(target));
    state().collectNode(target.id, fullYield(target));

    expect(state().inventory[target.kind]).toBe(fullYield(target));
  });

  it('ignora um id inexistente sem quebrar', () => {
    state().collectNode('no-que-nao-existe', 10);
    expect(state().inventory).toEqual(emptyInventory());
  });

  it('limpa o destaque ao colher o no destacado', () => {
    const target = state().nodes[0];
    state().setHighlightedNodeId(target.id);
    state().collectNode(target.id, fullYield(target));

    expect(state().highlightedNodeId).toBeNull();
  });

  it('preserva o destaque de outro no ao colher', () => {
    const [first, second] = state().nodes;
    state().setHighlightedNodeId(second.id);
    state().collectNode(first.id, fullYield(first));

    expect(state().highlightedNodeId).toBe(second.id);
  });

  it('restaurar devolve o no ao mundo sem mexer no inventario', () => {
    const target = state().nodes[0];
    state().collectNode(target.id, fullYield(target));
    const depois = state().inventory[target.kind];

    state().restoreNode(target.id);

    expect(state().nodes.find((node) => node.id === target.id)?.depleted).toBe(false);
    expect(state().inventory[target.kind]).toBe(depois);
  });

  it('nao troca a referencia do estado quando o destaque nao muda', () => {
    state().setHighlightedNodeId('abc');
    const antes = useGameStore.getState();
    state().setHighlightedNodeId('abc');

    // Identidade preservada: e o que impede o HUD de re-renderizar a cada quadro,
    // ja que o realce e recalculado 60 vezes por segundo.
    expect(useGameStore.getState()).toBe(antes);
  });

  it('resetar zera inventario, destaque e esgotamento', () => {
    const target = state().nodes[0];
    state().collectNode(target.id, fullYield(target));
    state().setHighlightedNodeId(target.id);

    state().resetResources();

    expect(state().inventory).toEqual(emptyInventory());
    expect(state().highlightedNodeId).toBeNull();
    expect(state().nodes.every((node) => !node.depleted)).toBe(true);
  });
});
