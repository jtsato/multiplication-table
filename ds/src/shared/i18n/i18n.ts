import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";
import esES from "./locales/es-ES.json";
import frFR from "./locales/fr-FR.json";
import deDE from "./locales/de-DE.json";
import jaJP from "./locales/ja-JP.json";
import koKR from "./locales/ko-KR.json";
import zhCN from "./locales/zh-CN.json";
import type { LocaleCode, Messages } from "./locale.types";

// Paridade em tempo de compilação: cada idioma precisa ter a mesma forma de
// pt-BR (fonte da verdade). Chaves extras são capturadas pelo teste de paridade.
const messagesByLocale = {
  "pt-BR": ptBR,
  "en-US": enUS satisfies typeof ptBR,
  "es-ES": esES satisfies typeof ptBR,
  "fr-FR": frFR satisfies typeof ptBR,
  "de-DE": deDE satisfies typeof ptBR,
  "ja-JP": jaJP satisfies typeof ptBR,
  "ko-KR": koKR satisfies typeof ptBR,
  "zh-CN": zhCN satisfies typeof ptBR,
} satisfies Record<LocaleCode, Messages>;

/** Idiomas oferecidos, na ordem em que aparecem no seletor. */
export const SUPPORTED_LOCALES = Object.keys(messagesByLocale) as LocaleCode[];

/** Nome de cada idioma escrito nele mesmo, para quem não lê o idioma atual. */
export const LOCALE_ENDONYMS: Record<LocaleCode, string> = {
  "pt-BR": "Português",
  "en-US": "English",
  "es-ES": "Español",
  "fr-FR": "Français",
  "de-DE": "Deutsch",
  "ja-JP": "日本語",
  "ko-KR": "한국어",
  "zh-CN": "简体中文",
};

export const LOCALE_STORAGE_KEY = "batalha-da-tabuada.locale";

export const DEFAULT_LOCALE: LocaleCode = "pt-BR";

/**
 * União de todas as chaves aninhadas de pt-BR (ex.: "app.title",
 * "math.question"). Usada para tipar `t()` — chave inexistente é erro de
 * compilação (regra 7 da estratégia).
 */
export type MessageKey = DotPath<typeof ptBR>;

type DotPath<T> = T extends string
  ? never
  : {
      [K in keyof T]: K extends string
        ? T[K] extends string
          ? K
          : `${K}.${DotPath<T[K]>}`
        : never;
    }[keyof T];

export type TFunction = (key: MessageKey, params?: Record<string, string | number>) => string;

export function createI18n(locale: LocaleCode): { t: TFunction } {
  return {
    t: (key, params) => translate(messagesByLocale[locale], key, params),
  };
}

/** Traduz uma chave, interpolando parâmetros `{{nome}}`. */
export function translate(
  messages: Messages,
  key: string,
  params?: Record<string, string | number>,
): string {
  const value = lookup(messages, key);
  if (typeof value !== "string") return key;
  if (!params) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

function lookup(messages: Messages, key: string): string | Messages | undefined {
  let node: string | Messages | undefined = messages;
  for (const part of key.split(".")) {
    if (node === undefined || typeof node === "string") return undefined;
    node = node[part];
  }
  return node;
}

/** Lista ordenada de todas as chaves folha de um dicionário. */
export function flattenKeys(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flattenKeys(value, path);
  });
}

export function isSupportedLocale(value: string): value is LocaleCode {
  return (SUPPORTED_LOCALES as string[]).includes(value);
}

/**
 * Idioma base (`pt`, `ja`, ...) -> a variante que o jogo tem. `pt-PT` recebe
 * pt-BR, `en-GB` recebe en-US: melhor a variante próxima do que o padrão.
 *
 * Limitação conhecida: `zh-TW` e `zh-HK` leem chinês tradicional e recebem aqui
 * o simplificado. Resolver isso exige um dicionário zh-TW próprio.
 */
const LOCALE_BY_BASE_LANGUAGE: Record<string, LocaleCode> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
};

/**
 * Idioma preferido do navegador. Sem isto, um jogador japonês abriria o jogo em
 * português só porque pt-BR é o padrão.
 */
export function detectLocale(languages?: readonly string[]): LocaleCode {
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
    if (mapped) return mapped;
  }

  return DEFAULT_LOCALE;
}

/**
 * Escolha salva; na primeira visita, o idioma do navegador. `DEFAULT_LOCALE` só
 * entra quando nada mais serve.
 *
 * `languages` existe pelo mesmo motivo que `storage` é injetado: deixar o teste
 * descrever o ambiente em vez de depender do `navigator` do jsdom.
 */
export function getStoredLocale(
  storage: Pick<Storage, "getItem">,
  languages?: readonly string[],
): LocaleCode {
  try {
    const raw = storage.getItem(LOCALE_STORAGE_KEY);
    if (raw !== null && isSupportedLocale(raw)) return raw;
  } catch {
    // Armazenamento indisponível: cai na detecção pelo navegador.
  }
  return detectLocale(languages);
}

export function storeLocale(storage: Pick<Storage, "setItem">, locale: LocaleCode): void {
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Armazenamento indisponível (modo privado, quota): segue sem persistir.
  }
}
