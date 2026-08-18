import { palette } from '../../shared/palette';
import type { ResourceKind } from './resources.logic';

/**
 * A aparencia de cada tipo de no.
 *
 * Mora fora da view porque **e regra, nao decoracao**: o item tem que contrastar
 * com a base em que esta pousado. Contar na tela e o que separa este jogo de um
 * quiz com enfeite 3D, e um graveto cinza sobre uma rocha cinza nao se conta.
 * Ha um teste que mede o contraste par a par.
 */

/** Cor dos itens contaveis de cada tipo de no. */
export const ITEM_COLOR: Record<ResourceKind, string> = {
  madeira: '#c98d4f',
  fruta: palette.berry,
  pedra: palette.rock,
  concha: palette.shell,
  peixe: palette.fish,
  cogumelo: palette.mushroom,
  cristal: palette.crystal,
  mel: palette.honey,
  gelo: palette.ice,
};

/**
 * A base de cada tipo — o que segura os itens contaveis.
 *
 * Tabela, e nao uma cadeia de `if`: com nove tipos, a versao ramificada viraria
 * cem linhas de JSX quase igual, e acrescentar um tipo passaria a exigir mexer
 * no meio do componente em vez de numa linha de dados.
 */
export const NODE_BASE: Record<ResourceKind, { cor: string; altura: number; forma: FormaDeBase }> =
  {
    madeira: { cor: palette.trunk, altura: 0.9, forma: 'arvore' },
    fruta: { cor: palette.bushDark, altura: 0.75, forma: 'moita' },
    pedra: { cor: palette.rockDark, altura: 0.55, forma: 'rocha' },
    concha: { cor: palette.shellBase, altura: 0.35, forma: 'monte' },
    peixe: { cor: palette.barrel, altura: 0.55, forma: 'barril' },
    cogumelo: { cor: palette.stump, altura: 0.4, forma: 'barril' },
    cristal: { cor: palette.crystalBase, altura: 0.7, forma: 'cristal' },
    mel: { cor: palette.hive, altura: 0.8, forma: 'moita' },
    gelo: { cor: palette.iceBase, altura: 0.6, forma: 'cristal' },
  };

export type FormaDeBase = 'arvore' | 'moita' | 'rocha' | 'monte' | 'barril' | 'cristal';

/**
 * A forma do item contavel de cada tipo.
 *
 * Existe porque a view desenhava **tres blocos escritos a mao** — madeira, fruta
 * e pedra — enquanto a lista de itens ja era montada para os nove tipos. Os seis
 * recursos novos eram calculados e nunca desenhados: os nos de mel apareciam
 * pelados na tela, sem nada para contar. Com a forma nos dados, acrescentar um
 * tipo deixa de exigir mexer no meio do JSX.
 */
export type FormaDeItem = 'graveto' | 'bolinha' | 'pedrinha' | 'lasca' | 'pote' | 'chapeu';

export const ITEM_SHAPE: Record<ResourceKind, FormaDeItem> = {
  madeira: 'graveto',
  fruta: 'bolinha',
  pedra: 'pedrinha',
  concha: 'bolinha',
  peixe: 'lasca',
  cogumelo: 'chapeu',
  cristal: 'lasca',
  mel: 'pote',
  gelo: 'lasca',
};
