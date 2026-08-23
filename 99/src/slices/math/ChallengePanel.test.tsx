// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { useGameStore } from '../../app/store';
import { ChallengePanel } from './ChallengePanel';
import { KeyboardBridge } from '../../test/KeyboardBridge';
import { challengeText } from './challengeText';

const state = () => useGameStore.getState();
const alvo = () => state().nodes[0];

describe('ChallengePanel', () => {
  beforeEach(() => {
    state().resetResources();
    state().cancelChallenge();
    state().clearFeedback();
  });

  it('nao renderiza nada sem desafio nem feedback', () => {
    const { container } = render(
      <>
        <KeyboardBridge />
        <ChallengePanel />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra o enunciado que descreve a cena e as tres alternativas', () => {
    const node = alvo();
    state().startChallenge(node);
    const challenge = state().activeChallenge!;

    render(
      <>
        <KeyboardBridge />
        <ChallengePanel />
      </>,
    );

    const texto = challengeText(challenge, state().text);
    expect(screen.getByText(texto.prompt)).toBeInTheDocument();
    expect(screen.getByText(texto.question)).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    for (const option of challenge.options) {
      expect(screen.getByRole('button', { name: String(option) })).toBeInTheDocument();
    }
  });

  it('monta o desafio na camada centralizada', () => {
    state().startChallenge(alvo());
    const { container } = render(
      <>
        <KeyboardBridge />
        <ChallengePanel />
      </>,
    );

    expect(container.querySelector('.challenge-overlay')).toBeInTheDocument();
    expect(container.querySelector('.challenge-overlay .challenge')).toBeInTheDocument();
  });

  it('clicar na resposta certa credita a colheita cheia', async () => {
    const user = userEvent.setup();
    const node = alvo();
    state().startChallenge(node);
    const challenge = state().activeChallenge!;

    render(
      <>
        <KeyboardBridge />
        <ChallengePanel />
      </>,
    );
    await user.click(screen.getByRole('button', { name: String(challenge.answer) }));

    expect(state().inventory[node.kind]).toBe(challenge.answer);
    expect(state().feedback?.correct).toBe(true);
  });

  it('clicar numa resposta errada credita parcial e revela a certa', async () => {
    const user = userEvent.setup();
    const node = alvo();
    state().startChallenge(node);
    const challenge = state().activeChallenge!;
    const errada = challenge.options.find((o) => o !== challenge.answer)!;

    render(
      <>
        <KeyboardBridge />
        <ChallengePanel />
      </>,
    );
    await user.click(screen.getByRole('button', { name: String(errada) }));

    expect(state().feedback?.correct).toBe(false);
    expect(state().inventory[node.kind]).toBeGreaterThanOrEqual(1);
    expect(state().inventory[node.kind]).toBeLessThan(challenge.answer);
    expect(screen.getByText(`A resposta era ${challenge.answer}`)).toBeInTheDocument();
  });

  it('erro mostra a resposta e a explicacao concreta da conta', async () => {
    const user = userEvent.setup();
    const node = alvo();
    state().startChallenge(node);
    const challenge = state().activeChallenge!;
    const errada = challenge.options.find((o) => o !== challenge.answer)!;

    render(
      <>
        <KeyboardBridge />
        <ChallengePanel />
      </>,
    );
    await user.click(screen.getByRole('button', { name: String(errada) }));

    expect(screen.getByText(`A resposta era ${challenge.answer}`)).toBeInTheDocument();
    expect(
      screen.getByText(`${challenge.groups} grupos de ${challenge.perGroup} = ${challenge.answer}`),
    ).toBeInTheDocument();
  });

  it('responde pelas teclas 1, 2 e 3', async () => {
    const user = userEvent.setup();
    const node = alvo();
    state().startChallenge(node);
    const challenge = state().activeChallenge!;
    const posicao = challenge.options.indexOf(challenge.answer);

    render(
      <>
        <KeyboardBridge />
        <ChallengePanel />
      </>,
    );
    await user.keyboard(`{${posicao + 1}}`);

    expect(state().feedback?.correct).toBe(true);
    expect(state().inventory[node.kind]).toBe(challenge.answer);
  });

  it('mostra o acerto e a recompensa no feedback', async () => {
    const user = userEvent.setup();
    state().startChallenge(alvo());
    const challenge = state().activeChallenge!;

    render(
      <>
        <KeyboardBridge />
        <ChallengePanel />
      </>,
    );
    await user.click(screen.getByRole('button', { name: String(challenge.answer) }));

    expect(screen.getByText('Isso!')).toBeInTheDocument();
    expect(screen.getByText(`+${challenge.answer}`)).toBeInTheDocument();
  });

  it('some depois que o feedback expira', async () => {
    vi.useFakeTimers();
    try {
      state().startChallenge(alvo());
      const challenge = state().activeChallenge!;
      const { container } = render(
        <>
          <KeyboardBridge />
          <ChallengePanel />
        </>,
      );

      state().answerChallenge(challenge.answer);
      await vi.advanceTimersByTimeAsync(2000);

      expect(state().feedback).toBeNull();
      expect(container).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
  });
});
