import { describe, expect, it } from 'vitest';
import { ITEM_COLOR, ITEM_SHAPE, NODE_BASE } from './resources.look';
import { RESOURCE_KINDS } from './resources.logic';

/** Luminancia relativa de uma cor `#rrggbb`, como a WCAG define. */
function luminancia(hex: string): number {
  const canais = [1, 3, 5]
    .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

/**
 * O minimo aceitavel entre um item e a base em que ele esta pousado.
 *
 * Nao e a razao da WCAG para texto — nao ha texto aqui. E o suficiente para as
 * pecas se destacarem do proprio no com sombreamento plano, medido nas capturas
 * de tela ate os itens pararem de sumir.
 */
const MINIMO = 1.8;

describe('a aparencia dos nos', () => {
  it('todo tipo tem cor de item e base', () => {
    for (const kind of RESOURCE_KINDS) {
      expect(ITEM_COLOR[kind], kind).toMatch(/^#[0-9a-f]{6}$/i);
      expect(NODE_BASE[kind].cor, kind).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  /**
   * A regra que este arquivo existe para guardar.
   *
   * Contar na tela e o que separa este jogo de um quiz com enfeite 3D. Um
   * graveto cinza sobre uma rocha cinza nao se conta — e era exatamente esse o
   * caso da pedra, cuja base e cujos itens tinham a **mesma cor exata**, razao
   * de contraste 1.00. Apareceu olhando uma captura do Pomar, onde o mel sumia
   * dentro da colmeia.
   */
  it('todo item contrasta com a propria base', () => {
    for (const kind of RESOURCE_KINDS) {
      const razao = contraste(ITEM_COLOR[kind], NODE_BASE[kind].cor);
      expect(
        razao,
        `${kind}: item ${ITEM_COLOR[kind]} sobre base ${NODE_BASE[kind].cor}`,
      ).toBeGreaterThanOrEqual(MINIMO);
    }
  });

  it('nenhum tipo repete a cor de item de outro — a colheita se reconhece pela cor', () => {
    const cores = RESOURCE_KINDS.map((kind) => ITEM_COLOR[kind].toLowerCase());
    expect(new Set(cores).size).toBe(cores.length);
  });

  /**
   * A varredura que faltava. A view tinha tres blocos de desenho escritos a mao
   * enquanto a lista de itens ja cobria os nove tipos: seis recursos eram
   * calculados e nunca desenhados, e os nos de mel apareciam pelados na tela.
   * Com a forma nos dados, um tipo sem desenho quebra aqui.
   */
  it('todo tipo sabe com que forma seus itens sao desenhados', () => {
    for (const kind of RESOURCE_KINDS) {
      expect(ITEM_SHAPE[kind], `${kind} nao tem forma de item`).toBeDefined();
    }
  });

  it('a base nasce acima do chao, para o no nao afundar', () => {
    for (const kind of RESOURCE_KINDS) {
      expect(NODE_BASE[kind].altura, kind).toBeGreaterThan(0);
    }
  });
});
