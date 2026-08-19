import { describe, expect, it } from 'vitest';
import { GRAMMAR_BY_LOCALE } from './grammar';
import {
  DEFAULT_LOCALE,
  LOCALE_ENDONYMS,
  SUPPORTED_LOCALES,
  bundleFor,
  interpolate,
  migrateLocale,
} from './index';
import type { NounForms, UserLocale } from './types';
import { RESOURCE_KINDS } from '../slices/resources/resources.logic';
import { REGION_ORDER } from '../slices/regions/regions.logic';
import { SHOP_ORDER } from '../slices/economy/economy.logic';
import { ANIMAL_KINDS } from '../slices/wildlife/wildlife.logic';

const concha: NounForms = { one: 'concha', many: 'conchas', gender: 'f' };
const peixe: NounForms = { one: 'peixe', many: 'peixes', gender: 'm' };

describe('a gramatica', () => {
  it('todo idioma do tipo tem gramatica', () => {
    const idiomas: UserLocale[] = [
      'pt-BR',
      'en-US',
      'es-ES',
      'fr-FR',
      'de-DE',
      'ja-JP',
      'ko-KR',
      'zh-CN',
    ];
    for (const idioma of idiomas) {
      expect(GRAMMAR_BY_LOCALE[idioma], idioma).toBeDefined();
    }
  });

  /**
   * A razao de a gramatica ser codigo e nao modelo de texto. Sem isto o
   * enunciado sai "Quantos conchas", que e o defeito que o campo `gender` existe
   * para evitar desde a primeira fatia do jogo.
   */
  it('em portugues, o "quantos" concorda com o genero', () => {
    const pt = GRAMMAR_BY_LOCALE['pt-BR'];
    expect(pt.howMany(concha)).toBe('Quantas conchas ao todo?');
    expect(pt.howMany(peixe)).toBe('Quantos peixes ao todo?');
  });

  it('em ingles nao ha concordancia de genero para fazer', () => {
    const en = GRAMMAR_BY_LOCALE['en-US'];
    expect(en.howMany({ one: 'shell', many: 'shells' })).toBe('How many shells in total?');
    expect(en.howMany({ one: 'fish', many: 'fish' })).toBe('How many fish in total?');
  });

  it('conta no singular em 1 e no plural no resto', () => {
    const pt = GRAMMAR_BY_LOCALE['pt-BR'];
    expect(pt.counted(1, concha)).toBe('1 concha');
    expect(pt.counted(2, concha)).toBe('2 conchas');
    expect(pt.counted(10, concha)).toBe('10 conchas');
  });

  /**
   * Os idiomas sem plural nao sao um caso especial mal resolvido: eles usam
   * classificador, e em chines ele vem **antes** do substantivo. Nenhuma
   * interpolacao de marcadores daria conta dos dois lados.
   */
  it('os idiomas com classificador montam a frase na ordem propria', () => {
    const ja = GRAMMAR_BY_LOCALE['ja-JP'];
    const zh = GRAMMAR_BY_LOCALE['zh-CN'];
    const forma: NounForms = { one: '貝', many: '貝', counter: '個' };

    expect(ja.counted(3, forma)).toBe('貝3個');
    expect(zh.counted(3, { one: '贝壳', many: '贝壳', counter: '个' })).toBe('3个贝壳');
  });
});

describe('interpolate', () => {
  it('troca todos os marcadores', () => {
    expect(interpolate('{{a}} e {{b}}', { a: 'x', b: 'y' })).toBe('x e y');
  });

  it('aceita numero', () => {
    expect(interpolate('{{n}} moedas', { n: 7 })).toBe('7 moedas');
  });

  /**
   * Um marcador sem valor tem que falhar aqui, e nao virar `{{nome}}` na tela da
   * crianca. Texto quebrado e bug de programa, nao mensagem.
   */
  it('lanca quando falta um valor, em vez de vazar o marcador', () => {
    expect(() => interpolate('{{a}} e {{b}}', { a: 'x' })).toThrow();
  });

  it('nao deixa marcador para tras', () => {
    const saida = interpolate('dia {{d}}, {{n}} moedas', { d: 3, n: 12 });
    expect(saida).not.toMatch(/\{\{/);
  });
});

describe('os idiomas disponiveis', () => {
  it('o padrao esta entre os disponiveis', () => {
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
  });

  it('todo idioma disponivel tem nome escrito nele mesmo', () => {
    for (const idioma of SUPPORTED_LOCALES) {
      expect(LOCALE_ENDONYMS[idioma], idioma).toBeTruthy();
    }
  });

  /**
   * Meia traducao e pior que nenhuma: a crianca escolhe o idioma e encontra
   * telas em portugues no meio. A varredura abaixo e o que impede isso.
   */
  it('todo idioma disponivel esta completo', () => {
    for (const idioma of SUPPORTED_LOCALES) {
      const pacote = bundleFor(idioma);

      for (const kind of RESOURCE_KINDS) {
        expect(pacote.resources[kind], `${idioma}: recurso ${kind}`).toBeDefined();
        expect(pacote.resources[kind].item.many.length).toBeGreaterThan(0);
        expect(pacote.resources[kind].group.many.length).toBeGreaterThan(0);
      }

      for (const regiao of REGION_ORDER) {
        expect(pacote.regions[regiao], `${idioma}: regiao ${regiao}`).toBeTruthy();
      }

      for (const animal of ANIMAL_KINDS) {
        expect(pacote.animals[animal], `${idioma}: animal ${animal}`).toBeTruthy();
      }

      for (const item of SHOP_ORDER) {
        expect(pacote.shop[item]?.label, `${idioma}: loja ${item}`).toBeTruthy();
        expect(pacote.shop[item]?.effect, `${idioma}: efeito ${item}`).toBeTruthy();
      }
    }
  });

  it('nenhuma chave de interface existe num idioma e falta no outro', () => {
    const chaves = SUPPORTED_LOCALES.map((idioma) =>
      Object.keys(bundleFor(idioma).strings).sort().join('|'),
    );
    expect(new Set(chaves).size, 'os idiomas divergiram nas chaves').toBe(1);
  });

  it('nenhum texto de interface fica vazio', () => {
    for (const idioma of SUPPORTED_LOCALES) {
      for (const [chave, valor] of Object.entries(bundleFor(idioma).strings)) {
        expect(valor.length, `${idioma}: ${chave} vazio`).toBeGreaterThan(0);
      }
    }
  });

  /** O nome do jogo e invariante: nunca entra num arquivo de traducao. */
  it('"Numi 99" nao aparece em nenhum locale', () => {
    for (const idioma of SUPPORTED_LOCALES) {
      const tudo = JSON.stringify(bundleFor(idioma));
      expect(tudo, `${idioma} traduziu o nome`).not.toContain('Numi');
    }
  });

  it('o pacote traz a gramatica do proprio idioma', () => {
    for (const idioma of SUPPORTED_LOCALES) {
      expect(bundleFor(idioma).grammar).toBe(GRAMMAR_BY_LOCALE[idioma]);
    }
  });
});

describe('migrateLocale', () => {
  it('aceita um idioma disponivel', () => {
    expect(migrateLocale('en-US')).toBe('en-US');
  });

  /**
   * Nunca lanca, como `migrateAvatar`: um idioma estranho guardado no navegador
   * nao pode impedir a crianca de jogar.
   */
  it('cai no padrao para qualquer lixo', () => {
    for (const entrada of [null, undefined, 42, 'klingon', {}, [], 'ja-JP']) {
      expect(migrateLocale(entrada)).toBe(DEFAULT_LOCALE);
    }
  });
});
