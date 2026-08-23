import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { emptyInventory } from '../resources/resources.logic';
import { REGIONS } from '../regions/regions.logic';
import {
  createOrders,
  merchantPosition,
  nearestOrder,
  npcPosition,
  orderQuantity,
  orderTarget,
  teacherPosition,
} from './npc.logic';

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

  it('comerciante e professor tem posicoes dentro das regioes', () => {
    const comerciante = merchantPosition();
    expect(comerciante.x).toBeCloseTo(REGIONS[0].center.x - 4);
    expect(comerciante.z).toBeCloseTo(REGIONS[0].center.z + 4);

    const professor = teacherPosition('bosque');
    expect(professor.x).toBeCloseTo(REGIONS[2].center.x + 4);
    expect(professor.z).toBeCloseTo(REGIONS[2].center.z - 4);
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

  it('publica comerciante e professor e reseta junto', () => {
    state().setNearbyMerchant(true);
    state().setNearbyTeacherRegion('pomar');

    expect(state().nearbyMerchant).toBe(true);
    expect(state().nearbyTeacherRegion).toBe('pomar');

    state().resetNpc();

    expect(state().nearbyMerchant).toBe(false);
    expect(state().nearbyTeacherRegion).toBeNull();
  });

  it('professor oferece conselho baseado no progresso pedagógico da região', () => {
    useGameStore.setState({
      factProgress: {
        '2x1': { key: '2x1', correct: 5, wrong: 0, streak: 5, lastSeen: 5, dueAt: 999 },
        '2x2': { key: '2x2', correct: 5, wrong: 0, streak: 5, lastSeen: 5, dueAt: 999 },
        '2x3': { key: '2x3', correct: 1, wrong: 3, streak: 0, lastSeen: 4, dueAt: 6 },
      },
      learningStep: 5,
    });

    const conselho = state().getTeacherAdvice('praia');

    expect(conselho).not.toBeNull();
    expect(conselho!.focus.key).toBe('2x3');
    expect(conselho!.focus.level).toBe('review');
  });
});
