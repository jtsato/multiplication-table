import { describe, expect, it } from "vitest";
import { SAVE_VERSION, migrateSave, type GameSave } from "./repository";
import type { BattleState } from "../battle/battle.types";
import { DEFAULT_AVATAR_SELECTION } from "../avatar/avatar";

function saveValido(): GameSave {
  return {
    version: 3,
    locale: "pt-BR",
    avatar: { classId: "elf", colorId: "forest" },
    progress: { stage: 1 },
    facts: [],
    totalXp: 120,
    battle: {
      phase: "question",
      hero: { nameKey: "battle.hero", maxHp: 3, hp: 3 },
      monster: { nameKey: "monster.avenger", maxHp: 20, hp: 14, id: "avenger", damage: 5 },
      question: { a: 6, b: 4, answer: 24 },
      alternatives: [24, 23, 25, 18],
      combo: 1,
      xp: 10,
      log: [],
    } as BattleState,
  };
}

describe("migrateSave", () => {
  it("aceita um save v3 válido e devolve o save tipado", () => {
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
    expect(() => migrateSave({ ...saveValido(), version: 4 })).toThrow(/versão/);
    expect(() => migrateSave({ ...saveValido(), version: "x" })).toThrow(/versão/);
  });

  it("rejeita locale inválido", () => {
    expect(() => migrateSave({ ...saveValido(), locale: "fr-FR" })).toThrow(/locale/);
  });

  it("rejeita save sem batalha", () => {
    const semBatalha = {
      version: saveValido().version,
      locale: saveValido().locale,
      avatar: saveValido().avatar,
      totalXp: saveValido().totalXp,
    };
    expect(() => migrateSave(semBatalha)).toThrow(/batalha/);
  });

  it("aceita battle null (jogador no menu)", () => {
    expect(migrateSave({ version: 3, locale: "pt-BR", battle: null })).toEqual({
      version: 3,
      locale: "pt-BR",
      avatar: DEFAULT_AVATAR_SELECTION,
      progress: { stage: 0 },
      battle: null,
      facts: [],
      totalXp: 0,
    });
  });

  it("preenche avatar padrão quando o save v3 não tem avatar", () => {
    const base = saveValido();
    const semAvatar = {
      version: base.version,
      locale: base.locale,
      progress: base.progress,
      battle: base.battle,
      totalXp: base.totalXp,
    };
    expect(migrateSave(semAvatar).avatar).toEqual(DEFAULT_AVATAR_SELECTION);
  });

  it("rejeita avatar inválido no save v3", () => {
    expect(() =>
      migrateSave({ ...saveValido(), avatar: { classId: "mage", colorId: "gold" } }),
    ).toThrow(/avatar/);
  });

  it("preenche o progresso padrão quando o save v3 não tem progresso", () => {
    const base = saveValido();
    const antigo = {
      version: base.version,
      locale: base.locale,
      avatar: base.avatar,
      battle: base.battle,
      totalXp: base.totalXp,
    };
    const migrado = migrateSave(antigo);
    expect(migrado.progress).toEqual({ stage: 0 });
  });

  it("rejeita progresso inválido", () => {
    expect(() => migrateSave({ ...saveValido(), progress: { stage: -1 } })).toThrow(/progresso/);
    expect(() => migrateSave({ ...saveValido(), progress: "x" })).toThrow(/progresso/);
  });

  it("preenche o histórico de fatos vazio quando o save não tem facts", () => {
    const base = saveValido();
    const semFacts = {
      version: base.version,
      locale: base.locale,
      avatar: base.avatar,
      battle: base.battle,
      totalXp: base.totalXp,
    };
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

  it("preenche XP total zero quando o save v3 não tem totalXp", () => {
    const base = saveValido();
    const semXp = {
      version: base.version,
      locale: base.locale,
      avatar: base.avatar,
      progress: base.progress,
      battle: base.battle,
      facts: base.facts,
    };
    expect(migrateSave(semXp).totalXp).toBe(0);
  });

  it("rejeita XP total inválido", () => {
    expect(() => migrateSave({ ...saveValido(), totalXp: -1 })).toThrow(/xp/);
    expect(() => migrateSave({ ...saveValido(), totalXp: "muito" })).toThrow(/xp/);
  });

  it("migra um save v1 para v3 com avatar padrão, jornada reiniciada e XP zerado", () => {
    const v1 = {
      version: 1,
      locale: "pt-BR",
      battle: null,
      facts: [{ a: 2, b: 3, attempts: 1, errors: 1, lastSeenAt: 0 }],
    };
    expect(migrateSave(v1)).toEqual({
      version: 3,
      locale: "pt-BR",
      avatar: DEFAULT_AVATAR_SELECTION,
      progress: { stage: 0 },
      battle: null,
      facts: [{ a: 2, b: 3, attempts: 1, errors: 1, lastSeenAt: 0 }],
      totalXp: 0,
    });
  });

  it("migra um save v2 para v3 preservando progresso e adicionando XP zerado", () => {
    const v2 = {
      version: 2,
      locale: "pt-BR",
      avatar: { classId: "dwarf", colorId: "steel" },
      progress: { stage: 3 },
      battle: null,
      facts: [{ a: 4, b: 5, attempts: 1, errors: 0, lastSeenAt: 1 }],
    };
    expect(migrateSave(v2)).toEqual({
      version: 3,
      locale: "pt-BR",
      avatar: { classId: "dwarf", colorId: "steel" },
      progress: { stage: 3 },
      battle: null,
      facts: [{ a: 4, b: 5, attempts: 1, errors: 0, lastSeenAt: 1 }],
      totalXp: 0,
    });
  });

  it("a versão atual do schema é 3", () => {
    expect(SAVE_VERSION).toBe(3);
  });
});
