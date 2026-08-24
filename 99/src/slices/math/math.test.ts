import { describe, expect, it } from 'vitest';
import { OPTION_COUNT, buildDistractors, generateChallenge, resolveAnswer } from './math.logic';
import { type ResourceKind, type ResourceNode } from '../resources/resources.logic';
import { createRng } from '../../shared/rng';
import { vec3 } from '../../shared/vec';

const node = (groups: number, kind: ResourceKind = 'concha', perGroup = 2): ResourceNode => ({
  id: `no-${groups}x${perGroup}`,
  kind,
  position: vec3(0, 0, 0),
  groups,
  perGroup,
  depleted: false,
});

/** As dez tabuadas que o jogo passa a cobrir. */
const TABUADAS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Toda a grade: 1 a 10 grupos, nas dez tabuadas, nos tres tipos originais. */
const todosOsNos = (['concha', 'fruta', 'pedra'] as const).flatMap((kind) =>
  TABUADAS.flatMap((perGroup) => Array.from({ length: 10 }, (_, i) => node(i + 1, kind, perGroup))),
);

describe('generateChallenge', () => {
  /**
   * A tabuada vem do no, e nao de uma constante global. E o que faz a regiao
   * mandar no curriculo — sem isto o jogo inteiro fica preso no 2.
   */
  it('tira a tabuada do proprio no', () => {
    for (const alvo of todosOsNos) {
      expect(generateChallenge(alvo, createRng(1)).perGroup).toBe(alvo.perGroup);
    }
  });

  it('calcula a resposta corretamente, em qualquer tabuada', () => {
    for (const alvo of todosOsNos) {
      const challenge = generateChallenge(alvo, createRng(2));
      expect(challenge.answer).toBe(alvo.groups * alvo.perGroup);
    }
  });

  it('tira o multiplicando do que o no exibe na cena', () => {
    for (const alvo of todosOsNos) {
      expect(generateChallenge(alvo, createRng(3)).groups).toBe(alvo.groups);
    }
  });

  it('oferece exatamente 3 alternativas distintas', () => {
    for (const alvo of todosOsNos) {
      const { options } = generateChallenge(alvo, createRng(alvo.groups));
      expect(options).toHaveLength(OPTION_COUNT);
      expect(new Set(options).size).toBe(OPTION_COUNT);
    }
  });

  it('sempre inclui a resposta certa entre as alternativas', () => {
    for (const alvo of todosOsNos) {
      for (let seed = 0; seed < 25; seed += 1) {
        const challenge = generateChallenge(alvo, createRng(seed));
        expect(challenge.options).toContain(challenge.answer);
      }
    }
  });

  it('nunca oferece alternativa zero ou negativa', () => {
    for (const alvo of todosOsNos) {
      for (let seed = 0; seed < 25; seed += 1) {
        for (const option of generateChallenge(alvo, createRng(seed)).options) {
          expect(option).toBeGreaterThan(0);
        }
      }
    }
  });

  it('nao coloca a resposta certa sempre na mesma posicao', () => {
    const posicoes = new Set<number>();
    const rng = createRng(2026);
    for (let i = 0; i < 60; i += 1) {
      const challenge = generateChallenge(node(4), rng);
      posicoes.add(challenge.options.indexOf(challenge.answer));
    }
    // Se a resposta caisse sempre no mesmo lugar, dava para acertar sem contar.
    expect(posicoes.size).toBe(OPTION_COUNT);
  });

  it('e deterministico para a mesma semente', () => {
    expect(generateChallenge(node(6), createRng(9))).toEqual(
      generateChallenge(node(6), createRng(9)),
    );
  });
});

describe('buildDistractors', () => {
  it('devolve a quantidade certa de distratores', () => {
    for (const perGroup of TABUADAS) {
      for (let groups = 1; groups <= 10; groups += 1) {
        expect(buildDistractors(groups, perGroup, createRng(groups))).toHaveLength(
          OPTION_COUNT - 1,
        );
      }
    }
  });

  it('nunca repete a resposta certa', () => {
    for (const perGroup of TABUADAS) {
      for (let groups = 1; groups <= 10; groups += 1) {
        for (let seed = 0; seed < 10; seed += 1) {
          const answer = groups * perGroup;
          expect(buildDistractors(groups, perGroup, createRng(seed))).not.toContain(answer);
        }
      }
    }
  });

  it('nunca repete um distrator', () => {
    for (const perGroup of TABUADAS) {
      for (let groups = 1; groups <= 10; groups += 1) {
        const distractors = buildDistractors(groups, perGroup, createRng(groups));
        expect(new Set(distractors).size).toBe(distractors.length);
      }
    }
  });

  it('mantem todos os distratores positivos, inclusive no caso minimo', () => {
    // groups = 1 -> a resposta e o proprio perGroup; `answer - perGroup` daria 0
    // e precisa ser descartado, em qualquer tabuada.
    for (const perGroup of TABUADAS) {
      for (let seed = 0; seed < 20; seed += 1) {
        for (const d of buildDistractors(1, perGroup, createRng(seed))) {
          expect(d).toBeGreaterThan(0);
        }
      }
    }
  });

  it('inclui o erro de somar em vez de multiplicar entre os candidatos', () => {
    // Para 5 grupos de 7: somar daria 12, multiplicar da 35. E o erro mais comum
    // nesta idade, e precisa continuar entre as alternativas em toda tabuada.
    for (const perGroup of TABUADAS) {
      const vistos = new Set<number>();
      const rng = createRng(5);
      for (let i = 0; i < 80; i += 1) {
        buildDistractors(5, perGroup, rng).forEach((d) => vistos.add(d));
      }
      expect(vistos).toContain(5 + perGroup);
    }
  });

  it('mantem os distratores proximos da resposta — nada absurdo', () => {
    for (const perGroup of TABUADAS) {
      for (let groups = 1; groups <= 10; groups += 1) {
        const answer = groups * perGroup;
        for (const d of buildDistractors(groups, perGroup, createRng(groups))) {
          expect(Math.abs(d - answer)).toBeLessThanOrEqual(answer + perGroup * 2);
        }
      }
    }
  });
});

describe('resolveAnswer', () => {
  const challenge = generateChallenge(node(5), createRng(1));

  it('entrega a colheita cheia no acerto', () => {
    expect(resolveAnswer(challenge, challenge.answer)).toEqual({
      correct: true,
      reward: challenge.answer,
    });
  });

  it('entrega recompensa parcial no erro', () => {
    const outcome = resolveAnswer(challenge, challenge.answer + 1);
    expect(outcome.correct).toBe(false);
    expect(outcome.reward).toBeLessThan(challenge.answer);
  });

  it('nunca deixa a crianca de maos vazias', () => {
    for (let groups = 1; groups <= 10; groups += 1) {
      const c = generateChallenge(node(groups), createRng(groups));
      // Erra em todas as alternativas erradas possiveis.
      for (const option of c.options.filter((o) => o !== c.answer)) {
        expect(resolveAnswer(c, option).reward).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('a recompensa do erro nunca supera a do acerto', () => {
    for (let groups = 1; groups <= 10; groups += 1) {
      const c = generateChallenge(node(groups), createRng(groups));
      expect(resolveAnswer(c, c.answer + 3).reward).toBeLessThanOrEqual(
        resolveAnswer(c, c.answer).reward,
      );
    }
  });
});
