import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Utilitarios para conduzir o jogo de verdade no navegador.
 *
 * Concentrados aqui para que os specs leiam como uma partida — "conclui o
 * onboarding", "responde certo" — em vez de uma sequencia de cliques.
 *
 * Cada teste recebe um contexto novo, entao o localStorage comeca vazio e o
 * onboarding aparece sempre. Quem quiser pular direto para o mapa usa
 * `concluirOnboarding`.
 */

/** Sai da splash e para na primeira tela do onboarding. */
export async function abrirJogo(page: Page): Promise<void> {
  await page.goto('/');
  // A splash sai sozinha quando o repositorio termina de carregar; esperar o
  // titulo do onboarding e mais confiavel do que cronometrar a animacao.
  await expect(page.getByRole('heading', { name: 'Escolha seu idioma' })).toBeVisible({
    timeout: 30_000,
  });
}

/**
 * Percorre as tres etapas do onboarding com as escolhas padrao.
 *
 * Termina no Mapa do Arquipelago, que e para onde `handleOnboardingFinish`
 * manda a crianca — nao para a Home.
 */
export async function concluirOnboarding(page: Page): Promise<void> {
  await abrirJogo(page);
  await page.getByRole('button', { name: 'Avançar' }).click();
  await expect(page.getByRole('heading', { name: 'Quem vai explorar as ilhas?' })).toBeVisible();
  await page.getByRole('button', { name: 'Avançar' }).click();
  await expect(page.getByRole('heading', { name: 'Deixe do seu jeito' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar aventura' }).click();
  await esperarMapa(page);
}

export async function esperarMapa(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Mapa do Arquipélago' })).toBeVisible();
}

export async function irParaHome(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByRole('button', { name: 'Jogar' })).toBeVisible();
}

/**
 * Entra na primeira ilha liberada e vai ate as perguntas.
 *
 * O caminho passa pela tabuada da ilha, que abre sozinha enquanto
 * `studyBeforeMission` estiver ligada - o padrao de quem nunca mexeu nas
 * configuracoes.
 */
export async function entrarNaPrimeiraIlha(page: Page): Promise<void> {
  await page.locator('button.island:not([disabled])').first().click();
  await expect(page.getByRole('heading', { name: 'Tabuada do 2' })).toBeVisible();
  await page.getByRole('button', { name: /Jogar a missão/ }).click();
  await expect(page.getByRole('button', { name: 'Começar' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.locator('.level__question')).toBeVisible();
}

/**
 * Leva o foco ate um controle usando Tab de verdade.
 *
 * `locator.focus()` nao serve para conferir o anel: depois de um clique de
 * mouse o Chromium entra em "modo ponteiro" e o foco programatico deixa de
 * casar com `:focus-visible`. So o teclado prova o que o usuario de teclado ve.
 */
export async function focarPeloTeclado(page: Page, alvo: Locator, maximo = 15): Promise<void> {
  for (let i = 0; i < maximo; i++) {
    await page.keyboard.press('Tab');
    if (await alvo.evaluate((el) => el === document.activeElement)) {
      return;
    }
  }
  throw new Error(`O controle nao recebeu foco em ${maximo} tabuladas.`);
}

/**
 * Espera o autosave chegar ao localStorage.
 *
 * `GameProvider` grava com debounce (`AUTOSAVE_DELAY_MS`), entao recarregar
 * logo depois de concluir uma missao pode perder o progresso — nao por bug do
 * jogo, mas porque o teste corre mais que o temporizador. Esperar o dado estar
 * escrito e mais honesto do que dormir um tempo arbitrario.
 */
export async function esperarProgressoSalvo(page: Page, missoesMinimas = 1): Promise<void> {
  await page.waitForFunction(
    (minimo) => {
      const bruto = window.localStorage.getItem('ilhas-da-tabuada:state');
      if (!bruto) return false;
      try {
        const salvo = JSON.parse(bruto) as {
          progress?: { islands?: Record<string, { completedMissionIds?: string[] }> };
        };
        const ilhas = Object.values(salvo.progress?.islands ?? {});
        return ilhas.some((ilha) => (ilha.completedMissionIds?.length ?? 0) >= minimo);
      } catch {
        return false;
      }
    },
    missoesMinimas,
    { timeout: 15_000 },
  );
}

/** Le o enunciado visivel e devolve os fatores e o produto correto. */
export async function lerPergunta(page: Page): Promise<{ a: number; b: number; resposta: number }> {
  const texto = await page.locator('.level__question').innerText();
  const casado = texto.match(/(\d+)\s*×\s*(\d+)/);
  if (!casado) {
    throw new Error(`Enunciado fora do formato esperado: ${JSON.stringify(texto)}`);
  }
  const a = Number(casado[1]);
  const b = Number(casado[2]);
  return { a, b, resposta: a * b };
}

/**
 * Espera o turno fechar depois de um acerto.
 *
 * As alternativas ficam desabilitadas durante a animacao de feedback e o
 * enunciado so troca depois dela. Quem espera um tempo fixo acaba lendo a
 * pergunta velha e clicando em um indice que a re-renderizacao ja moveu — o
 * sintoma e um clique que expira em vez de uma assercao que falha. O sinal
 * confiavel e o enunciado mudar, ou sumir quando a missao acaba.
 */
async function esperarFimDoTurno(page: Page, enunciadoAnterior: string): Promise<void> {
  await page.waitForFunction(
    (anterior) => {
      const enunciado = document.querySelector('.level__question');
      return !enunciado || enunciado.textContent?.trim() !== anterior;
    },
    enunciadoAnterior,
    { timeout: 15_000 },
  );
}

/** Clica na alternativa correta e espera o turno fechar. */
export async function responderCerto(page: Page): Promise<number> {
  const anterior = (await page.locator('.level__question').innerText()).trim();
  const { resposta } = await lerPergunta(page);
  await page.locator('button.option', { hasText: new RegExp(`^${resposta}$`) }).click();
  await esperarFimDoTurno(page, anterior);
  return resposta;
}

/** Clica em uma alternativa errada de proposito. */
export async function responderErrado(page: Page): Promise<number> {
  const { resposta } = await lerPergunta(page);
  const alternativas = await page.locator('button.option').allInnerTexts();
  const errada = alternativas.map(Number).find((valor) => valor !== resposta);
  if (errada === undefined) {
    throw new Error('Todas as alternativas eram a resposta correta.');
  }
  await page.locator('button.option', { hasText: new RegExp(`^${errada}$`) }).click();
  return errada;
}

/**
 * Responde certo ate a missao acabar, devolvendo quantas perguntas houve.
 *
 * O limite existe para o teste falhar por assercao em vez de girar para sempre
 * caso a missao pare de avancar.
 */
export async function concluirMissao(page: Page, maximo = 12): Promise<number> {
  for (let feitas = 1; feitas <= maximo; feitas++) {
    await responderCerto(page);
    // `responderCerto` ja esperou o turno fechar: se o enunciado sumiu, a
    // missao acabou e a tela seguinte (resultado ou ilha concluida) entrou.
    if (!(await page.locator('.level__question').isVisible())) {
      return feitas;
    }
  }
  throw new Error(`A missao nao terminou em ${maximo} perguntas.`);
}
