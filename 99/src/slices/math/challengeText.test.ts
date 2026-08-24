import { describe, expect, it } from 'vitest';
import { challengeText } from './challengeText';
import { generateChallenge } from './math.logic';
import { bundleFor } from '../../i18n';
import { RESOURCE_KINDS, type ResourceKind } from '../resources/resources.logic';
import { createRng } from '../../shared/rng';

const desafio = (groups: number, kind: ResourceKind = 'fruta', perGroup = 2) =>
  generateChallenge({ id: 'x', kind, groups, perGroup }, createRng(1));

const pt = bundleFor('pt-BR');
const en = bundleFor('en-US');

describe('o enunciado em portugues', () => {
  /**
   * Palavra por palavra igual ao que o jogo dizia antes do i18n. Esta entrega e
   * traducao, nao redacao: qualquer diferenca aqui e regressao, nao melhoria.
   */
  it('continua identico ao de antes da traducao', () => {
    expect(challengeText(desafio(4, 'fruta'), pt).prompt).toBe('4 cachos com 2 frutas cada');
    expect(challengeText(desafio(4, 'fruta'), pt).question).toBe('Quantas frutas ao todo?');
  });

  it('usa artigos definidos pela forma do item', () => {
    expect(challengeText(desafio(1, 'concha'), pt).prompt).toBe('1 cestinho com 2 conchas cada');
  });

  it('concorda o genero da pergunta com o substantivo do item', () => {
    expect(challengeText(desafio(3, 'fruta'), pt).question).toBe('Quantas frutas ao todo?');
    expect(challengeText(desafio(3, 'concha'), pt).question).toBe('Quantas conchas ao todo?');
    expect(challengeText(desafio(3, 'peixe'), pt).question).toBe('Quantos peixes ao todo?');
    expect(challengeText(desafio(3, 'peixe'), pt).question).toBe('Quantos peixes ao todo?');
  });

  it('usa o vocabulario proprio de cada tipo', () => {
    for (const kind of RESOURCE_KINDS) {
      const texto = challengeText(desafio(3, kind), pt);
      expect(texto.prompt).toContain(pt.resources[kind].group.many);
      expect(texto.prompt).toContain(pt.resources[kind].item.many);
    }
  });

  it('escreve os plurais irregulares como o idioma pede', () => {
    expect(challengeText(desafio(2, 'cristal'), pt).question).toContain('cristais');
  });
});

describe('o enunciado em ingles', () => {
  it('pergunta em ingles, sem genero para concordar', () => {
    expect(challengeText(desafio(4, 'fruta'), en).prompt).toBe('4 bunches with 2 berries each');
    expect(challengeText(desafio(4, 'fruta'), en).question).toBe('How many berries in total?');
  });

  it('respeita plural igual ao singular', () => {
    expect(challengeText(desafio(3, 'peixe'), en).question).toBe('How many fish in total?');
  });

  it('todo tipo tem enunciado nos dois idiomas', () => {
    for (const kind of RESOURCE_KINDS) {
      for (const pacote of [pt, en]) {
        const texto = challengeText(desafio(3, kind), pacote);
        expect(texto.prompt.length, kind).toBeGreaterThan(0);
        expect(texto.question.length, kind).toBeGreaterThan(0);
        expect(texto.prompt).not.toMatch(/\{\{/);
      }
    }
  });
});

describe('o idioma nao mexe na conta', () => {
  /**
   * A regra que separa dado de apresentacao: trocar de idioma repinta a frase e
   * nao toca no desafio. Se a resposta mudasse com o idioma, o enunciado teria
   * virado regra de jogo.
   */
  it('a mesma conta em qualquer idioma', () => {
    for (const kind of RESOURCE_KINDS) {
      const desafioAberto = desafio(7, kind, 6);
      expect(desafioAberto.answer).toBe(42);
      // As duas leituras do mesmo desafio descrevem a mesma quantidade.
      expect(challengeText(desafioAberto, pt).prompt).toContain('7');
      expect(challengeText(desafioAberto, en).prompt).toContain('7');
    }
  });
});
