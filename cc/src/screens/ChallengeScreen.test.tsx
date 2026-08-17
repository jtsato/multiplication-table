// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CHALLENGE_QUESTION_COUNT } from '../domain/challenge';
import { createDefaultState } from '../domain/defaultState';
import { I18nProvider } from '../i18n/I18nProvider';
import type { ChallengeCompletion } from '../state/GameProvider';
import { ChallengeScreen } from './ChallengeScreen';

function completion(overrides: Partial<ChallengeCompletion> = {}): ChallengeCompletion {
  return {
    isNewRecord: true,
    record: { bestScore: 12, bestTimeMs: 40_000, runs: 1, lastPlayedAt: null },
    newAchievements: [],
    ...overrides,
  };
}

function setup(onFinish = vi.fn(() => completion())) {
  const onAnswer = vi.fn();
  const onRestart = vi.fn();
  const onExit = vi.fn();

  const utils = render(
    <I18nProvider locale="en-US">
      <ChallengeScreen
        state={createDefaultState('en-US')}
        onAnswer={onAnswer}
        onFinish={onFinish}
        onRestart={onRestart}
        onExit={onExit}
      />
    </I18nProvider>,
  );

  return { ...utils, onAnswer, onFinish, onRestart, onExit };
}

/** Le a conta que esta na tela: "What is 7 × 8?" -> { a: 7, b: 8 }. */
function currentFact(): { a: number; b: number; text: string } {
  const text = screen.getByRole('heading', { level: 2 }).textContent ?? '';
  const match = /(\d+)\s*×\s*(\d+)/.exec(text);
  if (!match) {
    throw new Error(`pergunta ilegivel: ${text}`);
  }
  return { a: Number(match[1]), b: Number(match[2]), text };
}

async function answerCorrectly(user: ReturnType<typeof userEvent.setup>) {
  const { a, b } = currentFact();
  await user.click(screen.getByRole('button', { name: `Option ${a * b}` }));
}

/** Espera a pausa de comemoracao passar e a tela sair da pergunta atual. */
async function waitPastQuestion(previous: string) {
  await waitFor(
    () => {
      const heading = screen.queryByRole('heading', { level: 2 });
      expect(heading === null || heading.textContent !== previous).toBe(true);
    },
    { timeout: 4000 },
  );
}

describe('ChallengeScreen', () => {
  it('abre no briefing e deixa claro que não há tempo limite nem derrota', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'Legendary Island' })).toBeVisible();
    expect(screen.getByText(/No time limit and no losing/)).toBeVisible();
    expect(
      screen.getByText(`${CHALLENGE_QUESTION_COUNT} facts drawn from every table.`),
    ).toBeVisible();
    // Sem corridas anteriores nao ha recorde a exibir.
    expect(screen.queryByText(/Your record:/)).not.toBeInTheDocument();
  });

  it('sorteia contas de tabuadas diferentes, e não de uma ilha só', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Start the challenge/ }));

    const tables = new Set<number>();
    for (let i = 0; i < 5; i += 1) {
      const { a, text } = currentFact();
      tables.add(a);
      await answerCorrectly(user);
      await waitPastQuestion(text);
    }

    // Cinco perguntas caindo todas na mesma tabuada seria quase impossivel
    // num sorteio sobre as nove — o modo nao esta preso a uma ilha.
    expect(tables.size).toBeGreaterThan(1);
  }, 30_000);

  it('fecha a corrida com o placar e permite jogar de novo', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn(() => completion());
    const { onRestart } = setup(onFinish);

    await user.click(screen.getByRole('button', { name: /Start the challenge/ }));
    for (let i = 0; i < CHALLENGE_QUESTION_COUNT; i += 1) {
      const { text } = currentFact();
      await answerCorrectly(user);
      await waitPastQuestion(text);
    }

    await waitFor(() => expect(onFinish).toHaveBeenCalledOnce(), { timeout: 5000 });
    // Tudo acertado de primeira: o placar entregue e o total de perguntas.
    expect(onFinish.mock.calls[0]).toEqual([CHALLENGE_QUESTION_COUNT, expect.any(Number)]);

    expect(screen.getByRole('heading', { name: 'New record!' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Play again/ }));
    expect(onRestart).toHaveBeenCalledOnce();
  }, 60_000);

  it('errar não encerra a corrida: a mesma conta volta para nova tentativa', async () => {
    const user = userEvent.setup();
    const { onFinish } = setup();

    await user.click(screen.getByRole('button', { name: /Start the challenge/ }));
    const { a, b, text } = currentFact();

    // Qualquer alternativa que nao seja a correta.
    const wrong = screen
      .getAllByRole('button', { name: /^Option \d+$/ })
      .find((button) => button.textContent !== String(a * b));
    await user.click(wrong!);

    await waitFor(() =>
      expect(screen.getByText(/try again|another go|once more|Not that one/i)).toBeVisible(),
    );
    expect(onFinish).not.toHaveBeenCalled();

    // Depois da pausa a pergunta continua sendo a mesma.
    await waitFor(
      () => expect(screen.getByRole('button', { name: `Option ${a * b}` })).toBeEnabled(),
      {
        timeout: 4000,
      },
    );
    expect(currentFact().text).toBe(text);
  }, 30_000);

  it('sair confirma antes, para não perder a corrida por engano', async () => {
    const user = userEvent.setup();
    const { onExit } = setup();

    await user.click(screen.getByRole('button', { name: /Start the challenge/ }));
    await user.click(screen.getByRole('button', { name: /Leave challenge/ }));

    expect(screen.getByText('This run will not count toward your record.')).toBeVisible();
    expect(onExit).not.toHaveBeenCalled();
  });
});
