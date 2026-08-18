import { getHint } from "../domain/math/hints";
import type { Product } from "../content/stores";
import { GRAMMAR_BY_LOCALE } from "./grammar";
import { ptBR } from "./locales/pt-BR";
import { enUS } from "./locales/en-US";
import { esES } from "./locales/es-ES";
import { frFR } from "./locales/fr-FR";
import { deDE } from "./locales/de-DE";
import { jaJP } from "./locales/ja-JP";
import { koKR } from "./locales/ko-KR";
import { zhCN } from "./locales/zh-CN";
import type { LocaleBundle, LocaleDefinition, NounForms, UserLocale } from "./types";

export type { AppStrings, LocaleBundle, UserLocale } from "./types";

/**
 * Parcial de propósito: um idioma só aparece no jogo quando tem arquivo. Assim
 * dá para acrescentar traduções uma a uma sem que as que faltam quebrem o tipo
 * nem sejam oferecidas pela metade ao jogador.
 */
const LOCALES: Partial<Record<UserLocale, LocaleDefinition>> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es-ES": esES,
  "fr-FR": frFR,
  "de-DE": deDE,
  "ja-JP": jaJP,
  "ko-KR": koKR,
  "zh-CN": zhCN,
};

export const SUPPORTED_LOCALES = Object.keys(LOCALES) as UserLocale[];

/** Nome de cada idioma escrito nele mesmo. */
export const LOCALE_ENDONYMS: Record<UserLocale, string> = {
  "pt-BR": "Português",
  "en-US": "English",
  "es-ES": "Español",
  "fr-FR": "Français",
  "de-DE": "Deutsch",
  "ja-JP": "日本語",
  "ko-KR": "한국어",
  "zh-CN": "简体中文",
};

export const DEFAULT_LOCALE: UserLocale = "pt-BR";

/** Substitui `{{marcador}}` pelos valores informados. */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

function isSupportedLocale(value: string): value is UserLocale {
  return (SUPPORTED_LOCALES as string[]).includes(value);
}

/**
 * Idioma base (`pt`, `ja`, ...) -> a variante que o jogo tem, para que `pt-PT`
 * receba pt-BR e `en-GB` receba en-US em vez de cair no padrão.
 */
const LOCALE_BY_BASE_LANGUAGE: Record<string, UserLocale> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
};

export function detectLocale(languages?: readonly string[]): UserLocale {
  const candidates =
    languages ??
    (typeof navigator !== "undefined"
      ? (navigator.languages ?? [navigator.language])
      : ([] as readonly string[]));

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (isSupportedLocale(candidate)) return candidate;
    const base = candidate.split("-")[0]?.toLowerCase();
    const mapped = base ? LOCALE_BY_BASE_LANGUAGE[base] : undefined;
    if (mapped && isSupportedLocale(mapped)) return mapped;
  }

  return DEFAULT_LOCALE;
}

export function getUserLocale(): UserLocale {
  return detectLocale();
}

export function getLocalizedStrings(locale: UserLocale = getUserLocale()): LocaleBundle {
  const definition = LOCALES[locale] ?? ptBR;
  const strings = definition.strings;
  const grammar = GRAMMAR_BY_LOCALE[locale] ?? GRAMMAR_BY_LOCALE[DEFAULT_LOCALE];
  const content = definition.content;

  const money = (value: number) => interpolate(strings.moneyFormat, { value });

  /**
   * Formas do produto neste idioma. O nome do domínio é o último recurso: se um
   * produto novo entrar sem tradução, ele aparece em pt-BR em vez de sumir.
   */
  const nounsOf = (product: Product): NounForms =>
    definition.nouns[product.id] ?? {
      one: product.name.toLowerCase(),
      many: product.name.toLowerCase(),
      gender: "m",
    };

  const fill = (template: string, params: Record<string, string | number>) =>
    interpolate(template, params);

  return {
    ...strings,
    locale,
    money,
    dioramaLabel: (storeName) => fill(strings.dioramaLabel, { store: storeName }),
    dayAndChapter: (day, chapter) =>
      `${strings.dayLabel} ${day} · ${strings.chapterLabel} ${chapter}`,
    cashBadgeLabel: (cash) => `${strings.cashLabel} ${money(cash)}`,
    canBuyNow: (productName, priceText) =>
      fill(strings.canBuyNow, { product: productName, price: priceText }),
    missingAmount: (missingText, productName) =>
      fill(strings.missingAmount, { missing: missingText, product: productName }),
    purchaseUnavailable: (missingText, productName) =>
      fill(strings.purchaseUnavailable, { missing: missingText, product: productName }),
    dayClosedNotice: (revenue) =>
      fill(strings.dayClosedNotice, {
        prefix: strings.dayClosedPrefix,
        money: money(revenue),
      }),
    narrateCorrect: (quantity, price, answer) =>
      fill(strings.narrateCorrect, { quantity, price, answer }),
    narrateRetry: (hint) => fill(strings.narrateRetry, { hint }),
    customerCounter: (current, total) => fill(strings.customerCounter, { current, total }),
    customerArrived: (name) => fill(strings.customerArrived, { name }),
    customerWants: (quantity, product) => ({
      before: strings.customerWantsBefore,
      emphasis: grammar.counted(quantity, nounsOf(product)),
      after: strings.customerWantsAfter,
    }),
    quantityQuestion: (product) => grammar.howMany(nounsOf(product)),
    unitExplain: (quantity, product, priceText) => {
      const forms = nounsOf(product);
      return fill(strings.unitExplain, {
        counted: grammar.counted(quantity, forms),
        each: grammar.each(forms),
        price: priceText,
      });
    },
    quantityPileLabel: (selected, total) => fill(strings.quantityPileLabel, { selected, total }),
    quantityProgress: (selected, total) => fill(strings.quantityProgress, { selected, total }),
    equation: (quantity, price) => `${quantity} × ${money(price)}`,
    correctAnswer: (answer) => fill(strings.correctAnswer, { money: money(answer) }),
    priceLine: (price) => `${strings.productPrice}: ${money(price)}`,
    buyForLabel: (cost) => `${strings.buyFor} ${money(cost)}`,
    /**
     * Os níveis 1 e 2 são texto e vêm do idioma; os níveis 3 e 4 são a conta
     * escrita por extenso ("2 + 2 + 2", "3 × 4 = 12") e valem em qualquer
     * idioma, então continuam vindo do domínio.
     */
    hintText: (fact, errorCount) => {
      const hint = getHint(fact, errorCount);
      if (hint.level === 1) return strings.hintLevel1;
      if (hint.level === 2)
        return fill(strings.hintLevel2, { quantity: fact.a, price: money(fact.b) });
      return hint.text;
    },
    storeText: (store) => content?.stores[store.id] ?? store,
    productName: (product) => content?.products[product.id] ?? product.name,
    customerPhrase: (customer) => content?.customerPhrases[customer.id] ?? customer.phrase,
    achievementText: (achievement) => content?.achievements[achievement.id] ?? achievement,
    objectiveText: (objective) => content?.objectives[objective.id] ?? objective,
    cosmeticName: (id, fallback) => strings.cosmeticNames[id] ?? fallback,
  };
}
