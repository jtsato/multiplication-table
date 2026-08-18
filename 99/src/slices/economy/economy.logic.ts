import { canAfford, formatRecipe, type Recipe } from '../building/building.logic';
import type { Inventory } from '../resources/resources.logic';

/**
 * Economia: moedas, sequencia de acertos e fatos ja dominados.
 *
 * A regra que sustenta a slice inteira: **o recurso e o resultado da conta, a
 * moeda e o premio por ter acertado**. O recurso e concreto e vem em quantidade
 * calculada — a crianca conta 4 galhos de 2 gravetos e passa a ter 8 gravetos.
 * A moeda e abstrata e diz apenas *se* ela acertou.
 *
 * Por isso nao existe vender recurso por moeda em lugar nenhum do jogo: isso
 * faria o erro virar moeda por caminho indireto e a moeda deixaria de significar
 * dominio.
 */

export const ECONOMY = {
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
  | 'dica'
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
export type ShopCategory = 'ferramenta' | 'casa';

export interface ShopItem {
  kind: ShopItemKind;
  category: ShopCategory;
  label: string;
  /** Uma frase curta. A regra de nao exigir leitura fluente vale aqui tambem. */
  effect: string;
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
    label: 'Lanterna maior',
    effect: 'Ilumina mais longe e dura mais.',
    coins: 30,
    recipe: { madeira: 8 },
    repeatable: false,
  },
  botas: {
    kind: 'botas',
    category: 'ferramenta',
    label: 'Botas',
    effect: 'Você anda mais rápido.',
    coins: 25,
    recipe: { pedra: 6 },
    repeatable: false,
  },
  dica: {
    kind: 'dica',
    category: 'ferramenta',
    label: 'Dica',
    effect: 'Apaga uma resposta errada.',
    coins: 10,
    recipe: { fruta: 4 },
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
    label: 'Tapete de conchas',
    effect: 'Deixa a sala mais macia.',
    coins: 20,
    recipe: { concha: 6 },
    repeatable: false,
  },
  aquario: {
    kind: 'aquario',
    category: 'casa',
    label: 'Aquário',
    effect: 'Os peixes ficam nadando.',
    coins: 35,
    recipe: { peixe: 8 },
    repeatable: false,
  },
  vaso: {
    kind: 'vaso',
    category: 'casa',
    label: 'Vaso de cogumelos',
    effect: 'Brilha um pouquinho à noite.',
    coins: 20,
    recipe: { cogumelo: 6 },
    repeatable: false,
  },
  lustre: {
    kind: 'lustre',
    category: 'casa',
    label: 'Lustre de cristal',
    effect: 'Espalha luz colorida.',
    coins: 45,
    recipe: { cristal: 8 },
    repeatable: false,
  },
  prateleira: {
    kind: 'prateleira',
    category: 'casa',
    label: 'Prateleira de mel',
    effect: 'Cheira bem de longe.',
    coins: 25,
    recipe: { mel: 6 },
    repeatable: false,
  },
  escultura: {
    kind: 'escultura',
    category: 'casa',
    label: 'Escultura de gelo',
    effect: 'Não derrete nunca.',
    coins: 40,
    recipe: { gelo: 8 },
    repeatable: false,
  },
};

export const SHOP_ORDER: readonly ShopItemKind[] = [
  'lanterna-maior',
  'botas',
  'dica',
  'tapete',
  'aquario',
  'vaso',
  'lustre',
  'prateleira',
  'escultura',
];

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

export const PURCHASE_MESSAGES: Record<PurchaseRejection, string> = {
  'sem-moedas': 'Faltam moedas',
  'sem-recursos': 'Faltam recursos',
  'ja-comprado': 'Você já tem',
};

/** Custo em recursos, escrito como o HUD escreve as receitas. */
export function formatShopRecipe(item: ShopItem): string {
  return formatRecipe(item.recipe);
}
