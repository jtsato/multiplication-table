import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createDefaultGameState } from './domain/defaultState';
import type { GameState } from './domain/types';
import type { ProgressRepository } from './services/progressRepository';
import { audioService } from './services/audioService';

class MemoryRepository implements ProgressRepository {
  state = createDefaultGameState();
  async load() {
    return this.state;
  }
  async save(state: GameState) {
    this.state = state;
  }
  async reset() {
    this.state = createDefaultGameState();
  }
}

describe('first experience', () => {
  it('chooses language, creates an avatar, and reaches the world map', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryRepository()} />);
    expect(await screen.findByRole('heading', { name: /escolha seu idioma/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /português/i }));
    await user.type(screen.getByLabelText(/como podemos chamar/i), 'Bia');
    await user.click(screen.getByRole('button', { name: /continuar/i }));
    await user.click(screen.getByRole('button', { name: /começar aventura/i }));
    expect(await screen.findByRole('heading', { name: /arquipélago/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tabuada do 2/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /tabuada do 3/i })).toBeDisabled();
    expect(document.documentElement.lang).toBe('pt-BR');
  });

  it('updates the document language when English is selected', async () => {
    const user = userEvent.setup();
    render(<App repository={new MemoryRepository()} />);
    await user.click(await screen.findByRole('button', { name: /English/i }));
    await waitFor(() => expect(document.documentElement.lang).toBe('en-US'));
    expect(document.title).toBe('Times Tables Isles');
  });

  it('starts enabled music from the first-run completion gesture', async () => {
    const music = vi.spyOn(audioService, 'setMusic');
    const user = userEvent.setup();
    render(<App repository={new MemoryRepository()} />);
    await user.click(await screen.findByRole('button', { name: /Português/i }));
    await user.type(screen.getByLabelText(/Como podemos chamar/i), 'Bia');
    await user.click(screen.getByRole('button', { name: /Continuar/i }));
    await user.click(screen.getByRole('button', { name: /Começar aventura/i }));
    expect(music).toHaveBeenCalledWith(true);
    music.mockRestore();
  });

  it('returns focus to the reset opener after cancelling the dialog', async () => {
    const repository = new MemoryRepository();
    repository.state.player = {
      name: 'Bia',
      avatarStyle: 'builder',
      outfitColor: '#5b8cff',
      hairStyle: 'spiky',
      accessory: 'cap',
      createdAt: '2026-08-15T12:00:00.000Z',
    };
    const user = userEvent.setup();
    render(<App repository={repository} />);
    await user.click(await screen.findByRole('button', { name: /Configurações/i }));
    const opener = screen.getByRole('button', { name: /Apagar progresso/i });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(opener).toHaveFocus();
  });

  it('completes the bridge mission and unlocks table three', async () => {
    const user = userEvent.setup();
    const repository = new MemoryRepository();
    repository.state.player = {
      name: 'Bia',
      avatarStyle: 'builder',
      outfitColor: '#5b8cff',
      hairStyle: 'spiky',
      accessory: 'cap',
      createdAt: '2026-08-15T12:00:00.000Z',
    };
    render(<App repository={repository} />);
    await user.click(await screen.findByRole('button', { name: 'Jogar' }));
    await user.click(screen.getByRole('button', { name: /Tabuada do 2/i }));

    for (let index = 0; index < 6; index += 1) {
      const heading = await screen.findByRole('heading', { name: /Quanto é/ });
      const factors = heading.textContent?.match(/(\d+) × (\d+)/);
      expect(factors).not.toBeNull();
      const answer = Number(factors![1]) * Number(factors![2]);
      await user.click(screen.getByRole('button', { name: String(answer) }));
      await user.click(
        screen.getByRole('button', {
          name: index === 5 ? /Ver construção pronta/i : /Próximo bloco/i,
        }),
      );
    }

    expect(
      await screen.findByRole('heading', { name: /Construção concluída/i }),
    ).toBeInTheDocument();
    expect(repository.state.progress.tables['2']).toMatchObject({
      status: 'completed',
      questionsAnswered: 6,
      correctAnswers: 6,
    });
    expect(repository.state.progress.tables['3'].status).toBe('available');
  });

  it('resumes the same question and feedback after reopening the app', async () => {
    const repository = new MemoryRepository();
    repository.state.player = {
      name: 'Bia',
      avatarStyle: 'builder',
      outfitColor: '#5b8cff',
      hairStyle: 'spiky',
      accessory: 'cap',
      createdAt: '2026-08-15T12:00:00.000Z',
    };
    const openMission = async () => {
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Jogar' }));
      await user.click(screen.getByRole('button', { name: /Tabuada do 2/i }));
      return user;
    };

    const firstRender = render(<App repository={repository} />);
    const firstUser = await openMission();
    const firstHeading = await screen.findByRole('heading', { name: /Quanto é/ });
    const questionText = firstHeading.textContent!;
    await waitFor(() => expect(repository.state.progress.activeMission).not.toBeNull());
    const answer = repository.state.progress.activeMission!.currentQuestion.answer;
    const wrongOption = repository.state.progress.activeMission!.currentQuestion.options.find(
      (option) => option !== answer,
    )!;
    await firstUser.click(screen.getByRole('button', { name: String(wrongOption) }));
    expect(await screen.findByText(/Quase!/i)).toBeInTheDocument();
    firstRender.unmount();

    const secondRender = render(<App repository={repository} />);
    const secondUser = await openMission();
    expect(await screen.findByRole('heading', { name: questionText })).toBeInTheDocument();
    expect(screen.getByText(/Quase!/i)).toBeInTheDocument();
    await secondUser.click(screen.getByRole('button', { name: String(answer) }));
    expect(await screen.findByText(/Isso!/i)).toBeInTheDocument();
    secondRender.unmount();

    render(<App repository={repository} />);
    await openMission();
    expect(await screen.findByRole('heading', { name: questionText })).toBeInTheDocument();
    expect(screen.getByText(/Isso!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Próximo bloco/i })).toBeInTheDocument();
  });
});
