import type { Locale } from '../domain/types';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import { SUPPORTED_LOCALES } from '../domain/types';

/**
 * Internacionalizacao minima, sem dependencia externa.
 *
 * Regras:
 *  - nenhum texto visivel fica escrito dentro de componente;
 *  - chave ausente cai no idioma de fallback e, no limite, mostra a propria
 *    chave (erro visivel em desenvolvimento, nunca tela em branco);
 *  - interpolacao no formato {{nome}}.
 *
 * Adicionar um idioma: criar `locales/<tag>.json`, registrar em DICTIONARIES
 * e incluir a tag em SUPPORTED_LOCALES.
 */

export type TranslationTree = { [key: string]: string | TranslationTree };
export type TranslationParams = Record<string, string | number>;
export type TranslateFn = (key: string, params?: TranslationParams) => string;

export const FALLBACK_LOCALE: Locale = 'en-US';

export const DICTIONARIES: Record<Locale, TranslationTree> = {
  'pt-BR': ptBR as TranslationTree,
  'en-US': enUS as TranslationTree,
};

/** Percorre "a.b.c" na arvore de traducoes. */
function lookup(tree: TranslationTree, key: string): string | undefined {
  const parts = key.split('.');
  let node: string | TranslationTree | undefined = tree;

  for (const part of parts) {
    if (typeof node !== 'object' || node === null) {
      return undefined;
    }
    node = node[part];
  }

  return typeof node === 'string' ? node : undefined;
}

/** Substitui {{param}} pelos valores informados. */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function createTranslator(locale: Locale): TranslateFn {
  const primary = DICTIONARIES[locale] ?? DICTIONARIES[FALLBACK_LOCALE];
  const fallback = DICTIONARIES[FALLBACK_LOCALE];

  return (key, params) => {
    const template = lookup(primary, key) ?? lookup(fallback, key);
    if (template === undefined) {
      if (import.meta.env?.DEV) {
        console.warn(`[i18n] chave sem traducao: ${key}`);
      }
      return key;
    }
    return interpolate(template, params);
  };
}

/** Nome e bandeira de um idioma, escritos no proprio idioma. */
export function localeMeta(locale: Locale): { name: string; flag: string } {
  const tree = DICTIONARIES[locale] ?? DICTIONARIES[FALLBACK_LOCALE];
  return {
    name: lookup(tree, 'meta.name') ?? locale,
    flag: lookup(tree, 'meta.flag') ?? '🌐',
  };
}

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Descobre o idioma do navegador. `pt` de qualquer regiao vira pt-BR;
 * qualquer outra coisa cai no ingles.
 */
export function detectLocale(languages?: readonly string[]): Locale {
  const candidates =
    languages ??
    (typeof navigator !== 'undefined'
      ? (navigator.languages ?? [navigator.language])
      : ([] as readonly string[]));

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (isSupportedLocale(candidate)) {
      return candidate;
    }
    const base = candidate.split('-')[0]?.toLowerCase();
    if (base === 'pt') {
      return 'pt-BR';
    }
    if (base === 'en') {
      return 'en-US';
    }
  }

  return FALLBACK_LOCALE;
}

/** Lista de chaves "folha" de um dicionario; usada para checar cobertura. */
export function collectKeys(tree: TranslationTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : collectKeys(value, path);
  });
}
