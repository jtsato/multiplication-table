import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";
import type { LocaleCode, Messages } from "./locale.types";

// Paridade em tempo de compilação: en-US precisa ter a mesma forma de pt-BR
// (fonte da verdade). Chaves extras são capturadas pelo teste de paridade.
const messagesByLocale = {
  "pt-BR": ptBR,
  "en-US": enUS satisfies typeof ptBR,
} satisfies Record<LocaleCode, Messages>;

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

export function getStoredLocale(storage: Pick<Storage, "getItem">): LocaleCode {
  try {
    const raw = storage.getItem(LOCALE_STORAGE_KEY);
    return raw === "pt-BR" || raw === "en-US" ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function storeLocale(storage: Pick<Storage, "setItem">, locale: LocaleCode): void {
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Armazenamento indisponível (modo privado, quota): segue sem persistir.
  }
}
