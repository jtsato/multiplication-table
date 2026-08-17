import { describe, expect, it } from "vitest";
import {
  factWeight,
  factsInTables,
  markSeen,
  pickFact,
  pickNextFact,
  recordAnswer,
  upsertFact,
  type FactStats,
} from "./adaptive-review";
import { seededRng } from "../../shared/test/rng";
import type { Rng } from "../math-question/question.types";

const base = (overrides: Partial<FactStats> = {}): FactStats => ({
  a: 6,
  b: 7,
  attempts: 1,
  errors: 0,
  lastSeenAt: 0,
  ...overrides,
});

describe("markSeen", () => {
  it("registra o fato visto agora mantendo o histórico", () => {
    expect(markSeen(base(), { a: 6, b: 7, answer: 42 }, 5)).toEqual({ ...base(), lastSeenAt: 5 });
  });

  it("cria o registro quando o fato é novo", () => {
    expect(markSeen(undefined, { a: 3, b: 4, answer: 12 }, 5)).toEqual({
      a: 3,
      b: 4,
      attempts: 0,
      errors: 0,
      lastSeenAt: 5,
    });
  });
});

describe("recordAnswer", () => {
  it("acerto incrementa tentativas sem erros", () => {
    expect(recordAnswer(base({ attempts: 2 }), true)).toEqual({
      ...base({ attempts: 2 }),
      attempts: 3,
      errors: 0,
    });
  });

  it("erro incrementa tentativas e erros", () => {
    expect(recordAnswer(base({ attempts: 2 }), false)).toEqual({
      ...base({ attempts: 2 }),
      attempts: 3,
      errors: 1,
    });
  });
});

describe("factWeight", () => {
  it("fato novo e nunca visto tem peso alto (frescor)", () => {
    const novo = { a: 2, b: 3, attempts: 0, errors: 0, lastSeenAt: 0 };
    expect(factWeight(novo, 10)).toBe(1 + Math.min(10, 8));
  });

  it("fato recém-visto tem o peso mínimo", () => {
    expect(factWeight(base({ lastSeenAt: 10 }), 10)).toBe(1);
  });

  it("erros aumentam o peso (reforço das difíceis)", () => {
    const comErros = base({ errors: 2, lastSeenAt: 10 });
    expect(factWeight(comErros, 10)).toBe(1 + 6);
  });

  it("peso nunca é negativo", () => {
    expect(factWeight(base({ lastSeenAt: 100 }), 10)).toBeGreaterThan(0);
  });
});

describe("pickFact", () => {
  it("prefere o fato com maior peso quando a rolagem cai nele", () => {
    const facil = base({ a: 2, b: 3, errors: 0, lastSeenAt: 50 });
    const dificil = base({ a: 6, b: 7, errors: 5, lastSeenAt: 0 });
    const rng: Rng = () => 0.99; // cai no final (fato difícil, peso maior)
    expect(pickFact([facil, dificil], rng, 60)).toEqual({ a: 6, b: 7, answer: 42 });
  });

  it("com rng zerada escolhe o primeiro candidato", () => {
    const a = base({ a: 2, b: 3 });
    const b = base({ a: 4, b: 5, errors: 9 });
    const rng: Rng = () => 0;
    expect(pickFact([a, b], rng, 10)).toEqual({ a: 2, b: 3, answer: 6 });
  });

  it("rolagem exata no limite escolhe o primeiro candidato", () => {
    const a = base({ a: 2, b: 3 });
    const b = base({ a: 4, b: 5 });
    const rng: Rng = () => 0.5; // roll = metade do total (limite exato)
    expect(pickFact([a, b], rng, 10)).toEqual({ a: 2, b: 3, answer: 6 });
  });

  it("fatos nunca vistos entram no sorteio com peso de frescor", () => {
    const visto = base({ lastSeenAt: 0 });
    const facts = [visto];
    // Se o pool só tem fatos vistos, o sorteio devolve um deles.
    const escolhido = pickFact(facts, seededRng(1), 100);
    expect(escolhido.a * escolhido.b).toBe(42);
  });
});

describe("pickNextFact", () => {
  it("monta o pool completo das tabuadas (fatos novos incluídos)", () => {
    const fact = pickNextFact([2, 3], [], seededRng(2), 5);
    expect(fact.a).toBeGreaterThanOrEqual(2);
    expect(fact.b).toBeLessThanOrEqual(3);
    expect(fact.answer).toBe(fact.a * fact.b);
  });

  it("fatos com erros anteriores têm prioridade no sorteio", () => {
    const facts = [
      base({ a: 6, b: 7, errors: 4, lastSeenAt: 0 }),
      base({ a: 2, b: 3, errors: 0, lastSeenAt: 50 }),
    ];
    // Pool [2,3,6,7]: pesos 9×9 + 21 (6,7). Rolagem 0.8 → total 102 × 0.8 =
    // 81.6, que cai na janela do (6,7) [72, 93): o fato difícil vence.
    const rng: Rng = () => 0.8;
    const escolhido = pickNextFact([2, 3, 6, 7], facts, rng, 60);
    expect(escolhido).toEqual({ a: 6, b: 7, answer: 42 });
  });

  it("aplica os stats de erro ao candidato certo do pool", () => {
    const facts = [base({ a: 2, b: 3, errors: 9, lastSeenAt: 0 })];
    // Original: (2,3) pesa 36; rolagem 0.2 (roll 10.8) cai na janela dele [9, 45).
    // Se os stats fossem aplicados ao candidato errado, o sorteio mudaria.
    const rng: Rng = () => 0.2;
    expect(pickNextFact([2, 3], facts, rng, 60)).toEqual({ a: 2, b: 3, answer: 6 });
  });

  it("sorteio com dois fatos difíceis mantém o par correto", () => {
    const facts = [
      base({ a: 2, b: 3, errors: 9, lastSeenAt: 0 }),
      base({ a: 4, b: 5, errors: 9, lastSeenAt: 0 }),
    ];
    // Original: (4,5) pesa 36; rolagem 0.8 (roll 115.2) cai na janela dele [99, 135).
    // Se o primeiro fato fosse aplicado a todos os candidatos, viraria (2,3).
    const rng: Rng = () => 0.8;
    expect(pickNextFact([2, 3, 4, 5], facts, rng, 60)).toEqual({ a: 4, b: 5, answer: 20 });
  });

  it("stats de erro não vazam para fatos que compartilham o fator b", () => {
    const facts = [
      base({ a: 3, b: 3, errors: 9, lastSeenAt: 0 }),
      base({ a: 2, b: 3, errors: 0, lastSeenAt: 0 }),
    ];
    // Original: (2,3) pesa 9 e é escolhido com rolagem 0.25 (roll 13.5).
    // Se o stats do (3,3) vazasse para qualquer b === 3, viraria (2,2).
    const rng: Rng = () => 0.25;
    expect(pickNextFact([2, 3], facts, rng, 60)).toEqual({ a: 2, b: 3, answer: 6 });
  });

  it("stats não vazam entre fatos que compartilham o fator a", () => {
    const facts = [
      base({ a: 2, b: 3, errors: 9, lastSeenAt: 0 }),
      base({ a: 2, b: 4, errors: 0, lastSeenAt: 0 }),
    ];
    // Original: (2,4) tem peso 9; rolagem 0.6 (roll 48.6) cai na janela dele [45, 54).
    // Se o stats do (2,3) vazasse para qualquer a === 2 (ou b !== 4), viraria (2,3).
    const rng: Rng = () => 0.6;
    expect(pickNextFact([2, 3, 4], facts, rng, 60)).toEqual({ a: 2, b: 4, answer: 8 });
  });
});

describe("factsInTables", () => {
  it("inclui os quadrados (a === b) e pares desordenados", () => {
    const pool = factsInTables([2, 3]);
    expect(pool).toContainEqual({ a: 2, b: 2, attempts: 0, errors: 0, lastSeenAt: 0 });
    expect(pool).toContainEqual({ a: 3, b: 3, attempts: 0, errors: 0, lastSeenAt: 0 });
    expect(pool).toContainEqual({ a: 2, b: 3, attempts: 0, errors: 0, lastSeenAt: 0 });
    expect(pool).toHaveLength(3);
  });
});

describe("upsertFact", () => {
  it("substitui um fato existente no índice correto", () => {
    const a = base({ a: 2, b: 3 });
    const b = base({ a: 4, b: 5 });
    const atualizado = base({ a: 4, b: 5, errors: 2 });
    expect(upsertFact([a, b], atualizado)).toEqual([a, atualizado]);
  });

  it("adiciona um fato novo ao final", () => {
    const a = base({ a: 2, b: 3 });
    const novo = base({ a: 7, b: 8 });
    expect(upsertFact([a], novo)).toEqual([a, novo]);
  });

  it("não confunde fatos que compartilham fatores", () => {
    const a = base({ a: 2, b: 5 });
    const c = base({ a: 4, b: 3 });
    const novo = base({ a: 2, b: 3 });
    expect(upsertFact([a, c], novo)).toEqual([a, c, novo]);
  });
});
