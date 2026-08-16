import { describe, expect, it } from 'vitest';
import { DICTIONARIES, collectKeys, interpolate, translate, translateList } from '../i18n/translate';
import { ACHIEVEMENTS } from '../domain/achievements';
import { ISLANDS } from '../domain/world';

describe('dicionários', () => {
  it('pt-BR e en-US têm exatamente as mesmas chaves', () => {
    expect(collectKeys(DICTIONARIES['en-US'])).toEqual(collectKeys(DICTIONARIES['pt-BR']));
  });

  it('cobre todas as ilhas e biomas', () => {
    for (const island of ISLANDS) {
      expect(translate('pt-BR', island.nameKey)).not.toBe(island.nameKey);
      expect(translate('en-US', island.biomeKey)).not.toBe(island.biomeKey);
    }
  });

  it('cobre todas as missões', () => {
    for (const island of ISLANDS) {
      for (const mission of island.missions) {
        expect(translate('pt-BR', mission.titleKey)).not.toBe(mission.titleKey);
        expect(translate('en-US', mission.briefKey)).not.toBe(mission.briefKey);
      }
    }
  });

  it('cobre todas as conquistas', () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(translate('en-US', `achievements.${achievement.id}.name`)).not.toContain('achievements.');
      expect(translate('pt-BR', `achievements.${achievement.id}.description`)).not.toContain('achievements.');
    }
  });
});

describe('translate', () => {
  it('interpola parâmetros', () => {
    expect(translate('pt-BR', 'play.question', { a: 4, b: 6 })).toBe('4 × 6 = ?');
    expect(translate('en-US', 'play.question', { a: 4, b: 6 })).toBe('4 × 6 = ?');
  });

  it('devolve a chave quando não existe tradução', () => {
    expect(translate('pt-BR', 'nao.existe')).toBe('nao.existe');
  });

  it('lê listas de mensagens', () => {
    expect(translateList('pt-BR', 'play.correct').length).toBeGreaterThan(1);
    expect(translateList('en-US', 'play.wrong').length).toBeGreaterThan(1);
  });

  it('mantém o placeholder quando o parâmetro não é passado', () => {
    expect(interpolate('Oi {{name}}')).toBe('Oi {{name}}');
    expect(interpolate('Oi {{name}}', { name: 'Ana' })).toBe('Oi Ana');
  });
});
