import { describe, expect, it } from 'vitest';
import {
  collectKeys,
  createTranslator,
  DICTIONARIES,
  detectLocale,
  interpolate,
  isSupportedLocale,
} from './translate';
import { SUPPORTED_LOCALES } from '../domain/types';
import { ACHIEVEMENTS } from '../domain/achievements';
import { MISSIONS } from '../domain/missions';
import { TABLES } from '../domain/facts';
import { ACCESSORIES, AVATAR_BASES, HAIR_STYLES, OUTFIT_COLORS } from '../domain/avatar';

describe('interpolate', () => {
  it('substitui os parametros', () => {
    expect(interpolate('Quanto é {{a}} × {{b}}?', { a: 3, b: 4 })).toBe('Quanto é 3 × 4?');
  });

  it('mantem o marcador quando falta o parametro', () => {
    expect(interpolate('Oi {{nome}}')).toBe('Oi {{nome}}');
    expect(interpolate('Oi {{nome}}', { outro: 1 })).toBe('Oi {{nome}}');
  });
});

describe('createTranslator', () => {
  it('traduz para portugues', () => {
    const t = createTranslator('pt-BR');
    expect(t('home.play')).toBe('Jogar');
    expect(t('game.question', { a: 2, b: 3 })).toBe('Quanto é 2 × 3?');
  });

  it('traduz para ingles', () => {
    const t = createTranslator('en-US');
    expect(t('home.play')).toBe('Play');
    expect(t('game.question', { a: 2, b: 3 })).toBe('What is 2 × 3?');
  });

  it('devolve a propria chave quando ela nao existe', () => {
    const t = createTranslator('pt-BR');
    expect(t('chave.que.nao.existe')).toBe('chave.que.nao.existe');
  });

  it('nao devolve um objeto quando a chave aponta para um grupo', () => {
    const t = createTranslator('pt-BR');
    expect(t('home')).toBe('home');
  });
});

describe('cobertura dos dicionarios', () => {
  const reference = collectKeys(DICTIONARIES['en-US']).sort();

  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale} tem exatamente as mesmas chaves do idioma de referencia`, () => {
      expect(collectKeys(DICTIONARIES[locale]).sort()).toEqual(reference);
    });

    it(`${locale} nao tem texto vazio`, () => {
      const t = createTranslator(locale);
      for (const key of reference) {
        expect(t(key).trim().length).toBeGreaterThan(0);
      }
    });
  }
});

describe('cobertura do conteudo do jogo', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const t = createTranslator(locale);

    it(`${locale} traduz todas as ilhas`, () => {
      for (const table of TABLES) {
        expect(t(`islands.${table}.name`)).not.toBe(`islands.${table}.name`);
        expect(t(`islands.${table}.biome`)).not.toBe(`islands.${table}.biome`);
      }
    });

    it(`${locale} traduz todos os tipos de missao`, () => {
      for (const scene of new Set(MISSIONS.map((mission) => mission.scene))) {
        for (const part of ['title', 'brief', 'done']) {
          expect(t(`missions.${scene}.${part}`)).not.toBe(`missions.${scene}.${part}`);
        }
      }
    });

    it(`${locale} traduz todas as conquistas`, () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(t(`achievements.list.${achievement.id}.name`)).not.toContain('achievements.list');
        expect(t(`achievements.list.${achievement.id}.description`)).not.toContain(
          'achievements.list',
        );
      }
    });

    it(`${locale} traduz todas as opcoes de personagem`, () => {
      for (const base of AVATAR_BASES) {
        expect(t(`onboarding.base.${base}`)).not.toContain('onboarding.base');
      }
      for (const hair of HAIR_STYLES) {
        expect(t(`onboarding.hair.${hair}`)).not.toContain('onboarding.hair');
      }
      for (const outfit of OUTFIT_COLORS) {
        expect(t(`onboarding.outfit.${outfit}`)).not.toContain('onboarding.outfit');
      }
      for (const accessory of ACCESSORIES) {
        expect(t(`onboarding.accessory.${accessory}`)).not.toContain('onboarding.accessory');
      }
    });

    it(`${locale} tem as quatro variacoes de feedback`, () => {
      for (let i = 0; i < 4; i += 1) {
        expect(t(`feedback.correct.${i}`)).not.toContain('feedback.correct');
        expect(t(`feedback.wrong.${i}`)).not.toContain('feedback.wrong');
      }
    });
  }
});

describe('detectLocale', () => {
  it('reconhece portugues de qualquer regiao', () => {
    expect(detectLocale(['pt-BR'])).toBe('pt-BR');
    expect(detectLocale(['pt-PT'])).toBe('pt-BR');
    expect(detectLocale(['pt'])).toBe('pt-BR');
  });

  it('reconhece ingles de qualquer regiao', () => {
    expect(detectLocale(['en-GB'])).toBe('en-US');
  });

  it('cai no fallback para idiomas sem traducao', () => {
    expect(detectLocale(['ja-JP'])).toBe('en-US');
    expect(detectLocale([])).toBe('en-US');
  });

  it('respeita a ordem de preferencia do navegador', () => {
    expect(detectLocale(['ja-JP', 'pt-BR', 'en-US'])).toBe('pt-BR');
  });
});

describe('isSupportedLocale', () => {
  it('aceita apenas os idiomas registrados', () => {
    expect(isSupportedLocale('pt-BR')).toBe(true);
    expect(isSupportedLocale('en-US')).toBe(true);
    expect(isSupportedLocale('es-ES')).toBe(false);
  });
});
