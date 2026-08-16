import { enUS } from '../locales/en-US';
import { ptBR } from '../locales/pt-BR';
import type { Locale } from '../domain/types';

const catalogues = { 'pt-BR': ptBR, 'en-US': enUS } as const;
export type TranslationKey = keyof typeof ptBR;

export function translate(
  locale: Locale,
  key: string,
  values: Record<string, string | number> = {},
): string {
  const catalogue = catalogues[locale] as Record<string, string>;
  const fallback = ptBR as Record<string, string>;
  let text = catalogue[key] ?? fallback[key] ?? key;
  for (const [name, value] of Object.entries(values))
    text = text.replaceAll(`{{${name}}}`, String(value));
  return text;
}
