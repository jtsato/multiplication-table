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
 * A base e o **numero da tabuada**, e nao um valor fixo: hoje toda conta paga 2,
 * mas quando as regioes chegarem (Fase 4) a tabuada do 9 vai pagar 9 sozinha,
 * sem nenhuma regra nova. A moeda cresce com a dificuldade de graca.
 */
export function coinsFor({ perGroup, streak, factIsNew }: CoinInput): number {
  let coins = perGroup;
  if (streak > 0 && streak % ECONOMY.streakEvery === 0) coins += ECONOMY.streakBonus;
  if (factIsNew) coins += ECONOMY.newFactBonus;
  return coins;
}

/* ------------------------------------------------------------------ loja --- */

export type ShopItemKind = 'lanterna-maior' | 'botas' | 'dica';

export interface ShopItem {
  kind: ShopItemKind;
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
 * Entre os tres itens, os tres tipos de recurso sao consumidos. Ha um teste que
 * falha se alguem acrescentar um recurso sem destino.
 */
export const SHOP_ITEMS: Record<ShopItemKind, ShopItem> = {
  'lanterna-maior': {
    kind: 'lanterna-maior',
    label: 'Lanterna maior',
    effect: 'Ilumina mais longe e dura mais.',
    coins: 30,
    recipe: { madeira: 8 },
    repeatable: false,
  },
  botas: {
    kind: 'botas',
    label: 'Botas',
    effect: 'Você anda mais rápido.',
    coins: 25,
    recipe: { pedra: 6 },
    repeatable: false,
  },
  dica: {
    kind: 'dica',
    label: 'Dica',
    effect: 'Apaga uma resposta errada.',
    coins: 10,
    recipe: { fruta: 4 },
    repeatable: true,
  },
};

export const SHOP_ORDER: readonly ShopItemKind[] = ['lanterna-maior', 'botas', 'dica'];

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
