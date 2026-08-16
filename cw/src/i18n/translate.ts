import enUS from './locales/en-US.json';
import ptBR from './locales/pt-BR.json';
import type { Locale } from '../domain/types';

export type TranslationTree = { [key: string]: string | string[] | TranslationTree };

export const DICTIONARIES: Record<Locale, TranslationTree> = {
  'pt-BR': ptBR as TranslationTree,
  'en-US': enUS as TranslationTree,
};

export const FALLBACK_LOCALE: Locale = 'pt-BR';

export type TranslationParams = Record<string, string | number>;

function lookup(tree: TranslationTree, path: string): string | string[] | undefined {
  const segments = path.split('.');
  let node: string | string[] | TranslationTree | undefined = tree;
  for (const segment of segments) {
    if (typeof node !== 'object' || Array.isArray(node) || node === undefined) return undefined;
    node = node[segment];
  }
  if (typeof node === 'string' || Array.isArray(node)) return node;
  return undefined;
}

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Traduz uma chave. Cai no idioma padrão e, em último caso, devolve a chave. */
export function translate(locale: Locale, key: string, params?: TranslationParams): string {
  const primary = lookup(DICTIONARIES[locale] ?? {}, key);
  const value = primary ?? lookup(DICTIONARIES[FALLBACK_LOCALE], key);
  if (typeof value === 'string') return interpolate(value, params);
  if (Array.isArray(value)) return interpolate(value[0] ?? key, params);
  return key;
}

/** Traduz chaves que contêm listas (mensagens variadas de acerto/erro). */
export function translateList(locale: Locale, key: string): string[] {
  const value = lookup(DICTIONARIES[locale] ?? {}, key) ?? lookup(DICTIONARIES[FALLBACK_LOCALE], key);
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [key];
}

/** Verifica se duas árvores têm exatamente o mesmo conjunto de chaves. */
export function collectKeys(tree: TranslationTree, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [name, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${name}` : name;
    if (typeof value === 'string' || Array.isArray(value)) keys.push(path);
    else keys.push(...collectKeys(value, path));
  }
  return keys.sort();
}
