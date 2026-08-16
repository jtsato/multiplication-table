import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_CONTEXTS,
  OPTION_COUNT,
  TABLE,
  buildDistractors,
  generateChallenge,
  resolveAnswer,
} from './math.logic';
import { RESOURCES, type ResourceKind, type ResourceNode } from '../resources/resources.logic';
import { createRng } from '../../shared/rng';
import { vec3 } from '../../shared/vec';

const node = (groups: number, kind: ResourceKind = 'madeira'): ResourceNode => ({
  id: `no-${groups}`,
  kind,
  position: vec3(0, 0, 0),
  groups,
  depleted: false,
});

/** Todos os nós possíveis desta POC: 1 a 10 grupos, nos três tipos. */
const todosOsNos = (['madeira', 'fruta', 'pedra'] as const).flatMap((kind) =>
  Array.from({ length: 10 }, (_, i) => node(i + 1, kind)),
);

describe('generateChallenge', () => {
  it('usa sempre a tabuada do 2 — escopo da POC', () => {
    for (const alvo of todosOsNos) {
      expect(generateChallenge(alvo, createRng(1)).perGroup).toBe(TABLE);
    }
  });

  it('calcula a resposta corretamente', () => {
    for (const alvo of todosOsNos) {
      const challenge = generateChallenge(alvo, createRng(2));
      expect(challenge.answer).toBe(alvo.groups * RESOURCES.itemsPerGroup);
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

  it('descreve em palavras exatamente o que esta na cena', () => {
    const challenge = generateChallenge(node(4, 'fruta'), createRng(1));
    expect(challenge.prompt).toBe('4 cachos com 2 frutas cada');
    expect(challenge.question).toBe('Quantas frutas ao todo?');
  });

  it('concorda o singular quando ha um unico grupo', () => {
    expect(generateChallenge(node(1, 'madeira'), createRng(1)).prompt).toBe(
      '1 galho com 2 gravetos cada',
    );
  });

  it('concorda o genero da pergunta com o substantivo do item', () => {
    expect(generateChallenge(node(3, 'madeira'), createRng(1)).question).toBe(
      'Quantos gravetos ao todo?',
    );
    expect(generateChallenge(node(3, 'fruta'), createRng(1)).question).toBe(
      'Quantas frutas ao todo?',
    );
    expect(generateChallenge(node(3, 'pedra'), createRng(1)).question).toBe(
      'Quantas pedras ao todo?',
    );
  });

  it('usa o vocabulario proprio de cada tipo de recurso', () => {
    for (const kind of ['madeira', 'fruta', 'pedra'] as const) {
      const challenge = generateChallenge(node(3, kind), createRng(1));
      expect(challenge.prompt).toContain(CHALLENGE_CONTEXTS[kind].groupNoun.many);
      expect(challenge.prompt).toContain(CHALLENGE_CONTEXTS[kind].itemNoun.many);
    }
  });
});

describe('buildDistractors', () => {
  it('devolve a quantidade certa de distratores', () => {
    for (let groups = 1; groups <= 10; groups += 1) {
      expect(buildDistractors(groups, TABLE, createRng(groups))).toHaveLength(OPTION_COUNT - 1);
    }
  });

  it('nunca repete a resposta certa', () => {
    for (let groups = 1; groups <= 10; groups += 1) {
      for (let seed = 0; seed < 30; seed += 1) {
        const answer = groups * TABLE;
        expect(buildDistractors(groups, TABLE, createRng(seed))).not.toContain(answer);
      }
    }
  });

  it('nunca repete um distrator', () => {
    for (let groups = 1; groups <= 10; groups += 1) {
      const distractors = buildDistractors(groups, TABLE, createRng(groups));
      expect(new Set(distractors).size).toBe(distractors.length);
    }
  });

  it('mantem todos os distratores positivos, inclusive no caso minimo', () => {
    // groups = 1 -> resposta 2; `answer - perGroup` daria 0 e precisa ser descartado.
    for (let seed = 0; seed < 40; seed += 1) {
      for (const d of buildDistractors(1, TABLE, createRng(seed))) {
        expect(d).toBeGreaterThan(0);
      }
    }
  });

  it('inclui o erro de somar em vez de multiplicar entre os candidatos', () => {
    // Para 5 grupos de 2: somar daria 7, multiplicar da 10.
    const vistos = new Set<number>();
    const rng = createRng(5);
    for (let i = 0; i < 80; i += 1) {
      buildDistractors(5, TABLE, rng).forEach((d) => vistos.add(d));
    }
    expect(vistos).toContain(5 + TABLE);
  });

  it('mantem os distratores proximos da resposta — nada absurdo', () => {
    for (let groups = 1; groups <= 10; groups += 1) {
      const answer = groups * TABLE;
      for (const d of buildDistractors(groups, TABLE, createRng(groups))) {
        expect(Math.abs(d - answer)).toBeLessThanOrEqual(answer + TABLE * 2);
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
