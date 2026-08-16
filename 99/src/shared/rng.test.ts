import { describe, expect, it } from 'vitest';
import { createRng, pick, randomInt, randomRange, shuffle } from './rng';

describe('createRng', () => {
  it('produz a mesma sequencia para a mesma semente', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produz sequencias diferentes para sementes diferentes', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(Array.from({ length: 10 }, () => a())).not.toEqual(
      Array.from({ length: 10 }, () => b()),
    );
  });

  it('mantem os valores dentro de [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('randomInt', () => {
  it('respeita os limites, inclusive nas pontas', () => {
    const rng = createRng(99);
    for (let i = 0; i < 500; i += 1) {
      const value = randomInt(rng, 3, 6);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(6);
    }
  });

  it('devolve o unico valor possivel quando min === max', () => {
    const rng = createRng(5);
    expect(randomInt(rng, 4, 4)).toBe(4);
  });

  it('cobre todos os valores do intervalo ao longo de muitos sorteios', () => {
    const rng = createRng(11);
    const seen = new Set<number>();
    for (let i = 0; i < 400; i += 1) {
      seen.add(randomInt(rng, 1, 5));
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('randomRange', () => {
  it('mantem os valores dentro de [min, max)', () => {
    const rng = createRng(3);
    for (let i = 0; i < 300; i += 1) {
      const value = randomRange(rng, -5, 5);
      expect(value).toBeGreaterThanOrEqual(-5);
      expect(value).toBeLessThan(5);
    }
  });
});

describe('shuffle', () => {
  it('preserva todos os elementos', () => {
    const original = [1, 2, 3, 4, 5, 6];
    expect(shuffle(createRng(17), original).sort((a, b) => a - b)).toEqual(original);
  });

  it('nao muta o array original', () => {
    const original = [1, 2, 3, 4, 5];
    shuffle(createRng(4), original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('e deterministico para a mesma semente', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(shuffle(createRng(31), items)).toEqual(shuffle(createRng(31), items));
  });

  it('lida com array vazio e de um elemento', () => {
    expect(shuffle(createRng(1), [])).toEqual([]);
    expect(shuffle(createRng(1), ['so'])).toEqual(['so']);
  });

  it('distribui cada elemento por todas as posicoes — sem vies', () => {
    // Com 3 elementos e muitos sorteios, cada um deve cair em cada posicao.
    const posicoes = new Map<string, Set<number>>();
    const rng = createRng(2026);
    for (let i = 0; i < 600; i += 1) {
      shuffle(rng, ['a', 'b', 'c']).forEach((item, index) => {
        if (!posicoes.has(item)) posicoes.set(item, new Set());
        posicoes.get(item)!.add(index);
      });
    }
    for (const item of ['a', 'b', 'c']) {
      expect([...posicoes.get(item)!].sort()).toEqual([0, 1, 2]);
    }
  });
});

describe('pick', () => {
  it('sempre devolve um elemento da lista', () => {
    const rng = createRng(23);
    const items = ['arvore', 'moita', 'pedra'] as const;
    for (let i = 0; i < 100; i += 1) {
      expect(items).toContain(pick(rng, items));
    }
  });

  it('lanca erro em lista vazia', () => {
    const rng = createRng(1);
    expect(() => pick(rng, [])).toThrow(/nao vazio/);
  });
});
