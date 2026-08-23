import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { BRIDGES, bridgeFor } from './bridges.logic';
import { unlockedRegions } from './regions.store';
import { regionById } from './regions.logic';
import { factKey } from '../economy/economy.logic';
import { emptyInventory } from '../resources/resources.logic';

const state = () => useGameStore.getState();

const fatosDe = (table: number) => Array.from({ length: 10 }, (_, i) => factKey(table, i + 1));

const progressoDe = (table: number) =>
  Object.fromEntries(
    fatosDe(table).map((fato) => [
      fato,
      { key: fato, correct: 4, wrong: 0, streak: 4, lastSeen: 4, dueAt: 999 },
    ]),
  );

function pronta() {
  useGameStore.setState({
    coins: 999,
    inventory: { ...emptyInventory(), madeira: 99, fruta: 99, pedra: 99 },
    factProgress: progressoDe(2),
  });
}

describe('comprar uma ponte', () => {
  beforeEach(() => {
    state().resetRegions();
    state().resetEconomy();
    state().resetResources();
  });

  it('comeca sem ponte nenhuma, presa na praia', () => {
    expect(state().openBridges).toEqual([]);
    expect(unlockedRegions(state().openBridges)).toEqual(['praia']);
  });

  it('abre a ponte e cobra moeda e recurso', () => {
    pronta();
    const ponte = bridgeFor('praia', 'porto')!;
    const antes = { moedas: state().coins, madeira: state().inventory.madeira };

    state().buyBridge(ponte.id);

    expect(state().openBridges).toContain(ponte.id);
    expect(state().coins).toBe(antes.moedas - ponte.coins);
    expect(state().inventory.madeira).toBe(antes.madeira - (ponte.recipe.madeira ?? 0));
    expect(state().bridgeError).toBeNull();
  });

  it('a ponte aberta libera a regiao seguinte', () => {
    pronta();
    state().buyBridge(bridgeFor('praia', 'porto')!.id);
    expect(unlockedRegions(state().openBridges).sort()).toEqual(['porto', 'praia']);
  });

  /**
   * O portao de verdade: moeda e recurso de sobra nao compram a travessia se a
   * tabuada de onde se sai nao foi treinada.
   */
  it('recusa sem a tabuada, e nao cobra nada', () => {
    useGameStore.setState({
      coins: 999,
      inventory: { ...emptyInventory(), madeira: 99, fruta: 99, pedra: 99 },
      factProgress: {},
    });
    const ponte = bridgeFor('praia', 'porto')!;

    state().buyBridge(ponte.id);

    expect(state().openBridges).toEqual([]);
    expect(state().bridgeError).toBe('sem-tabuada');
    expect(state().coins).toBe(999);
    expect(state().inventory.madeira).toBe(99);
  });

  it('nao cobra duas vezes pela mesma ponte', () => {
    pronta();
    const ponte = bridgeFor('praia', 'porto')!;
    state().buyBridge(ponte.id);
    const depoisDaPrimeira = state().coins;

    state().buyBridge(ponte.id);

    expect(state().coins).toBe(depoisDaPrimeira);
    expect(state().openBridges.filter((id) => id === ponte.id)).toHaveLength(1);
  });

  it('ignora um id de ponte que nao existe', () => {
    pronta();
    state().buyBridge('praia-pico');
    expect(state().openBridges).toEqual([]);
    expect(state().bridgeError).toBeNull();
  });

  it('a recusa some quando pedida', () => {
    useGameStore.setState({ factProgress: {} });
    state().buyBridge(bridgeFor('praia', 'porto')!.id);
    expect(state().bridgeError).not.toBeNull();

    state().clearBridgeError();
    expect(state().bridgeError).toBeNull();
  });

  it('comprando a cadeia inteira, alcanca as nove ilhas', () => {
    const todosOsProgressos = BRIDGES.flatMap((ponte) => regionById(ponte.from).tables).reduce<
      Record<string, { key: string; correct: number; wrong: number; streak: number; lastSeen: number; dueAt: number }>
    >((acc, tabela) => ({ ...acc, ...progressoDe(tabela) }), {});
    useGameStore.setState({
      coins: 9999,
      inventory: { ...emptyInventory(), madeira: 999, fruta: 999, pedra: 999 },
      factProgress: todosOsProgressos,
    });

    for (const ponte of BRIDGES) state().buyBridge(ponte.id);

    expect(unlockedRegions(state().openBridges)).toHaveLength(9);
  });
});

describe('a regiao publicada', () => {
  beforeEach(() => state().resetRegions());

  it('comeca na praia', () => {
    expect(state().currentRegion).toBe('praia');
  });

  /**
   * A guarda de igualdade nao e enfeite: `RegionsView` chama isto de dentro do
   * `useFrame`, e sem ela o store notificaria todos os assinantes 60 vezes por
   * segundo sem nenhuma novidade — que e exatamente a regra de performance que
   * o projeto inteiro segue.
   */
  it('publicar a mesma regiao nao notifica ninguem', () => {
    let notificacoes = 0;
    const parar = useGameStore.subscribe(() => {
      notificacoes += 1;
    });

    state().publishRegion('praia');
    state().publishRegion('praia');
    expect(notificacoes).toBe(0);

    state().publishRegion('porto');
    expect(notificacoes).toBe(1);

    parar();
  });

  it('a ponte ao alcance tambem so notifica quando muda', () => {
    let notificacoes = 0;
    const parar = useGameStore.subscribe(() => {
      notificacoes += 1;
    });

    state().setNearbyBridge('praia-porto');
    state().setNearbyBridge('praia-porto');
    expect(notificacoes).toBe(1);

    state().setNearbyBridge(null);
    expect(notificacoes).toBe(2);

    parar();
  });

  it('recomecar volta para a praia e fecha tudo', () => {
    state().publishRegion('pico');
    useGameStore.setState({ openBridges: ['praia-porto'] });

    state().resetRegions();

    expect(state().currentRegion).toBe('praia');
    expect(state().openBridges).toEqual([]);
  });
});
