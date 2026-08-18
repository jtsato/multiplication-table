import { describe, expect, it } from "vitest";
import { createBattle, battleReducer, hpRatio, HERO_MAX_HP } from "./battle";
import { AVENGER } from "./monsters";
import { HERO_BASE_DAMAGE } from "../player-attack/player-attack";
import { xpReward } from "../xp/xp";
import type { BattleState } from "./battle.types";

describe("createBattle", () => {
  const battle: BattleState = createBattle(AVENGER);

  it("começa na fase intro", () => {
    expect(battle.phase).toBe("intro");
  });

  it("herói nasce com HP cheio", () => {
    expect(battle.hero.hp).toBe(battle.hero.maxHp);
    expect(battle.hero.maxHp).toBeGreaterThan(0);
    expect(battle.hero.nameKey).toBe("battle.hero");
  });

  it("monstro nasce com HP cheio e mantém sua especificação", () => {
    expect(battle.monster.hp).toBe(AVENGER.maxHp);
    expect(battle.monster.maxHp).toBe(AVENGER.maxHp);
    expect(battle.monster.nameKey).toBe("monster.avenger");
  });

  it("combo e XP começam zerados", () => {
    expect(battle.combo).toBe(0);
    expect(battle.xp).toBe(0);
  });

  it("começa com registro de batalha vazio", () => {
    expect(battle.log).toEqual([]);
  });
});

describe("battleReducer", () => {
  it("START_BATTLE cria uma batalha nova e íntegra", () => {
    const anterior: BattleState = createBattle(AVENGER);
    const novo = battleReducer(anterior, { type: "START_BATTLE", monster: AVENGER });

    expect(novo).not.toBe(anterior);
    expect(novo.phase).toBe("intro");
    expect(novo.hero.hp).toBe(novo.hero.maxHp);
    expect(novo.monster.hp).toBe(AVENGER.maxHp);
    expect(novo.combo).toBe(0);
    expect(novo.xp).toBe(0);
  });

  it("ações desconhecidas são ignoradas (estado preservado)", () => {
    const estado: BattleState = createBattle(AVENGER);
    expect(battleReducer(estado, { type: "ACÃO_DESCONHECIDA" } as never)).toBe(estado);
  });
});

describe("battleReducer — perguntas", () => {
  const QUESTION = { a: 6, b: 4, answer: 24 };
  const ALTERNATIVES = [24, 23, 25, 18];

  function comPergunta() {
    return battleReducer(createBattle(AVENGER), {
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

  it("acertar reduz o HP do monstro pelo dano base, concede XP e anuncia", () => {
    const acerto = battleReducer(comPergunta(), { type: "ANSWER", value: 24 });
    expect(acerto.monster.hp).toBe(AVENGER.maxHp - HERO_BASE_DAMAGE);
    expect(acerto.phase).toBe("hero-turn");
    expect(acerto.combo).toBe(1);
    expect(acerto.xp).toBe(xpReward(1));
    expect(acerto.log.at(-1)).toEqual({
      key: "battle.correct",
      params: { damage: HERO_BASE_DAMAGE, xp: 10, multiplier: 1 },
    });
  });

  it("errar faz o monstro atacar e reduz o HP do herói", () => {
    const erro = battleReducer(comPergunta(), { type: "ANSWER", value: 23 });
    expect(erro.hero.hp).toBe(HERO_MAX_HP - 1);
    expect(erro.monster.hp).toBe(AVENGER.maxHp);
    expect(erro.phase).toBe("monster-turn");
    expect(erro.log.at(-1)).toEqual({
      key: "battle.almost",
      params: { a: 6, b: 4, answer: 24, damage: AVENGER.damage },
    });
  });

  it("errar que zera o HP do herói entra em defeat", () => {
    const comPerguntaFeroz = battleReducer(createBattle(AVENGER), {
      type: "BEGIN_QUESTION",
      question: QUESTION,
      alternatives: ALTERNATIVES,
    });
    const quaseDerrota: BattleState = {
      ...comPerguntaFeroz,
      hero: { ...comPerguntaFeroz.hero, hp: 1 },
    };
    const derrota = battleReducer(quaseDerrota, { type: "ANSWER", value: 23 });
    expect(derrota.hero.hp).toBe(0);
    expect(derrota.phase).toBe("defeat");
  });

  it("acertar que zera o HP do monstro entra em victory", () => {
    const fraco = {
      id: "avenger" as const,
      nameKey: "monster.avenger" as const,
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
    const intro: BattleState = createBattle(AVENGER);
    expect(battleReducer(intro, { type: "ANSWER", value: 24 })).toBe(intro);
    const vitoria: BattleState = { ...comPergunta(), phase: "victory" };
    expect(battleReducer(vitoria, { type: "ANSWER", value: 24 })).toBe(vitoria);
  });
});

describe("battleReducer — combo e XP", () => {
  const QUESTION = { a: 6, b: 4, answer: 24 };
  const ALTERNATIVES = [24, 23, 25, 18];

  function comPergunta() {
    return battleReducer(createBattle(AVENGER), {
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

  it("o multiplicador de XP cresce com o combo", () => {
    let estado = comPergunta();
    estado = acertar(estado);
    expect(estado.xp).toBe(10);
    estado = proximaPergunta(estado);
    estado = acertar(estado);
    expect(estado.combo).toBe(2);
    expect(estado.xp).toBe(10 + xpReward(2));
  });

  it("errar zera o combo e não concede XP", () => {
    let estado = comPergunta();
    estado = proximaPergunta(acertar(estado));
    estado = proximaPergunta(acertar(estado));
    expect(estado.combo).toBe(2);
    const erro = battleReducer(estado, { type: "ANSWER", value: 23 });
    expect(erro.combo).toBe(0);
    expect(erro.xp).toBe(estado.xp);
  });

  it("BEGIN_QUESTION preserva o combo e o XP", () => {
    const proximo = proximaPergunta(acertar(comPergunta()));
    expect(proximo.combo).toBe(1);
    expect(proximo.xp).toBe(10);
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
