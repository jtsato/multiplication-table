import { describe, expect, it } from 'vitest';
import {
  CLOTHES_COLORS,
  DEFAULT_AVATAR,
  FACE_ACCESSORIES,
  HEAD_ACCESSORIES,
  SKIN_TONES,
  SILHOUETTES,
  TABLE_FACTORS,
  accessoryIsAvailable,
  migrateAvatar,
  tableIsMastered,
  unlockedAccessories,
} from './avatar.logic';

/** Todos os fatos de uma tabuada, como a economia os guarda. */
const tabuadaInteira = (table: number) =>
  TABLE_FACTORS.map((factor) => {
    const [menor, maior] = table <= factor ? [table, factor] : [factor, table];
    return `${menor}x${maior}`;
  });

describe('paleta do avatar', () => {
  it('oferece seis tons de pele e oito cores de roupa', () => {
    expect(SKIN_TONES).toHaveLength(6);
    expect(CLOTHES_COLORS).toHaveLength(8);
  });

  it('a selecao padrao e valida', () => {
    expect(SILHOUETTES).toContain(DEFAULT_AVATAR.silhouette);
    expect(SKIN_TONES[DEFAULT_AVATAR.skin]).toBeDefined();
    expect(CLOTHES_COLORS[DEFAULT_AVATAR.clothes]).toBeDefined();
  });

  /**
   * A regra que sustenta a slice: escolher menino ou menina e escolha de
   * aparencia, nao de permissao. Se algum dia alguem acrescentar um acessorio
   * preso a uma silhueta, este teste tem que quebrar.
   */
  it('nenhum acessorio depende da silhueta escolhida', () => {
    const especificacoes = [...HEAD_ACCESSORIES, ...FACE_ACCESSORIES];
    for (const spec of especificacoes) {
      expect(Object.keys(spec).sort()).toEqual(['id', 'requiresTable']);
    }
  });
});

describe('tableIsMastered', () => {
  it('exige a tabuada inteira, e nao a maioria', () => {
    const quaseTudo = tabuadaInteira(5).slice(0, 9);
    expect(tableIsMastered(5, quaseTudo)).toBe(false);
    expect(tableIsMastered(5, tabuadaInteira(5))).toBe(true);
  });

  it('nao confunde uma tabuada com outra', () => {
    expect(tableIsMastered(9, tabuadaInteira(5))).toBe(false);
  });

  it('aceita os fatos guardados na ordem invertida', () => {
    // A economia normaliza 9x2 para 2x9; o marco tem que enxergar isso.
    expect(tableIsMastered(9, tabuadaInteira(9))).toBe(true);
  });
});

describe('unlockedAccessories', () => {
  it('sem nenhum fato, so o que e livre aparece', () => {
    const cabeca = unlockedAccessories(HEAD_ACCESSORIES, []);
    expect(cabeca.map((spec) => spec.id)).toEqual(['nenhum', 'bone']);
    expect(unlockedAccessories(FACE_ACCESSORIES, []).map((s) => s.id)).toEqual(['nenhum']);
  });

  it('a coroa exige a tabuada do 9 inteira', () => {
    expect(accessoryIsAvailable(HEAD_ACCESSORIES, 'coroa', tabuadaInteira(5))).toBe(false);
    expect(accessoryIsAvailable(HEAD_ACCESSORIES, 'coroa', tabuadaInteira(9))).toBe(true);
  });

  it('os oculos chegam com a tabuada do 3', () => {
    expect(accessoryIsAvailable(FACE_ACCESSORIES, 'oculos', tabuadaInteira(3))).toBe(true);
  });

  it('todo acessorio de marco exige uma tabuada de verdade', () => {
    for (const spec of [...HEAD_ACCESSORIES, ...FACE_ACCESSORIES]) {
      if (spec.requiresTable !== null) {
        expect(spec.requiresTable).toBeGreaterThanOrEqual(2);
        expect(spec.requiresTable).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe('migrateAvatar', () => {
  it('preserva uma selecao valida', () => {
    const escolha = {
      silhouette: 'menina' as const,
      skin: 4,
      clothes: 6,
      head: 'coroa' as const,
      face: 'oculos' as const,
    };
    expect(migrateAvatar(escolha)).toEqual(escolha);
  });

  it('devolve o padrao para lixo', () => {
    expect(migrateAvatar(null)).toEqual(DEFAULT_AVATAR);
    expect(migrateAvatar('roupa')).toEqual(DEFAULT_AVATAR);
    expect(migrateAvatar(42)).toEqual(DEFAULT_AVATAR);
  });

  it('conserta campo a campo, sem descartar o resto', () => {
    const resultado = migrateAvatar({ silhouette: 'menina', skin: 99, head: 'capacete' });

    expect(resultado.silhouette).toBe('menina');
    expect(resultado.skin).toBe(DEFAULT_AVATAR.skin);
    expect(resultado.head).toBe(DEFAULT_AVATAR.head);
  });

  it('nunca lanca — uma aparencia estranha nao pode impedir de jogar', () => {
    const entradas = [undefined, [], { skin: -1 }, { clothes: 1.5 }, { silhouette: 7 }];
    for (const entrada of entradas) {
      expect(() => migrateAvatar(entrada)).not.toThrow();
    }
  });
});
