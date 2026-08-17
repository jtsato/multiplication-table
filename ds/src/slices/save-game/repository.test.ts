import { describe, expect, it } from "vitest";
import { SAVE_VERSION, migrateSave, type GameSave } from "./repository";
import type { BattleState } from "../battle/battle.types";

function saveValido(): GameSave {
  return {
    version: 1,
    locale: "pt-BR",
    progress: { stage: 1 },
    facts: [],
    battle: {
      phase: "question",
      hero: { nameKey: "battle.hero", maxHp: 30, hp: 30 },
      monster: { nameKey: "monster.slime", maxHp: 20, hp: 14, id: "slime", damage: 5 },
      question: { a: 6, b: 4, answer: 24 },
      alternatives: [24, 23, 25, 18],
      combo: 0,
      superReady: false,
      log: [],
    } as BattleState,
  };
}

describe("migrateSave", () => {
  it("aceita um save v1 válido e devolve o save tipado", () => {
    const save = saveValido();
    expect(migrateSave(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it("rejeita valores que não são objetos", () => {
    expect(() => migrateSave(null)).toThrow(/objeto/);
    expect(() => migrateSave("texto")).toThrow(/objeto/);
    expect(() => migrateSave(42)).toThrow(/objeto/);
  });

  it("rejeita versões de schema desconhecidas", () => {
    expect(() => migrateSave({ ...saveValido(), version: 0 })).toThrow(/versão/);
    expect(() => migrateSave({ ...saveValido(), version: 2 })).toThrow(/versão/);
    expect(() => migrateSave({ ...saveValido(), version: "x" })).toThrow(/versão/);
  });

  it("rejeita locale inválido", () => {
    expect(() => migrateSave({ ...saveValido(), locale: "fr-FR" })).toThrow(/locale/);
  });

  it("rejeita save sem batalha", () => {
    const semBatalha = { version: saveValido().version, locale: saveValido().locale };
    expect(() => migrateSave(semBatalha)).toThrow(/batalha/);
  });

  it("aceita battle null (jogador no menu)", () => {
    expect(migrateSave({ version: 1, locale: "pt-BR", battle: null })).toEqual({
      version: 1,
      locale: "pt-BR",
      progress: { stage: 0 },
      battle: null,
      facts: [],
    });
  });

  it("preenche o progresso padrão quando o save antigo não tem progresso", () => {
    const base = saveValido();
    const antigo = { version: base.version, locale: base.locale, battle: base.battle };
    const migrado = migrateSave(antigo);
    expect(migrado.progress).toEqual({ stage: 0 });
  });

  it("rejeita progresso inválido", () => {
    expect(() => migrateSave({ ...saveValido(), progress: { stage: -1 } })).toThrow(/progresso/);
    expect(() => migrateSave({ ...saveValido(), progress: "x" })).toThrow(/progresso/);
  });

  it("preenche o histórico de fatos vazio quando o save não tem facts", () => {
    const base = saveValido();
    const semFacts = { version: base.version, locale: base.locale, battle: base.battle };
    expect(migrateSave(semFacts).facts).toEqual([]);
  });

  it("mantém os fatos válidos do save", () => {
    const facts = [{ a: 6, b: 7, attempts: 2, errors: 1, lastSeenAt: 3 }];
    expect(migrateSave({ ...saveValido(), facts }).facts).toEqual(facts);
  });

  it("rejeita facts inválidos", () => {
    expect(() => migrateSave({ ...saveValido(), facts: "x" })).toThrow(/fatos/);
    expect(() =>
      migrateSave({
        ...saveValido(),
        facts: [{ a: 6, b: "x", attempts: 1, errors: 0, lastSeenAt: 0 }],
      }),
    ).toThrow(/fatos/);
  });

  it("a versão atual do schema é 1", () => {
    expect(SAVE_VERSION).toBe(1);
  });
});
