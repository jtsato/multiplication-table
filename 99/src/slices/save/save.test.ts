import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../../app/store';
import { DEFAULT_AVATAR } from '../avatar/avatar.logic';
import { applySave, loadGame, snapshot, startAutoSave } from './save';
import {
  LocalStorageRepository,
  saveRepository,
  SAVE_VERSION,
  SAVE_STORAGE_KEY,
  migrateSave,
  type GameSave,
} from './save.repository';
import { emptyInventory } from '../resources/resources.logic';
import { dayNightClock, resetDayNightClock } from '../daynight/dayNightClock';
import { dayNumber } from '../daynight/daynight.logic';
import { vec3 } from '../../shared/vec';

const state = () => useGameStore.getState();

afterEach(() => {
  vi.useRealTimers();
});

/** Armazenamento de mentira, para não depender do navegador. */
function memoria(inicial: string | null = null) {
  let valor = inicial;
  return {
    getItem: () => valor,
    setItem: (_: string, novo: string) => {
      valor = novo;
    },
    removeItem: () => {
      valor = null;
    },
    get atual() {
      return valor;
    },
  };
}

const saveValido = (): GameSave => ({
  version: SAVE_VERSION,
  coins: 42,
  knownFacts: ['2x4', '3x7'],
  factCounts: { '2x4': 3, '3x7': 1 },
  inventory: { ...emptyInventory(), madeira: 5, fruta: 2, pedra: 9 },
  owned: ['botas'],
  hints: 3,
  seeds: 2,
  garden: { planted: true, plantedDay: 1 },
  avatar: { silhouette: 'menina', skin: 4, clothes: 6, head: 'bone', face: 'nenhum' },
  openBridges: ['praia-porto'],
  animalBook: [
    { kind: 'cachorro', seen: true, friend: true },
    { kind: 'gaivota', seen: true, friend: false },
  ],
  pet: 'cachorro',
  locale: 'en-US',
  structures: [
    { id: 'fogueira-1', kind: 'fogueira', position: { x: 1, y: 0, z: 2 }, rotation: 0, fuelUntil: 500 },
    { id: 'cerca-2', kind: 'cerca', position: { x: 3, y: 0, z: 4 }, rotation: 0.5, fuelUntil: 0 },
  ],
  clockSeconds: 12345,
  volume: 0.7,
  cameraSensitivity: 1.5,
});

describe('migrateSave', () => {
  it('preserva um save valido', () => {
    expect(migrateSave(saveValido())).toEqual(saveValido());
  });

  it('recusa lixo', () => {
    expect(() => migrateSave(null)).toThrow();
    expect(() => migrateSave('save')).toThrow();
    expect(() => migrateSave({})).toThrow();
  });

  it('recusa versao desconhecida', () => {
    expect(() => migrateSave({ ...saveValido(), version: 99 })).toThrow(/versao/);
  });

  it('campo ausente recebe o padrao', () => {
    const parcial = { version: SAVE_VERSION };
    const resultado = migrateSave(parcial);

    expect(resultado.coins).toBe(0);
    expect(resultado.knownFacts).toEqual([]);
    expect(resultado.factCounts).toEqual({});
    expect(resultado.inventory).toEqual(emptyInventory());
    expect(resultado.avatar).toEqual(DEFAULT_AVATAR);
    expect(resultado.animalBook).toEqual([]);
    expect(resultado.pet).toBeNull();
    expect(resultado.seeds).toBe(0);
    expect(resultado.garden).toEqual({ planted: false, plantedDay: 0 });
    expect(resultado.structures).toEqual([]);
    expect(resultado.clockSeconds).toBe(0);
    expect(resultado.volume).toBe(0.5);
    expect(resultado.cameraSensitivity).toBe(1);
  });

  it('migra um save da versão 1 sem construções, relógio nem configurações', () => {
    const antigo = { ...saveValido(), version: 1 } as Record<string, unknown>;
    delete antigo.structures;
    delete antigo.clockSeconds;
    delete antigo.volume;
    delete antigo.cameraSensitivity;

    const resultado = migrateSave(antigo);
    expect(resultado.version).toBe(SAVE_VERSION);
    expect(resultado.structures).toEqual([]);
    expect(resultado.clockSeconds).toBe(0);
    expect(resultado.volume).toBe(0.5);
    expect(resultado.cameraSensitivity).toBe(1);
    expect(resultado.coins).toBe(42);
  });

  it('migra um save da versão 2 sem configurações', () => {
    const antigo = { ...saveValido(), version: 2 } as Record<string, unknown>;
    delete antigo.volume;
    delete antigo.cameraSensitivity;

    const resultado = migrateSave(antigo);
    expect(resultado.version).toBe(SAVE_VERSION);
    expect(resultado.volume).toBe(0.5);
    expect(resultado.cameraSensitivity).toBe(1);
    expect(resultado.structures).toHaveLength(2);
  });

  it('recusa numero negativo ou nao finito', () => {
    expect(() => migrateSave({ ...saveValido(), coins: -5 })).toThrow();
    expect(() => migrateSave({ ...saveValido(), hints: Number.NaN })).toThrow();
  });

  it('recusa fato mal formado — ele pintaria o mural errado', () => {
    expect(() => migrateSave({ ...saveValido(), knownFacts: ['dois vezes quatro'] })).toThrow();
    expect(() => migrateSave({ ...saveValido(), knownFacts: [4] })).toThrow();
  });

  /**
   * Item desconhecido nao derruba o save: pode ser de uma versao futura do
   * catalogo, e descartar em silencio e melhor que recusar o progresso inteiro.
   */
  it('descarta item de loja desconhecido sem recusar o save', () => {
    const resultado = migrateSave({ ...saveValido(), owned: ['botas', 'jetpack'] });
    expect(resultado.owned).toEqual(['botas']);
  });

  /**
   * Os casos abaixo vieram de um teste de mutacao: cada defesa contra save
   * corrompido estava **escrita em comentario e sem teste**, e trocar a condicao
   * por `true` nao quebrava nada. E o codigo que protege o progresso da crianca
   * de um dado estranho no navegador.
   */
  /**
   * A chave do armazenamento e contrato de compatibilidade: mudar esta string e
   * apagar o progresso de toda crianca que ja jogou. Fica presa em teste por
   * isso, e nao por preciosismo.
   */
  it('a chave do armazenamento nao muda', () => {
    expect(SAVE_STORAGE_KEY).toBe('numi-99.save');
  });

  /**
   * Os limites do formato do fato, um a um.
   *
   * Veio da mutacao: tirar o `^`, tirar o `$` ou afrouxar o tamanho passava por
   * todos os testes. Um fato malformado pinta o mural errado, que e exatamente a
   * razao de esta funcao lancar em vez de descartar.
   */
  it('recusa fato que so parece um fato', () => {
    for (const impostor of ['x2x4', '2x4x', '2x4 ', ' 2x4', '111x2', '2x111', 'a2x4', '2x4b']) {
      expect(() => migrateSave({ ...saveValido(), knownFacts: [impostor] }), impostor).toThrow();
    }
  });

  it('aceita os fatos de verdade, de 1x1 a 10x10', () => {
    expect(() =>
      migrateSave({ ...saveValido(), knownFacts: ['1x1', '2x10', '10x10'] }),
    ).not.toThrow();
  });

  it('recusa uma lista de fatos que nem lista e', () => {
    expect(() => migrateSave({ ...saveValido(), knownFacts: 'dois' })).toThrow();
    expect(() => migrateSave({ ...saveValido(), knownFacts: { a: 1 } })).toThrow();
  });

  it('recusa um inventario que nao e objeto', () => {
    expect(() => migrateSave({ ...saveValido(), inventory: 'muita madeira' })).toThrow();
    expect(() => migrateSave({ ...saveValido(), inventory: 42 })).toThrow();
    // `null` e objeto para o `typeof`, e por isso tem verificacao propria.
    expect(() => migrateSave({ ...saveValido(), inventory: null })).toThrow();
  });

  it('recusa uma lista de itens que nem lista e', () => {
    expect(() => migrateSave({ ...saveValido(), owned: 'botas' })).toThrow();
  });

  it('descarta item de loja que nem string e', () => {
    expect(migrateSave({ ...saveValido(), owned: [42, 'botas', null] }).owned).toEqual(['botas']);
  });

  /**
   * Pontes seguem a mesma regra dos itens: desconhecida some em silencio, porque
   * pode ser de uma versao futura do mapa; lista invalida derruba o save, porque
   * isso e bug de programa.
   */
  it('descarta ponte desconhecida e recusa lista invalida', () => {
    const resultado = migrateSave({
      ...saveValido(),
      openBridges: ['praia-porto', 'praia-lua', 7],
    });
    expect(resultado.openBridges).toEqual(['praia-porto']);

    expect(() => migrateSave({ ...saveValido(), openBridges: 'praia-porto' })).toThrow();
  });

  it('save sem pontes nem idioma — os de antes destas fases — abre no padrao', () => {
    const antigo = { ...saveValido() } as Record<string, unknown>;
    delete antigo.openBridges;
    delete antigo.locale;

    const resultado = migrateSave(antigo);
    expect(resultado.openBridges).toEqual([]);
    expect(resultado.locale).toBe('pt-BR');
  });

  it('idioma desconhecido no save cai no padrao, sem lancar', () => {
    expect(migrateSave({ ...saveValido(), locale: 'klingon' }).locale).toBe('pt-BR');
    expect(migrateSave({ ...saveValido(), locale: 99 }).locale).toBe('pt-BR');
  });

  it('aparencia estranha volta ao padrao em vez de lancar', () => {
    const resultado = migrateSave({ ...saveValido(), avatar: { silhouette: 'robo', skin: 99 } });
    expect(resultado.avatar.silhouette).toBe(DEFAULT_AVATAR.silhouette);
    expect(resultado.avatar.skin).toBe(DEFAULT_AVATAR.skin);
  });
});

describe('LocalStorageRepository', () => {
  it('ida e volta preserva o progresso', () => {
    const storage = memoria();
    const repo = new LocalStorageRepository(storage);

    repo.save(saveValido());

    expect(repo.load()).toEqual(saveValido());
    expect(storage.atual).toContain('"coins":42');
  });

  it('sem save guardado devolve null', () => {
    expect(new LocalStorageRepository(memoria()).load()).toBeNull();
  });

  it('JSON corrompido devolve null, e nao derruba o jogo', () => {
    expect(new LocalStorageRepository(memoria('{{{')).load()).toBeNull();
  });

  it('versao desconhecida devolve null', () => {
    const guardado = JSON.stringify({ ...saveValido(), version: 99 });
    expect(new LocalStorageRepository(memoria(guardado)).load()).toBeNull();
  });

  /**
   * Aba privada e cota cheia sao fatos da vida, e nao podem impedir de jogar.
   * Dado corrompido e bug e lanca na migracao; armazenamento indisponivel e
   * engolido aqui. A diferenca e deliberada.
   */
  it('armazenamento que lanca nao derruba o jogo', () => {
    const explosivo = {
      getItem: () => {
        throw new Error('sem acesso');
      },
      setItem: () => {
        throw new Error('cota cheia');
      },
      removeItem: () => {
        throw new Error('sem acesso');
      },
    };
    const repo = new LocalStorageRepository(explosivo);

    expect(() => repo.save(saveValido())).not.toThrow();
    expect(repo.load()).toBeNull();
    expect(() => repo.clear()).not.toThrow();
  });
});

describe('snapshot e applySave', () => {
  beforeEach(() => {
    resetDayNightClock();
    state().resetEconomy();
    state().resetResources();
    state().resetAvatar();
    state().resetBuilding();
    state().resetSettings();
  });

  it('recorta so o que e duravel', () => {
    const recorte = snapshot();
    expect(Object.keys(recorte).sort()).toEqual(
      [
        'animalBook',
        'avatar',
        'cameraSensitivity',
        'clockSeconds',
        'coins',
        'factCounts',
        'garden',
        'hints',
        'inventory',
        'knownFacts',
        'locale',
        'openBridges',
        'owned',
        'pet',
        'seeds',
        'structures',
        'version',
        'volume',
      ].sort(),
    );
  });

  it('ida e volta pelo store preserva moedas, fatos, itens e aparencia', () => {
    applySave(saveValido());

    expect(state().coins).toBe(42);
    expect(state().knownFacts).toEqual(['2x4', '3x7']);
    expect(state().owned).toEqual(['botas']);
    expect(state().hints).toBe(3);
    expect(state().seeds).toBe(2);
    expect(state().garden).toEqual({ planted: true, plantedDay: 1 });
    expect(state().avatar.silhouette).toBe('menina');
    // As pontes atravessam junto: sem isto a crianca perderia a travessia que
    // conquistou so por fechar a pagina.
    expect(state().openBridges).toEqual(['praia-porto']);
    // A caderneta e o pet tambem sao duradouros: amizade nao se perde no reload.
    expect(state().animalBook.find((entry) => entry.kind === 'cachorro')).toMatchObject({
      seen: true,
      friend: true,
    });
    expect(state().pet).toBe('cachorro');
    // O idioma escolhido volta junto, e o pacote de textos vem com ele.
    expect(state().locale).toBe('en-US');
    expect(state().text.strings.tagline).toBe('The times table island');
    // Construções e relógio: a fogueira que a criança ergueu não some no reload,
    // e o combustível/dia continuam fazendo sentido.
    expect(state().structures).toEqual(saveValido().structures);
    expect(dayNightClock.seconds).toBe(12345);
    expect(state().clock.day).toBe(dayNumber(12345));
    expect(state().volume).toBe(0.7);
    expect(state().cameraSensitivity).toBe(1.5);
    expect(snapshot()).toEqual(saveValido());
  });

  it('loadGame devolve false quando nao ha save', () => {
    const spy = vi.spyOn(saveRepository, 'load').mockReturnValue(null);
    expect(loadGame()).toBe(false);
    spy.mockRestore();
  });

  it('construir depois de um reload nao duplica id de estrutura', () => {
    applySave(saveValido());
    // Ambiente controlado: sem nós por perto, a nova cerca não esbarra em nada.
    useGameStore.setState({ nodes: [], inventory: { ...state().inventory, madeira: 100 } });
    state().toggleBuildMode('cerca');
    state().requestBuild(vec3(10, 0, 10), 0);
    const desafio = state().activeChallenge;
    expect(desafio?.purpose).toBe('construir');
    state().answerChallenge(desafio!.answer);

    const ids = state().structures.map((structure) => structure.id);
    expect(ids).toContain('cerca-3');
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('startAutoSave', () => {
  beforeEach(() => {
    state().resetEconomy();
    state().resetAvatar();
    vi.useFakeTimers();
  });

  /**
   * O teste que faltava. Sem o filtro de igualdade, o debounce se rearmava a
   * cada publicacao do relogio (4 Hz) e o save nunca chegava a acontecer.
   */
  it('grava depois de uma mudanca que importa', () => {
    const gravar = vi.spyOn(saveRepository, 'save');
    const parar = startAutoSave();

    act(() => state().rewardCorrect(2, 4));
    vi.advanceTimersByTime(1000);

    expect(gravar).toHaveBeenCalledTimes(1);
    parar();
    gravar.mockRestore();
  });

  it('publicacoes continuas do relogio nao adiam o save para sempre', () => {
    const gravar = vi.spyOn(saveRepository, 'save');
    const parar = startAutoSave();

    act(() => state().rewardCorrect(2, 4));
    // O relogio publicando a 4 Hz durante o atraso: antes, cada tique rearmava
    // o temporizador e o save nunca saia.
    for (let i = 0; i < 8; i += 1) {
      vi.advanceTimersByTime(100);
      act(() => state().publishClock({ phase: 'dia', day: 1, secondsToNextPhase: 100 - i }));
    }
    vi.advanceTimersByTime(1000);

    expect(gravar).toHaveBeenCalled();
    parar();
    gravar.mockRestore();
  });

  it('relogio vivo mudando nao impede o save de sair', () => {
    const gravar = vi.spyOn(saveRepository, 'save');
    const parar = startAutoSave();

    act(() => state().rewardCorrect(2, 4));
    // `clockSeconds` agora faz parte do save, mas não pode participar da
    // assinatura de igualdade: ele muda todo quadro e rearmaria o debounce.
    for (let i = 0; i < 8; i += 1) {
      dayNightClock.seconds += 1;
      vi.advanceTimersByTime(100);
      act(() => state().publishClock({ phase: 'dia', day: 1, secondsToNextPhase: 100 - i }));
    }
    vi.advanceTimersByTime(1000);

    expect(gravar).toHaveBeenCalledTimes(1);
    parar();
    gravar.mockRestore();
  });

  it('varias mudancas seguidas escrevem uma vez so', () => {
    const gravar = vi.spyOn(saveRepository, 'save');
    const parar = startAutoSave();

    act(() => {
      state().rewardCorrect(2, 4);
      state().rewardCorrect(2, 5);
      state().rewardCorrect(2, 6);
    });
    vi.advanceTimersByTime(1000);

    expect(gravar).toHaveBeenCalledTimes(1);
    parar();
    gravar.mockRestore();
  });
});
