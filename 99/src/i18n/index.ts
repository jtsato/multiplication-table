import { GRAMMAR_BY_LOCALE } from './grammar';
import { ptBR } from './locales/pt-BR';
import { enUS } from './locales/en-US';
import type { LocaleBundle, LocaleDefinition, UserLocale } from './types';

export type {
  AppStrings,
  Gender,
  LocaleBundle,
  LocaleDefinition,
  LocaleGrammar,
  NounForms,
  ResourceNouns,
  UserLocale,
} from './types';
export { GRAMMAR_BY_LOCALE } from './grammar';

/**
 * Parcial de proposito: um idioma so aparece no jogo quando tem arquivo.
 *
 * Assim da para acrescentar traducoes uma a uma sem que as que faltam quebrem o
 * tipo nem sejam oferecidas pela metade a crianca. Meia traducao e pior que
 * nenhuma — ela escolhe o idioma e encontra telas em portugues no meio.
 *
 * A gramatica dos oito ja existe; o que falta para cada idioma novo e **um
 * arquivo de dados**, nunca um ramo de codigo.
 */
const LOCALES: Partial<Record<UserLocale, LocaleDefinition>> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

export const SUPPORTED_LOCALES = Object.keys(LOCALES) as UserLocale[];

export const DEFAULT_LOCALE: UserLocale = 'pt-BR';

/** Nome de cada idioma escrito nele mesmo — nunca traduzido. */
export const LOCALE_ENDONYMS: Record<UserLocale, string> = {
  'pt-BR': 'Português',
  'en-US': 'English',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'zh-CN': '简体中文',
};

/**
 * Substitui `{{marcador}}` pelos valores informados.
 *
 * **Lanca** quando falta um valor, de proposito: um marcador sem valor e bug de
 * programa, e vazar `{{moedas}}` na tela da crianca e pior que quebrar no teste.
 */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, nome: string) => {
    const valor = params[nome];
    if (valor === undefined) {
      throw new Error(`i18n: falta o valor de "${nome}" em "${template}"`);
    }
    return String(valor);
  });
}

/** O pacote completo de um idioma, com a gramatica junto. */
export function bundleFor(locale: UserLocale): LocaleBundle {
  const definicao = LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE]!;
  const escolhido = LOCALES[locale] ? locale : DEFAULT_LOCALE;
  return { ...definicao, locale: escolhido, grammar: GRAMMAR_BY_LOCALE[escolhido] };
}

/**
 * Valida um idioma vindo do save ou do navegador.
 *
 * Nunca lanca, pelo mesmo motivo de `migrateAvatar`: uma preferencia estranha
 * guardada no navegador nao pode impedir a crianca de jogar.
 */
export function migrateLocale(raw: unknown): UserLocale {
  if (typeof raw !== 'string') return DEFAULT_LOCALE;
  return SUPPORTED_LOCALES.includes(raw as UserLocale) ? (raw as UserLocale) : DEFAULT_LOCALE;
}

/**
 * O idioma que o navegador pede, se estiver disponivel.
 *
 * Serve so como primeiro palpite: a escolha explicita da crianca sempre ganha, e
 * e ela que fica no save.
 */
export function localeFromNavigator(languages: readonly string[]): UserLocale {
  for (const pedido of languages) {
    const exato = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === pedido.toLowerCase());
    if (exato) return exato;
    const base = pedido.split('-')[0].toLowerCase();
    const porIdioma = SUPPORTED_LOCALES.find((l) => l.split('-')[0].toLowerCase() === base);
    if (porIdioma) return porIdioma;
  }
  return DEFAULT_LOCALE;
}
