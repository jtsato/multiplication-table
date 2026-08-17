import { describe, expect, it } from "vitest";
import { createBattle, battleReducer, hpRatio, HERO_MAX_HP } from "./battle";
import { SLIME } from "./monsters";
import { HERO_BASE_DAMAGE } from "../player-attack/player-attack";
import type { BattleState } from "./battle.types";

describe("createBattle", () => {
  const battle: BattleState = createBattle(SLIME);

  it("começa na fase intro", () => {
    expect(battle.phase).toBe("intro");
  });

  it("herói nasce com HP cheio", () => {
    expect(battle.hero.hp).toBe(battle.hero.maxHp);
    expect(battle.hero.maxHp).toBeGreaterThan(0);
    expect(battle.hero.nameKey).toBe("battle.hero");
  });

  it("monstro nasce com HP cheio e mantém sua especificação", () => {
    expect(battle.monster.hp).toBe(SLIME.maxHp);
    expect(battle.monster.maxHp).toBe(SLIME.maxHp);
    expect(battle.monster.nameKey).toBe("monster.slime");
  });

  it("combo e super ataque começam zerados", () => {
    expect(battle.combo).toBe(0);
    expect(battle.superReady).toBe(false);
  });

  it("começa com registro de batalha vazio", () => {
    expect(battle.log).toEqual([]);
  });
});

describe("battleReducer", () => {
  it("START_BATTLE cria uma batalha nova e íntegra", () => {
    const anterior: BattleState = createBattle(SLIME);
    const novo = battleReducer(anterior, { type: "START_BATTLE", monster: SLIME });

    expect(novo).not.toBe(anterior);
    expect(novo.phase).toBe("intro");
    expect(novo.hero.hp).toBe(novo.hero.maxHp);
    expect(novo.monster.hp).toBe(SLIME.maxHp);
    expect(novo.combo).toBe(0);
    expect(novo.superReady).toBe(false);
  });

  it("ações desconhecidas são ignoradas (estado preservado)", () => {
    const estado: BattleState = createBattle(SLIME);
    expect(battleReducer(estado, { type: "ACÃO_DESCONHECIDA" } as never)).toBe(estado);
  });
});

describe("battleReducer — perguntas (Slice 2)", () => {
  const QUESTION = { a: 6, b: 4, answer: 24 };
  const ALTERNATIVES = [24, 23, 25, 18];

  function comPergunta() {
    return battleReducer(createBattle(SLIME), {
      type: "BEGIN_QUESTION",
      question: QUESTION,
      alternatives: ALTERNATIVES,
    });
  }

  it("BEGIN_QUESTION entra na fase question com a pergunta", () => {
    const estado = comPergunta();
    expect(estado.phase).toBe("question");
    expect(estado.question).toEqual(QUESTION);
    expect(estado.alternatives).toEqual(ALTERNATIVES);
  });

  it("acertar reduz o HP do slime pelo dano base e anuncia", () => {
    const acerto = battleReducer(comPergunta(), { type: "ANSWER", value: 24 });
    expect(acerto.monster.hp).toBe(SLIME.maxHp - HERO_BASE_DAMAGE);
    expect(acerto.phase).toBe("hero-turn");
    expect(acerto.log.at(-1)).toEqual({
      key: "battle.correct",
      params: { damage: HERO_BASE_DAMAGE },
    });
    expect(acerto.combo).toBe(1); // combo entra em ação na Slice 4
    expect(acerto.superReady).toBe(false);
  });

  it("errar faz o monstro atacar e reduz o HP do herói", () => {
    const erro = battleReducer(comPergunta(), { type: "ANSWER", value: 23 });
    expect(erro.hero.hp).toBe(HERO_MAX_HP - SLIME.damage);
    expect(erro.monster.hp).toBe(SLIME.maxHp);
    expect(erro.phase).toBe("monster-turn");
    expect(erro.log.at(-1)).toEqual({
      key: "battle.almost",
      params: { a: 6, b: 4, answer: 24, damage: SLIME.damage },
    });
  });

  it("errar que zera o HP do herói entra em defeat", () => {
    const feroz = { id: "feroz", nameKey: "monster.slime" as const, maxHp: 20, damage: 99 };
    const comPerguntaFeroz = battleReducer(createBattle(feroz), {
      type: "BEGIN_QUESTION",
      question: QUESTION,
      alternatives: ALTERNATIVES,
    });
    const derrota = battleReducer(comPerguntaFeroz, { type: "ANSWER", value: 23 });
    expect(derrota.hero.hp).toBe(0);
    expect(derrota.phase).toBe("defeat");
  });

  it("acertar que zera o HP do monstro entra em victory", () => {
    const fraco = {
      id: "fraco",
      nameKey: "monster.slime" as const,
      maxHp: HERO_BASE_DAMAGE,
      damage: 5,
    };
    const comPerguntaFraco = battleReducer(createBattle(fraco), {
      type: "BEGIN_QUESTION",
      question: QUESTION,
      alternatives: ALTERNATIVES,
    });
    const morte = battleReducer(comPerguntaFraco, { type: "ANSWER", value: 24 });
    expect(morte.monster.hp).toBe(0);
    expect(morte.phase).toBe("victory");
  });

  it("ANSWER é ignorado fora da fase question", () => {
    const intro: BattleState = createBattle(SLIME);
    expect(battleReducer(intro, { type: "ANSWER", value: 24 })).toBe(intro);
    const vitoria: BattleState = { ...comPergunta(), phase: "victory" };
    expect(battleReducer(vitoria, { type: "ANSWER", value: 24 })).toBe(vitoria);
  });
});

describe("battleReducer — combo (Slice 4)", () => {
  const QUESTION = { a: 6, b: 4, answer: 24 };
  const ALTERNATIVES = [24, 23, 25, 18];

  function comPergunta() {
    return battleReducer(createBattle(SLIME), {
      type: "BEGIN_QUESTION",
      question: QUESTION,
      alternatives: ALTERNATIVES,
    });
  }

  function acertar(estado: BattleState): BattleState {
    return battleReducer(estado, { type: "ANSWER", value: 24 });
  }

  function proximaPergunta(estado: BattleState): BattleState {
    return battleReducer(estado, {
      type: "BEGIN_QUESTION",
      question: QUESTION,
      alternatives: ALTERNATIVES,
    });
  }

  it("cada acerto incrementa o combo", () => {
    let estado = proximaPergunta(acertar(comPergunta()));
    estado = acertar(estado);
    expect(estado.combo).toBe(2);
  });

  it("o terceiro acerto libera o super ataque", () => {
    let estado = comPergunta();
    for (let i = 0; i < 2; i += 1) {
      estado = proximaPergunta(acertar(estado));
      expect(estado.superReady).toBe(false);
    }
    estado = acertar(estado);
    expect(estado.combo).toBe(3);
    expect(estado.superReady).toBe(true);
  });

  it("errar zera o combo e o super ataque", () => {
    let estado = comPergunta();
    estado = proximaPergunta(acertar(estado));
    estado = proximaPergunta(acertar(estado));
    expect(estado.combo).toBe(2);
    const erro = battleReducer(estado, { type: "ANSWER", value: 23 });
    expect(erro.combo).toBe(0);
    expect(erro.superReady).toBe(false);
  });

  it("BEGIN_QUESTION preserva o combo", () => {
    const proximo = proximaPergunta(acertar(comPergunta()));
    expect(proximo.combo).toBe(1);
  });
});

describe("hpRatio", () => {
  it("calcula a proporção normal de HP", () => {
    expect(hpRatio(10, 20)).toBe(0.5);
  });

  it("nunca fica abaixo de 0", () => {
    expect(hpRatio(-5, 20)).toBe(0);
  });

  it("nunca ultrapassa 1", () => {
    expect(hpRatio(30, 20)).toBe(1);
  });

  it("retorna 0 quando o HP máximo é inválido", () => {
    expect(hpRatio(10, 0)).toBe(0);
    expect(hpRatio(10, -1)).toBe(0);
  });

  it("retorna 1 quando HP é igual ao máximo", () => {
    expect(hpRatio(20, 20)).toBe(1);
  });
});
