import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { emptyInventory } from '../resources/resources.logic';
import { REGIONS } from '../regions/regions.logic';
import { createOrders, nearestOrder, npcPosition, orderQuantity, orderTarget } from './npc.logic';

const state = () => useGameStore.getState();

describe('npc.logic', () => {
  it('cria uma encomenda por regiao, deterministica por dia', () => {
    const primeiro = createOrders(1);
    const segundo = createOrders(1);

    expect(primeiro).toEqual(segundo);
    expect(primeiro).toHaveLength(REGIONS.length);
  });

  it('o pedido gera um enunciado consistente com a quantidade', () => {
    const order = createOrders(1)[0];
    const alvo = orderTarget(order);

    expect(alvo.id).toBe(order.id);
    expect(alvo.kind).toBe(order.kind);
    expect(alvo.groups).toBe(order.groups);
    expect(alvo.perGroup).toBe(order.perGroup);
    expect(orderQuantity(order)).toBe(order.groups * order.perGroup);
  });

  it('nearestOrder acha o NPC mais proximo dentro do alcance', () => {
    const orders = createOrders(1);
    const praia = orders.find((order) => order.regionId === 'praia')!;

    // Perto do NPC da Praia, longe dos outros.
    expect(nearestOrder(npcPosition('praia'), orders)?.id).toBe(praia.id);
  });
});

describe('npc.store', () => {
  beforeEach(() => {
    state().resetNpc();
    state().resetResources();
    state().resetEconomy();
  });

  it('entregar debita a quantidade e paga as moedas', () => {
    const order = state().orders[0];
    useGameStore.setState({
      inventory: { ...emptyInventory(), [order.kind]: orderQuantity(order) + 5 },
    });
    const antes = state().coins;

    state().completeOrder(order.id);

    expect(state().inventory[order.kind]).toBe(5);
    expect(state().coins).toBe(antes + order.rewardCoins);
  });

  it('sem a quantidade na mochila, nao entrega nem paga', () => {
    const order = state().orders[0];
    useGameStore.setState({ inventory: emptyInventory() });
    const antes = state().coins;

    state().completeOrder(order.id);

    expect(state().inventory[order.kind]).toBe(0);
    expect(state().coins).toBe(antes);
  });

  it('resetNpc volta as encomendas do dia 1', () => {
    state().setNearbyOrder('x');
    state().resetNpc();

    expect(state().orders).toEqual(createOrders(1));
    expect(state().nearbyOrderId).toBeNull();
  });
});
