import { ptBR } from './pt-BR.js';
import { enUS } from './en-US.js';

const dictionaries = { 'pt-BR': ptBR, 'en-US': enUS };

export function t(locale, key, params = {}) {
  const dictionary = dictionaries[locale] ?? dictionaries['pt-BR'];
  const template = dictionary[key] ?? dictionaries['pt-BR'][key] ?? key;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
