import { expect, test } from '@playwright/test';
import {
  abrirJogo,
  concluirMissao,
  concluirOnboarding,
  entrarNaPrimeiraIlha,
  esperarMapa,
  esperarProgressoSalvo,
  irParaHome,
  lerPergunta,
  responderCerto,
  responderErrado,
} from './jogo';

/**
 * Partida completa no computador, em navegador de verdade.
 *
 * Prova o que a suite do Vitest nao alcanca: o build de producao sobe, as
 * telas navegam de ponta a ponta, o progresso sobrevive a um reload real e o
 * layout da missao cabe na viewport sem rolagem de pagina.
 */
test.describe('partida no computador', () => {
  test('a splash entrega o onboarding sem erro de console', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    page.on('console', (msg) => msg.type() === 'error' && erros.push(msg.text()));

    await abrirJogo(page);

    await expect(page.getByRole('heading', { name: 'Escolha seu idioma' })).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('o onboarding leva ao mapa e a Home mostra o progresso zerado', async ({ page }) => {
    await concluirOnboarding(page);

    // A primeira ilha abre liberada; as demais ficam bloqueadas.
    await expect(page.locator('button.island:not([disabled])')).toHaveCount(1);
    await expect(page.locator('button.island[disabled]')).toHaveCount(8);

    await irParaHome(page);
    await expect(page.getByText('0 de 9 ilhas concluídas')).toBeVisible();
  });

  test('a tabuada da ilha abre antes da missao e cabe sem rolagem lateral', async ({ page }) => {
    await concluirOnboarding(page);
    await page.locator('button.island:not([disabled])').first().click();

    // Entrar na ilha passa pela tabuada enquanto a configuracao estiver ligada.
    await expect(page.getByRole('heading', { name: 'Tabuada do 2' })).toBeVisible();
    await expect(page.locator('.table-list__row')).toHaveCount(10);

    // As dez linhas cabem sem rolagem lateral, em duas colunas de cinco.
    const vazamento = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(vazamento).toBe(false);

    const ultima = page.locator('.table-list__row').last();
    await expect(ultima).toContainText('2 × 10');
    await expect(ultima).toContainText('20');

    await page.getByRole('button', { name: /Jogar a missão/ }).click();
    await expect(page.getByRole('button', { name: 'Começar' })).toBeVisible();

    // E ela continua a um toque de distancia, ja dentro da missao.
    await page.getByRole('button', { name: 'Ver a tabuada' }).click();
    await expect(page.getByRole('heading', { name: 'Tabuada do 2' })).toBeVisible();
  });

  test('acertar coloca blocos e avanca a pergunta', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    await expect(page.getByText('Blocos colocados: 0 de 5')).toBeVisible();
    await expect(page.getByText('Pergunta 1 de 5')).toBeVisible();
    const primeira = await lerPergunta(page);
    expect(primeira.a).toBe(2);

    await responderCerto(page);

    // O contador e o sinal de avanco; os fatores podem repetir entre perguntas.
    await expect(page.getByText('Blocos colocados: 1 de 5')).toBeVisible();
    await expect(page.getByText('Pergunta 2 de 5')).toBeVisible();
  });

  test('errar mostra a dica visual e nao avanca a pergunta', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    const antes = await lerPergunta(page);
    await responderErrado(page);

    // A dica de grupos e o feedback aparecem, e o enunciado continua o mesmo.
    await expect(page.locator('.hint')).toBeVisible();
    await expect(page.locator('.level__feedback-text--wrong')).toBeVisible();
    await expect(page.getByText('Blocos colocados: 0 de 5')).toBeVisible();
    expect(await lerPergunta(page)).toEqual(antes);
  });

  test('concluir a missao mostra o resultado com as estatisticas', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    const perguntas = await concluirMissao(page);
    expect(perguntas).toBe(5);

    await expect(page.getByRole('heading', { name: 'Missão concluída!' })).toBeVisible();
    await expect(page.getByText('Acertos de primeira')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Próxima missão' })).toBeVisible();
  });

  test('o progresso sobrevive a um reload de verdade', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);
    await concluirMissao(page);
    await page.getByRole('button', { name: 'Voltar ao mapa' }).click();
    await esperarMapa(page);
    await esperarProgressoSalvo(page);

    await page.reload();

    // Sem onboarding desta vez: o localStorage lembra que ele foi concluido.
    await expect(page.getByRole('button', { name: 'Jogar' })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Jogar' }).click();
    await esperarMapa(page);
    await expect(page.getByText('1 de 4 missões')).toBeVisible();
  });

  test('a tela da missao cabe na viewport sem rolagem de pagina', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    const rolagem = await page.evaluate(() => ({
      vertical: document.documentElement.scrollHeight > window.innerHeight + 1,
      horizontal: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    expect(rolagem).toEqual({ vertical: false, horizontal: false });

    // A cena respeita o viewBox 5:3 que `desktopViewportFit.test.ts` fixa no CSS.
    const cena = await page.locator('.level__stage .scene').boundingBox();
    expect(cena).not.toBeNull();
    expect(cena!.width / cena!.height).toBeCloseTo(5 / 3, 1);
  });

  /**
   * A regra responsiva de >=720px reescrevia o `padding` inteiro da barra e
   * apagava a faixa reservada ao icone de som: o "0/5" da barra de progresso
   * ficava debaixo do botao, legivel so por acidente de cor.
   */
  test('o contador da barra de progresso nao fica sob o icone de som', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    const contador = await page.locator('.progress__header > :last-child').boundingBox();
    const som = await page.locator('.sound-toggle').boundingBox();
    expect(contador).not.toBeNull();
    expect(som).not.toBeNull();
    expect(contador!.x + contador!.width).toBeLessThanOrEqual(som!.x);
  });

  test('sair da missao pede confirmacao e devolve ao mapa', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    await page.getByRole('button', { name: 'Sair da missão' }).click();
    const dialogo = page.getByRole('alertdialog');
    await expect(dialogo).toBeVisible();

    // O foco entra no dialogo, na opcao segura (WAI-ARIA APG, Dialog Modal).
    await expect(page.getByRole('button', { name: 'Continuar jogando' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();

    await page.getByRole('button', { name: 'Sair da missão' }).click();
    await page.getByRole('button', { name: 'Sair mesmo assim' }).click();
    await esperarMapa(page);
  });
});
