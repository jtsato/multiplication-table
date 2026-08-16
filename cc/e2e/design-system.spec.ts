import { expect, test } from '@playwright/test';
import {
  concluirOnboarding,
  entrarNaPrimeiraIlha,
  focarPeloTeclado,
  irParaHome,
  responderErrado,
} from './jogo';
import {
  analisarHex,
  analisarRgb,
  contraste,
  contrasteDoTexto,
  corDe,
  estiloDe,
  tokenDe,
} from './estilo';

/**
 * O design system Duolingo, conferido como o navegador pintou.
 *
 * `src/styles/buttonColors.test.ts` e `interfaceBackground.test.ts` leem o
 * texto de `global.css`. Aqui a conferencia e depois da cascata, do
 * `color-mix()` e da minificacao do build de producao — inclusive as razoes de
 * contraste, que so existem sobre pixels reais.
 *
 * Referencia AA (WCAG 2.2): 4,5:1 em texto (1.4.3) e 3:1 no limite que
 * identifica um controle (1.4.11).
 */

const OWL_GREEN = { r: 88, g: 204, b: 2 };
const BEE_YELLOW = { r: 255, g: 200, b: 0 };
const SNOW = { r: 255, g: 255, b: 255 };

test.describe('design system aplicado', () => {
  test('os tokens da marca chegam ao :root em producao', async ({ page }) => {
    await concluirOnboarding(page);
    await irParaHome(page);

    // Comparados como cor, nao como texto: o minificador encurta o hex.
    expect(analisarHex(await tokenDe(page, '--accent'))).toEqual(OWL_GREEN);
    expect(analisarHex(await tokenDe(page, '--bg'))).toEqual(SNOW);
    expect(analisarHex(await tokenDe(page, '--fg'))).toEqual({ r: 60, g: 60, b: 60 });
    expect(await tokenDe(page, '--radius-md')).toBe('16px');

    // O easing tambem sobrevive a minificacao, e o navegador o devolve
    // canonizado quando lido de um elemento em vez do `:root`.
    const easing = await estiloDe(
      page.getByRole('button', { name: 'Jogar' }),
      'transition-timing-function',
    );
    expect(easing).toContain('cubic-bezier(0.34, 1.56, 0.64, 1)');
  });

  test('o canvas e Snow puro, sem tingimento', async ({ page }) => {
    await concluirOnboarding(page);
    await irParaHome(page);

    const fundo = await corDe(page.locator('body'), 'background-color');
    expect(fundo).toEqual(SNOW);

    // "Duolingo nunca tinge a pagina, so o chrome": a grade azul-marinho saiu.
    expect(await estiloDe(page.locator('body'), 'background-image')).toBe('none');
  });

  test('o botao primario e Owl Green com a sombra chapada de 4px', async ({ page }) => {
    await concluirOnboarding(page);
    await irParaHome(page);
    const jogar = page.getByRole('button', { name: 'Jogar' });

    expect(await corDe(jogar, 'background-color')).toEqual(OWL_GREEN);
    // A face inferior e o Owl Green Deep, nao um blur.
    expect(await estiloDe(jogar, 'box-shadow')).toBe('rgb(88, 167, 0) 0px 4px 0px 0px');
    expect(await estiloDe(jogar, 'border-radius')).toBe('16px');
  });

  test('o botao secundario usa a recipe Streak em Bee Yellow', async ({ page }) => {
    await concluirOnboarding(page);
    await irParaHome(page);

    // O amarelo ficou reservado para acento; as acoes de menu passaram para a
    // recipe branca para nao competir com o CTA verde.
    const mudarPersonagem = page.getByRole('button', { name: 'Mudar personagem' });
    expect(await corDe(mudarPersonagem, 'background-color')).toEqual(BEE_YELLOW);

    const conquistas = page.getByRole('button', { name: 'Conquistas' });
    expect(await corDe(conquistas, 'background-color')).toEqual(SNOW);
  });

  test('todo texto de botao passa de 4,5:1', async ({ page }) => {
    await concluirOnboarding(page);
    await irParaHome(page);

    for (const nome of ['Jogar', 'Conquistas', 'Configurações']) {
      const razao = await contrasteDoTexto(page.getByRole('button', { name: nome }));
      expect(razao, `contraste do botao "${nome}"`).toBeGreaterThanOrEqual(4.5);
    }

    await page.getByRole('button', { name: 'Configurações' }).click();
    const apagar = page.getByRole('button', { name: /Apagar meu progresso/ });
    const razaoPerigo = await contrasteDoTexto(apagar);
    expect(razaoPerigo, 'contraste do botao de perigo').toBeGreaterThanOrEqual(4.5);
  });

  test('a face inferior identifica os controles claros com 3:1', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    // Um tile branco sobre painel branco so e identificavel pela sombra
    // chapada; Swan (#e5e5e5) daria 1,2:1, por isso a face inferior e Wolf.
    const sombra = await estiloDe(page.locator('button.option').first(), 'box-shadow');
    const corDaSombra = analisarRgb(sombra);
    const painel = await corDe(page.locator('.level__panel'), 'background-color');

    expect(sombra).toContain('0px 4px 0px');
    expect(contraste(corDaSombra, painel)).toBeGreaterThanOrEqual(3);
  });

  test('o anel de foco e visivel sobre o verde e sobre o canvas', async ({ page }) => {
    await concluirOnboarding(page);
    await irParaHome(page);

    const jogar = page.getByRole('button', { name: 'Jogar' });
    await focarPeloTeclado(page, jogar);

    const contorno = await estiloDe(jogar, 'outline-color');
    expect(await estiloDe(jogar, 'outline-style')).toBe('solid');
    expect(await estiloDe(jogar, 'outline-offset')).toBe('3px');
    // O anel fica no vao branco por causa do offset, entao e contra Snow que
    // ele precisa dos 3:1 de 1.4.11.
    expect(contraste(analisarRgb(contorno), SNOW)).toBeGreaterThanOrEqual(3);
  });

  test('o feedback de erro nao depende so da cor e mantem 4,5:1', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);
    await responderErrado(page);

    const feedback = page.locator('.level__feedback-text--wrong');
    await expect(feedback).toBeVisible();
    // Alem da cor, ha texto e a dica em blocos — 1.4.1 (Use of Color).
    await expect(feedback).not.toBeEmpty();
    await expect(page.locator('.hint')).toBeVisible();

    expect(await contrasteDoTexto(feedback)).toBeGreaterThanOrEqual(4.5);
  });

  test('a barra de progresso enche em Owl Green', async ({ page }) => {
    await concluirOnboarding(page);
    await entrarNaPrimeiraIlha(page);

    const preenchimento = page.locator('.progress__fill');
    expect(await corDe(preenchimento, 'background-color')).toEqual(OWL_GREEN);
    expect(await estiloDe(preenchimento, 'border-radius')).toBe('9999px');
  });
});
