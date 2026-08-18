import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { lanternChargeSeconds, lanternRadius } from '../lantern/lantern.logic';
import { playerSpeed } from '../player/player.logic';
import { RESOURCE_KINDS } from '../resources/resources.logic';
import { ECONOMY, SHOP_ITEMS, coinsFor, factKey } from './economy.logic';

const state = () => useGameStore.getState();

describe('factKey', () => {
  it('identifica o fato pela dupla de fatores', () => {
    expect(factKey(2, 4)).toBe('2x4');
  });

  it('trata 2x4 e 4x2 como o mesmo fato', () => {
    expect(factKey(4, 2)).toBe(factKey(2, 4));
  });
});

describe('coinsFor', () => {
  it('o acerto paga o numero da tabuada', () => {
    expect(coinsFor({ perGroup: 2, streak: 1, factIsNew: false })).toBe(2);
    expect(coinsFor({ perGroup: 9, streak: 1, factIsNew: false })).toBe(9);
  });

  it('a cada tres seguidos vem o bonus', () => {
    expect(coinsFor({ perGroup: 2, streak: 3, factIsNew: false })).toBe(2 + ECONOMY.streakBonus);
    expect(coinsFor({ perGroup: 2, streak: 6, factIsNew: false })).toBe(2 + ECONOMY.streakBonus);
  });

  it('fora do multiplo de tres nao ha bonus de sequencia', () => {
    expect(coinsFor({ perGroup: 2, streak: 1, factIsNew: false })).toBe(2);
    expect(coinsFor({ perGroup: 2, streak: 4, factIsNew: false })).toBe(2);
  });

  it('fato novo paga o bonus grande', () => {
    expect(coinsFor({ perGroup: 2, streak: 1, factIsNew: true })).toBe(2 + ECONOMY.newFactBonus);
  });

  it('os bonus se somam', () => {
    expect(coinsFor({ perGroup: 2, streak: 3, factIsNew: true })).toBe(
      2 + ECONOMY.streakBonus + ECONOMY.newFactBonus,
    );
  });

  it('nunca paga menos que o numero da tabuada', () => {
    for (let streak = 1; streak <= 12; streak += 1) {
      expect(coinsFor({ perGroup: 5, streak, factIsNew: false })).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('slice da economia', () => {
  beforeEach(() => {
    state().resetEconomy();
  });

  it('comeca sem moeda, sem sequencia e sem fato conhecido', () => {
    expect(state().coins).toBe(0);
    expect(state().streak).toBe(0);
    expect(state().knownFacts).toEqual([]);
  });

  it('o acerto credita moedas e conta a sequencia', () => {
    state().rewardCorrect(2, 4);

    expect(state().streak).toBe(1);
    // 2 da tabuada + 10 por ser fato novo.
    expect(state().coins).toBe(2 + ECONOMY.newFactBonus);
    expect(state().knownFacts).toEqual(['2x4']);
  });

  it('o mesmo fato so paga o bonus de novidade uma vez', () => {
    state().rewardCorrect(2, 4);
    const depoisDoPrimeiro = state().coins;
    state().rewardCorrect(2, 4);

    expect(state().coins - depoisDoPrimeiro).toBe(2);
    expect(state().knownFacts).toEqual(['2x4']);
  });

  it('4x2 nao conta como fato novo depois de 2x4', () => {
    state().rewardCorrect(2, 4);
    state().rewardCorrect(4, 2);

    expect(state().knownFacts).toEqual(['2x4']);
  });

  it('o erro zera a sequencia e nao tira moeda', () => {
    state().rewardCorrect(2, 4);
    const antes = state().coins;
    state().breakStreak();

    expect(state().streak).toBe(0);
    expect(state().coins).toBe(antes);
  });

  it('o resumo do dia zera, mas as moedas e os fatos atravessam', () => {
    state().rewardCorrect(2, 4);
    const moedas = state().coins;
    state().resetDaily();

    expect(state().correctToday).toBe(0);
    expect(state().coinsToday).toBe(0);
    expect(state().newFactsToday).toEqual([]);
    expect(state().coins).toBe(moedas);
    expect(state().knownFacts).toEqual(['2x4']);
  });
});

describe('loja', () => {
  const rico = () => {
    useGameStore.setState({
      coins: 200,
      inventory: { madeira: 50, fruta: 50, pedra: 50 },
    });
  };

  beforeEach(() => {
    state().resetEconomy();
    state().resetResources();
  });

  it('todo tipo de recurso do jogo e consumido por algum item', () => {
    for (const kind of RESOURCE_KINDS) {
      const temDestino = Object.values(SHOP_ITEMS).some((item) => (item.recipe[kind] ?? 0) > 0);
      expect(temDestino, `${kind} nao e gasto em nada`).toBe(true);
    }
  });

  it('recusa sem moeda suficiente', () => {
    useGameStore.setState({ coins: 0, inventory: { madeira: 50, fruta: 50, pedra: 50 } });
    state().buy('lanterna-maior');

    expect(state().purchaseError).toBe('sem-moedas');
    expect(state().owned).toEqual([]);
  });

  it('recusa sem recurso, mesmo com moeda de sobra', () => {
    useGameStore.setState({ coins: 999, inventory: { madeira: 0, fruta: 0, pedra: 0 } });
    state().buy('lanterna-maior');

    expect(state().purchaseError).toBe('sem-recursos');
    expect(state().owned).toEqual([]);
  });

  it('debita moedas e recursos na compra', () => {
    rico();
    state().buy('lanterna-maior');

    expect(state().coins).toBe(200 - SHOP_ITEMS['lanterna-maior'].coins);
    expect(state().inventory.madeira).toBe(50 - (SHOP_ITEMS['lanterna-maior'].recipe.madeira ?? 0));
    expect(state().owned).toContain('lanterna-maior');
    expect(state().purchaseError).toBeNull();
  });

  it('nao compra duas vezes um item permanente', () => {
    rico();
    state().buy('botas');
    const depoisDaPrimeira = state().coins;
    state().buy('botas');

    expect(state().purchaseError).toBe('ja-comprado');
    expect(state().coins).toBe(depoisDaPrimeira);
  });

  it('a dica e comprada mais de uma vez e acumula', () => {
    rico();
    state().buy('dica');
    state().buy('dica');

    expect(state().hints).toBe(2);
    expect(state().owned).not.toContain('dica');
  });

  it('gastar dica desconta do estoque e avisa quando acaba', () => {
    rico();
    state().buy('dica');

    expect(state().useHint()).toBe(true);
    expect(state().hints).toBe(0);
    expect(state().useHint()).toBe(false);
  });

  it('a loja nao abre com um desafio na tela', () => {
    state().startChallenge(state().nodes[0]);
    state().toggleShop();

    expect(state().shopOpen).toBe(false);
    state().cancelChallenge();
  });

  it('a loja abre e fecha', () => {
    state().toggleShop();
    expect(state().shopOpen).toBe(true);
    state().toggleShop();
    expect(state().shopOpen).toBe(false);
  });
});

describe('efeitos dos itens', () => {
  beforeEach(() => {
    state().resetEconomy();
    state().resetResources();
    state().cancelChallenge();
  });

  it('a lanterna maior ilumina mais longe e dura mais', () => {
    expect(lanternRadius(true)).toBeGreaterThan(lanternRadius(false));
    expect(lanternChargeSeconds(true)).toBeGreaterThan(lanternChargeSeconds(false));
  });

  it('as botas aumentam a velocidade', () => {
    expect(playerSpeed(true)).toBeGreaterThan(playerSpeed(false));
  });

  it('a dica apaga uma alternativa errada e gasta do estoque', () => {
    useGameStore.setState({ hints: 1 });
    state().startChallenge(state().nodes[0]);
    const desafio = state().activeChallenge!;

    state().useHintOnChallenge();

    expect(state().hiddenOptions).toHaveLength(1);
    expect(state().hiddenOptions[0]).not.toBe(desafio.answer);
    expect(state().hints).toBe(0);
  });

  it('a dica nunca apaga a resposta certa, nem deixa so ela', () => {
    useGameStore.setState({ hints: 5 });
    state().startChallenge(state().nodes[0]);
    const desafio = state().activeChallenge!;

    for (let i = 0; i < 5; i += 1) state().useHintOnChallenge();

    const restantes = desafio.options.filter((o) => !state().hiddenOptions.includes(o));
    expect(restantes).toContain(desafio.answer);
    expect(restantes.length).toBeGreaterThanOrEqual(2);
  });

  it('sem dica no estoque, nada acontece', () => {
    state().startChallenge(state().nodes[0]);
    state().useHintOnChallenge();

    expect(state().hiddenOptions).toEqual([]);
  });

  it('abrir outro desafio limpa as alternativas apagadas', () => {
    useGameStore.setState({ hints: 1 });
    state().startChallenge(state().nodes[0]);
    state().useHintOnChallenge();
    expect(state().hiddenOptions).toHaveLength(1);

    state().cancelChallenge();
    state().startChallenge(state().nodes[1]);

    expect(state().hiddenOptions).toEqual([]);
  });
});
