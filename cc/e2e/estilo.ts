import type { Locator, Page } from '@playwright/test';

/**
 * Leitura de estilo computado e contraste real.
 *
 * `src/styles/*.test.ts` conferem o **texto** de `global.css` — provam que o
 * token foi escrito. Estes helpers conferem o que o navegador **pintou**,
 * depois da cascata, do `color-mix()` e da minificacao do build. E so aqui que
 * da para medir contraste de verdade, que e o compromisso assumido em
 * `docs/superpowers/specs/2026-08-16-wcag22-aa-hardening-design.md`.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Converte `rgb(...)` / `rgba(...)` computado em canais 0..255. */
export function analisarRgb(valor: string): Rgb {
  const canais = valor.match(/[\d.]+/g);
  if (!canais || canais.length < 3) {
    throw new Error(`Cor computada fora do formato esperado: ${JSON.stringify(valor)}`);
  }
  return { r: Number(canais[0]), g: Number(canais[1]), b: Number(canais[2]) };
}

/**
 * Converte hex em canais 0..255, aceitando a forma curta.
 *
 * O build de producao minifica o CSS, entao `#ffffff` chega ao navegador como
 * `#fff`. Comparar o token como texto quebraria so em producao — o lugar exato
 * que estes testes existem para cobrir.
 */
export function analisarHex(valor: string): Rgb {
  const hex = valor.trim().replace('#', '');
  const cheio =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(cheio)) {
    throw new Error(`Hex fora do formato esperado: ${JSON.stringify(valor)}`);
  }
  return {
    r: parseInt(cheio.slice(0, 2), 16),
    g: parseInt(cheio.slice(2, 4), 16),
    b: parseInt(cheio.slice(4, 6), 16),
  };
}

/** Luminancia relativa da WCAG 2.2 (mesma formula do criterio 1.4.3). */
function luminancia({ r, g, b }: Rgb): number {
  const linear = (canal: number) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Razao de contraste entre duas cores opacas, de 1:1 a 21:1. */
export function contraste(frente: Rgb, fundo: Rgb): number {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  const [claro, escuro] = a > b ? [a, b] : [b, a];
  return (claro + 0.05) / (escuro + 0.05);
}

/** Le uma propriedade computada de um elemento. */
export async function estiloDe(alvo: Locator, propriedade: string): Promise<string> {
  return alvo.evaluate(
    (el, prop) => window.getComputedStyle(el).getPropertyValue(prop),
    propriedade,
  );
}

/** Le uma propriedade computada como cor. */
export async function corDe(alvo: Locator, propriedade: string): Promise<Rgb> {
  return analisarRgb(await estiloDe(alvo, propriedade));
}

/** Le um token do design system como o `:root` resolve em tempo de execucao. */
export async function tokenDe(page: Page, nome: string): Promise<string> {
  return page.evaluate(
    (token) => window.getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    nome,
  );
}

/**
 * Contraste do texto de um elemento contra o fundo que realmente esta atras.
 *
 * Sobe a arvore ate achar um ancestral com fundo opaco, porque a maioria dos
 * controles do jogo herda o canvas Snow em vez de pintar o proprio fundo.
 */
export async function contrasteDoTexto(alvo: Locator): Promise<number> {
  const [frente, fundo] = await alvo.evaluate((el): [string, string] => {
    const opaco = (valor: string) => {
      const canais = valor.match(/[\d.]+/g);
      return !!canais && (canais.length < 4 || Number(canais[3]) > 0.95);
    };

    const cor = window.getComputedStyle(el).color;
    let atual: HTMLElement | null = el as HTMLElement;
    while (atual) {
      const fundoAtual = window.getComputedStyle(atual).backgroundColor;
      if (opaco(fundoAtual)) {
        return [cor, fundoAtual];
      }
      atual = atual.parentElement;
    }
    return [cor, 'rgb(255, 255, 255)'];
  });

  return contraste(analisarRgb(frente), analisarRgb(fundo));
}
