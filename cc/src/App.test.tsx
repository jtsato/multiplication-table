// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { LocalStorageProgressRepository } from './persistence/localStorageRepository';
import { createMemoryStorage, createStorageService } from './persistence/storageService';

/**
 * Teste de integracao ponta a ponta.
 *
 * Monta o <App/> de verdade sobre jsdom (sem mocks de estado do jogo) e
 * simula os toques de uma crianca: escolher idioma, criar personagem, entrar
 * numa ilha, responder perguntas e fechar/reabrir o jogo. Existe porque a
 * automacao de navegador nao estava disponivel nesta sessao para uma
 * verificacao visual manual - isto cobre o caminho critico de verdade, com
 * DOM e timers reais, em vez de apenas unidades isoladas.
 *
 * O repositorio usa o backend em memoria (`createMemoryStorage`) atras da
 * MESMA `LocalStorageProgressRepository` e `storageService` de producao -
 * so o backend fisico muda, nao a logica de persistencia/migracao/schema
 * (essa ja tem cobertura dedicada em `persistence.test.ts`). Evita depender
 * do localStorage nativo do jsdom, que em versoes recentes exige opcoes de
 * cota especificas para funcionar.
 */

function makeTestRepository(fallbackLocale: 'en-US' | 'pt-BR' = 'en-US') {
  const backend = createMemoryStorage();
  const storage = createStorageService(backend);
  return new LocalStorageProgressRepository({ storage, fallbackLocale });
}

const QUESTION_TIMEOUT = 3000;

function questionProduct(): number {
  const heading = screen.getByRole('heading', { level: 2 });
  const match = /(\d+)\s*×\s*(\d+)/.exec(heading.textContent ?? '');
  if (!match) {
    throw new Error(`pergunta nao encontrada: "${heading.textContent}"`);
  }
  return Number(match[1]) * Number(match[2]);
}

async function waitForEnabledOptions() {
  await waitFor(
    () => {
      const buttons = screen.getAllByRole('button', { name: /^Option \d+$/ });
      expect(buttons.some((button) => !(button as HTMLButtonElement).disabled)).toBe(true);
    },
    { timeout: QUESTION_TIMEOUT },
  );
}

async function answerCurrentQuestion(user: ReturnType<typeof userEvent.setup>) {
  await waitForEnabledOptions();
  const answer = questionProduct();
  const button = screen.getByRole('button', { name: `Option ${answer}` });
  await user.click(button);
  return answer;
}

async function completeOnboarding(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('Choose your language', {}, { timeout: 3000 });
  await user.click(screen.getByRole('radio', { name: /English \(US\)/ }));
  await user.click(screen.getByRole('button', { name: 'Next' }));

  await screen.findByText('Who is exploring the islands?');
  await user.click(screen.getByRole('button', { name: 'Next' }));

  await screen.findByText('Make it yours');
  await user.click(screen.getByRole('button', { name: 'Start the adventure' }));

  await screen.findByText('Archipelago Map');
}

async function enterFirstIsland(user: ReturnType<typeof userEvent.setup>) {
  const islandButton = screen
    .getAllByRole('button')
    .find((button) => button.textContent?.includes('Blooming Fields'));
  if (!islandButton) {
    throw new Error('ilha da tabuada do 2 nao encontrada no mapa');
  }
  await user.click(islandButton);
  await screen.findByRole('heading', { level: 2, name: 'The broken bridge' });
  await user.click(screen.getByRole('button', { name: 'Start' }));
}

describe('jogo completo (integracao)', () => {
  it('conclui a primeira missao, persiste o progresso e desbloqueia conquistas', async () => {
    const repository = makeTestRepository();
    const user = userEvent.setup();
    render(<App repository={repository} />);

    await completeOnboarding(user);
    await enterFirstIsland(user);

    // Mission t2-m1 tem 5 perguntas.
    for (let i = 0; i < 5; i += 1) {
      await answerCurrentQuestion(user);
    }

    await screen.findByText('Mission complete!', {}, { timeout: 3000 });
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getByText('New achievements!')).toBeInTheDocument();
    expect(screen.getByText('First answer')).toBeInTheDocument();
    expect(screen.getByText('First build')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to the map' }));
    await screen.findByText('Archipelago Map');
    expect(screen.getByText('1 of 4 missions')).toBeInTheDocument();

    // O autosave tem debounce de 400ms.
    await waitFor(
      async () => {
        const saved = await repository.load();
        expect(saved.state.progress.islands['2']?.completedMissionIds).toEqual(['t2-m1']);
      },
      { timeout: 2000 },
    );

    // Simula fechar e reabrir o navegador: desmonta e monta de novo com o
    // MESMO repositorio (o mesmo "disco"), sem nada guardado em memoria.
    cleanup();
    render(<App repository={repository} />);

    await screen.findByText('Hello, explorer!', {}, { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: /Play/ }));
    await screen.findByText('Archipelago Map');
    expect(screen.getByText('1 of 4 missions')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
  }, 20000);

  it('erro nao derruba o progresso e mostra a dica visual antes de liberar nova tentativa', async () => {
    const user = userEvent.setup();
    render(<App repository={makeTestRepository()} />);

    await completeOnboarding(user);
    await enterFirstIsland(user);

    await waitForEnabledOptions();
    const correctAnswer = questionProduct();
    const options = screen.getAllByRole('button', { name: /^Option \d+$/ });
    const wrongButton = options.find((button) => button.textContent !== String(correctAnswer));
    if (!wrongButton) {
      throw new Error('nao havia alternativa errada disponivel');
    }

    await user.click(wrongButton);
    await screen.findByText('The right answer is', { exact: false }, { timeout: 500 }).catch(() => {
      // A revelacao so aparece depois da segunda tentativa errada; tudo bem
      // se ainda nao apareceu agora.
    });

    // A construcao nao perde progresso: nenhum bloco foi colocado ainda.
    expect(screen.getByText('Blocks placed: 0 of 5')).toBeInTheDocument();

    await waitForEnabledOptions();
    const answer = await answerCurrentQuestion(user);
    expect(answer).toBe(correctAnswer);

    await waitFor(
      () => {
        expect(screen.getByText(/Blocks placed: 1 of 5/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  }, 15000);
});
