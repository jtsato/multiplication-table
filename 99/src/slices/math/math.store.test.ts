import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../app/store';
import { dayNightClock } from '../daynight/dayNightClock';
import { LANTERN, chargeRemaining } from '../lantern';
import { resolveAnswer } from './math.logic';

const state = () => useGameStore.getState();

/** Primeiro no disponivel, usado como alvo dos desafios. */
const alvo = () => state().nodes[0];

describe('slice de matematica', () => {
  beforeEach(() => {
    state().resetResources();
    state().cancelChallenge();
    state().clearFeedback();
  });

  it('comeca sem desafio aberto', () => {
    expect(state().activeChallenge).toBeNull();
    expect(state().feedback).toBeNull();
  });

  it('abre um desafio ancorado no no e derivado do que ele exibe', () => {
    const node = alvo();
    state().startChallenge(node);

    const challenge = state().activeChallenge!;
    expect(challenge.targetId).toBe(node.id);
    expect(challenge.groups).toBe(node.groups);
    expect(challenge.answer).toBe(node.groups * 2);
  });

  it('ignora um segundo desafio enquanto ha um aberto', () => {
    const [primeiro, segundo] = state().nodes;
    state().startChallenge(primeiro);
    state().startChallenge(segundo);

    expect(state().activeChallenge?.targetId).toBe(primeiro.id);
  });

  it('nao abre desafio em no ja colhido', () => {
    const node = alvo();
    state().collectNode(node.id, 1);
    state().startChallenge(state().nodes.find((n) => n.id === node.id)!);

    expect(state().activeChallenge).toBeNull();
  });

  it('acertar credita a colheita cheia e esgota o no', () => {
    const node = alvo();
    state().startChallenge(node);
    const challenge = state().activeChallenge!;

    state().answerChallenge(challenge.answer);

    expect(state().inventory[node.kind]).toBe(challenge.answer);
    expect(state().nodes.find((n) => n.id === node.id)?.depleted).toBe(true);
    expect(state().activeChallenge).toBeNull();
    expect(state().feedback).toEqual({
      targetId: node.id,
      purpose: 'colher',
      correct: true,
      answer: challenge.answer,
      reward: challenge.answer,
      coins: expect.any(Number),
    });
  });

  it('errar credita parcial, nunca zero, e revela a resposta certa', () => {
    const node = alvo();
    state().startChallenge(node);
    const challenge = state().activeChallenge!;
    const errada = challenge.options.find((o) => o !== challenge.answer)!;

    state().answerChallenge(errada);

    const esperado = resolveAnswer(challenge, errada).reward;
    expect(esperado).toBeGreaterThanOrEqual(1);
    expect(esperado).toBeLessThan(challenge.answer);
    expect(state().inventory[node.kind]).toBe(esperado);
    expect(state().feedback?.correct).toBe(false);
    expect(state().feedback?.answer).toBe(challenge.answer);
  });

  it('responder sem desafio aberto nao faz nada', () => {
    state().answerChallenge(8);
    expect(state().inventory).toEqual({ madeira: 0, fruta: 0, pedra: 0 });
    expect(state().feedback).toBeNull();
  });

  it('cancelar fecha o desafio sem colher nem creditar', () => {
    const node = alvo();
    state().startChallenge(node);
    state().cancelChallenge();

    expect(state().activeChallenge).toBeNull();
    expect(state().inventory[node.kind]).toBe(0);
    expect(state().nodes.find((n) => n.id === node.id)?.depleted).toBe(false);
  });

  it('cancelar e reabrir permite tentar de novo', () => {
    const node = alvo();
    state().startChallenge(node);
    state().cancelChallenge();
    state().startChallenge(state().nodes.find((n) => n.id === node.id)!);

    expect(state().activeChallenge?.targetId).toBe(node.id);
  });

  it('nao repete sempre as mesmas alternativas para o mesmo no', () => {
    const node = alvo();
    const ordens = new Set<string>();

    for (let i = 0; i < 30; i += 1) {
      state().startChallenge(node);
      ordens.add(state().activeChallenge!.options.join(','));
      state().cancelChallenge();
    }

    // Um gerador recriado por desafio devolveria sempre a mesma ordem.
    expect(ordens.size).toBeGreaterThan(1);
  });

  it('abrir um novo desafio limpa o feedback anterior', () => {
    const [primeiro, segundo] = state().nodes;
    state().startChallenge(primeiro);
    state().answerChallenge(state().activeChallenge!.answer);
    expect(state().feedback).not.toBeNull();

    state().startChallenge(segundo);
    expect(state().feedback).toBeNull();
  });

  describe('a conta da fogueira', () => {
    const AGORA = 100;
    const fogueira = { id: 'fogueira-1', kind: 'madeira' as const, groups: 4, perGroup: 2 };

    beforeEach(() => {
      state().resetLantern();
      dayNightClock.seconds = AGORA;
    });

    it('tambem acende a lanterna', () => {
      state().startChallenge(fogueira, 'abastecer');
      state().answerChallenge(state().activeChallenge!.answer);

      expect(chargeRemaining(state().lantern, AGORA)).toBe(LANTERN.chargeSeconds);
    });

    it('errar acende menos, e nunca deixa a lanterna apagada', () => {
      state().startChallenge(fogueira, 'abastecer');
      const desafio = state().activeChallenge!;
      state().answerChallenge(desafio.options.find((option) => option !== desafio.answer)!);

      const carga = chargeRemaining(state().lantern, AGORA);
      expect(carga).toBeGreaterThan(0);
      expect(carga).toBeLessThan(LANTERN.chargeSeconds);
    });

    it('nao mexe na lanterna quando a conta e de colheita', () => {
      state().startChallenge(alvo());
      state().answerChallenge(state().activeChallenge!.answer);

      expect(chargeRemaining(state().lantern, AGORA)).toBe(0);
    });
  });
  describe('moedas', () => {
    beforeEach(() => {
      state().resetEconomy();
    });

    it('o acerto paga moeda', () => {
      state().startChallenge(alvo());
      state().answerChallenge(state().activeChallenge!.answer);

      expect(state().coins).toBeGreaterThan(0);
    });

    it('o erro nao paga moeda, mas continua rendendo recurso', () => {
      const node = alvo();
      state().startChallenge(node);
      const desafio = state().activeChallenge!;
      state().answerChallenge(desafio.options.find((o) => o !== desafio.answer)!);

      expect(state().coins).toBe(0);
      expect(state().inventory[node.kind]).toBeGreaterThanOrEqual(1);
    });

    it('o erro quebra a sequencia', () => {
      const [primeiro, segundo] = state().nodes;
      state().startChallenge(primeiro);
      state().answerChallenge(state().activeChallenge!.answer);
      expect(state().streak).toBe(1);

      state().startChallenge(segundo);
      const desafio = state().activeChallenge!;
      state().answerChallenge(desafio.options.find((o) => o !== desafio.answer)!);

      expect(state().streak).toBe(0);
    });

    it('o feedback carrega as moedas ganhas', () => {
      state().startChallenge(alvo());
      state().answerChallenge(state().activeChallenge!.answer);

      expect(state().feedback?.coins).toBe(state().coinsToday);
    });

    it('a conta da fogueira tambem paga moeda', () => {
      state().startChallenge(
        { id: 'fogueira-1', kind: 'madeira', groups: 4, perGroup: 2 },
        'abastecer',
      );
      state().answerChallenge(state().activeChallenge!.answer);

      expect(state().coins).toBeGreaterThan(0);
    });
  });
});
