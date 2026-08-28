import type { AppStrings, LocaleBundle } from '../../i18n';
import { canAfford, formatRecipe, type Recipe } from '../building/building.logic';
import type { Inventory } from '../resources/resources.logic';

/**
 * Economia: moedas, sequencia de acertos e fatos ja dominados.
 *
 * A regra que sustenta a slice inteira: **o recurso e o resultado da conta, a
 * moeda e o premio por ter acertado**. O recurso e concreto e vem em quantidade
 * calculada — a crianca conta 4 cestinhos de 2 conchas e passa a ter 8 conchas.
 * A moeda e abstrata e diz apenas *se* ela acertou.
 *
 * Por isso nao existe vender recurso por moeda em lugar nenhum do jogo: isso
 * faria o erro virar moeda por caminho indireto e a moeda deixaria de significar
 * dominio.
 */

export const ECONOMY = {
  startingSeeds: 2,
  /** Bonus a cada `streakEvery` acertos seguidos. */
  streakBonus: 5,
  /** Bonus da primeira vez que um fato e resolvido. Uma vez por fato. */
  newFactBonus: 10,
  streakEvery: 3,
} as const;

/**
 * Identificador do fato, com os fatores em ordem canonica.
 *
 * 2x4 e 4x2 sao o mesmo fato para quem esta aprendendo. Sem normalizar a ordem,
 * o bonus de "primeira vez" seria pago duas vezes pela mesma descoberta.
 */
export function factKey(a: number, b: number): string {
  const [menor, maior] = a <= b ? [a, b] : [b, a];
  return `${menor}x${maior}`;
}

export interface CoinInput {
  /** Itens por grupo — o numero da tabuada. */
  perGroup: number;
  /** Quantos acertos seguidos, ja contando este. */
  streak: number;
  factIsNew: boolean;
}

/**
 * Quanto vale um acerto.
 *
 * A base e o **numero da tabuada**, e nao um valor fixo. Com as regioes no ar, um
 * no do Pico paga 9 e um da Praia paga 2 sem nenhuma regra a mais: a moeda
 * cresce com a dificuldade de graca, porque a dificuldade ja esta no numero.
 */
export function coinsFor({ perGroup, streak, factIsNew }: CoinInput): number {
  let coins = perGroup;
  if (streak > 0 && streak % ECONOMY.streakEvery === 0) coins += ECONOMY.streakBonus;
  if (factIsNew) coins += ECONOMY.newFactBonus;
  return coins;
}

/* ------------------------------------------------------------------ loja --- */

export type ShopItemKind =
  | 'lanterna-maior'
  | 'botas'
  | 'sementes'
  // Decoracao da casa: o ralo permanente das colheitas de regiao.
  | 'tapete'
  | 'aquario'
  | 'vaso'
  | 'lustre'
  | 'prateleira'
  | 'escultura';

/**
 * Para que serve o item.
 *
 * `ferramenta` muda como se joga; `casa` so enfeita — e e de proposito que
 * enfeitar custe caro e nao faca nada. Um ralo que nao se consome e o oposto de
 * item descartavel, que e o que o genero cozy pede: a crianca gasta para ter, e
 * o que ela tem fica.
 */
export type ShopCategory = 'ferramenta' | 'casa' | 'horta';

/**
 * Um item da loja.
 *
 * **Sem rotulo nem descricao aqui.** O nome e o efeito sao texto e vivem nos
 * arquivos de idioma; o que fica no catalogo e o que nao se traduz: preco,
 * receita, categoria e se repete.
 */
export interface ShopItem {
  kind: ShopItemKind;
  category: ShopCategory;
  coins: number;
  recipe: Recipe;
  /**
   * Da para comprar mais de uma vez?
   *
   * Melhoria permanente e uma so; consumivel acumula. Sem esta marca, a crianca
   * gastaria moeda numa segunda lanterna que nao faria nada.
   */
  repeatable: boolean;
}

/**
 * O catalogo.
 *
 * Todo item custa **moedas e recursos**, nunca so moedas. E isso que da destino
 * ao que se colhe: sem um ralo, o recurso vira contador, que e exatamente o
 * defeito que a fruta tinha antes desta fase — colhida, contada no HUD e nunca
 * gasta em nada.
 *
 * Os nove tipos de recurso do jogo sao consumidos por alguma coisa aqui. Ha uma
 * varredura que falha se alguem acrescentar um recurso sem destino — foi ela que
 * cobrou os seis destinos novos quando as colheitas de regiao entraram.
 */
export const SHOP_ITEMS: Record<ShopItemKind, ShopItem> = {
  'lanterna-maior': {
    kind: 'lanterna-maior',
    category: 'ferramenta',
    coins: 30,
    recipe: { concha: 8 },
    repeatable: false,
  },
  botas: {
    kind: 'botas',
    category: 'ferramenta',
    coins: 25,
    recipe: { pedra: 6 },
    repeatable: false,
  },
  sementes: {
    kind: 'sementes',
    category: 'horta',
    coins: 8,
    recipe: { mel: 4 },
    repeatable: true,
  },

  /*
    A casa que cresce.

    Cada peca consome a colheita de uma regiao, e e assim que conchas, peixes,
    cogumelos, cristais, mel e gelo ganham destino. Sem isto eles entrariam no
    jogo como a fruta entrou: colhidos, contados no HUD e nunca gastos em nada —
    contador, e nao recompensa.

    Nenhuma delas faz o menor efeito no jogo, e isso e a intencao. O premio e
    poder mostrar.
  */
  tapete: {
    kind: 'tapete',
    category: 'casa',
    coins: 20,
    recipe: { concha: 6 },
    repeatable: false,
  },
  aquario: {
    kind: 'aquario',
    category: 'casa',
    coins: 35,
    recipe: { peixe: 8 },
    repeatable: false,
  },
  vaso: {
    kind: 'vaso',
    category: 'casa',
    coins: 20,
    recipe: { cogumelo: 6 },
    repeatable: false,
  },
  lustre: {
    kind: 'lustre',
    category: 'casa',
    coins: 45,
    recipe: { cristal: 8 },
    repeatable: false,
  },
  prateleira: {
    kind: 'prateleira',
    category: 'casa',
    coins: 25,
    recipe: { mel: 6 },
    repeatable: false,
  },
  escultura: {
    kind: 'escultura',
    category: 'casa',
    coins: 40,
    recipe: { gelo: 8 },
    repeatable: false,
  },
};

export const SHOP_ORDER: readonly ShopItemKind[] = Object.keys(SHOP_ITEMS) as ShopItemKind[];

export type PurchaseRejection = 'sem-moedas' | 'sem-recursos' | 'ja-comprado';

export type PurchaseCheck = { ok: true } | { ok: false; reason: PurchaseRejection };

/**
 * Da para comprar este item agora?
 *
 * A ordem das recusas importa para a mensagem: dizer "ja comprado" e mais util
 * que "sem moedas" quando os dois valem.
 */
export function checkPurchase(
  item: ShopItem,
  coins: number,
  inventory: Inventory,
  owned: readonly ShopItemKind[],
): PurchaseCheck {
  if (!item.repeatable && owned.includes(item.kind)) {
    return { ok: false, reason: 'ja-comprado' };
  }
  if (coins < item.coins) return { ok: false, reason: 'sem-moedas' };
  if (!canAfford(inventory, item.recipe)) return { ok: false, reason: 'sem-recursos' };
  return { ok: true };
}

/**
 * A recusa, escrita no idioma da crianca.
 *
 * Funcao em vez de tabela de strings porque a tabela teria que viver em dois
 * lugares — aqui e no locale — e as duas poderiam divergir. Assim o catalogo
 * conhece os motivos e o locale conhece as palavras.
 */
export function purchaseMessage(reason: PurchaseRejection, strings: AppStrings): string {
  if (reason === 'sem-moedas') return strings.noCoins;
  if (reason === 'sem-recursos') return strings.noResources;
  return strings.alreadyOwned;
}

/** Custo em recursos, escrito como o HUD escreve as receitas. */
export function formatShopRecipe(item: ShopItem, bundle: LocaleBundle): string {
  return formatRecipe(item.recipe, bundle);
}
