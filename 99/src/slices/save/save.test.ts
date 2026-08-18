import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../../app/store';
import { DEFAULT_AVATAR } from '../avatar/avatar.logic';
import { applySave, loadGame, snapshot, startAutoSave } from './save';
import {
  LocalStorageRepository,
  saveRepository,
  SAVE_VERSION,
  migrateSave,
  type GameSave,
} from './save.repository';

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
  inventory: { madeira: 5, fruta: 2, pedra: 9 },
  owned: ['botas'],
  hints: 3,
  avatar: { silhouette: 'menina', skin: 4, clothes: 6, head: 'bone', face: 'nenhum' },
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
    expect(resultado.inventory).toEqual({ madeira: 0, fruta: 0, pedra: 0 });
    expect(resultado.avatar).toEqual(DEFAULT_AVATAR);
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
    state().resetEconomy();
    state().resetResources();
    state().resetAvatar();
  });

  it('recorta so o que e duravel', () => {
    const recorte = snapshot();
    expect(Object.keys(recorte).sort()).toEqual(
      ['avatar', 'coins', 'hints', 'inventory', 'knownFacts', 'owned', 'version'].sort(),
    );
  });

  it('ida e volta pelo store preserva moedas, fatos, itens e aparencia', () => {
    applySave(saveValido());

    expect(state().coins).toBe(42);
    expect(state().knownFacts).toEqual(['2x4', '3x7']);
    expect(state().owned).toEqual(['botas']);
    expect(state().hints).toBe(3);
    expect(state().avatar.silhouette).toBe('menina');
    expect(snapshot()).toEqual(saveValido());
  });

  it('loadGame devolve false quando nao ha save', () => {
    const spy = vi.spyOn(saveRepository, 'load').mockReturnValue(null);
    expect(loadGame()).toBe(false);
    spy.mockRestore();
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
