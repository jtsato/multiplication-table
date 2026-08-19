import type { LocaleGrammar, NounForms, UserLocale } from './types';

/**
 * Como cada idioma monta "3 conchas" e "Quantas conchas?".
 *
 * Espelha `st/src/i18n/grammar.ts`, que ja resolveu isto para os mesmos oito
 * idiomas. Um unico modelo nao cobre todos: os latinos escolhem entre singular e
 * plural e concordam em genero; japones, coreano e chines nao tem nem plural nem
 * genero, mas exigem um classificador — e o chines ainda o coloca antes do
 * substantivo.
 *
 * E por isso que a gramatica e **codigo**, e os substantivos sao **dados**. O que
 * o tradutor escreve e "concha/conchas, feminino"; como isso vira frase e regra
 * do idioma, nao escolha de quem traduz.
 */

const plural = (quantity: number, forms: NounForms) => (quantity === 1 ? forms.one : forms.many);

/** Base compartilhada por portugues e espanhol, que concordam igual. */
const romanceWithGender = (
  howManyMasculine: string,
  howManyFeminine: string,
  /** "ao todo", "en total" — o fecho da pergunta, que muda por idioma. */
  inTotal: string,
): LocaleGrammar => ({
  counted: (quantity, forms) => `${quantity} ${plural(quantity, forms)}`,
  howMany: (forms) =>
    `${forms.gender === 'f' ? howManyFeminine : howManyMasculine} ${forms.many} ${inTotal}?`,
});

export const GRAMMAR_BY_LOCALE: Record<UserLocale, LocaleGrammar> = {
  'pt-BR': romanceWithGender('Quantos', 'Quantas', 'ao todo'),

  'es-ES': romanceWithGender('Cuántos', 'Cuántas', 'en total'),

  'en-US': {
    counted: (quantity, forms) => `${quantity} ${plural(quantity, forms)}`,
    howMany: (forms) => `How many ${forms.many} in total?`,
  },

  // "Combien de coquillages ?" — `de` nao muda com o genero.
  'fr-FR': {
    counted: (quantity, forms) => `${quantity} ${plural(quantity, forms)}`,
    howMany: (forms) => `Combien de ${forms.many} en tout ?`,
  },

  // O alemao tem tres generos, mas `wie viele` nao varia — o que varia e precisa
  // vir escrito e o plural (Muschel→Muscheln).
  'de-DE': {
    counted: (quantity, forms) => `${quantity} ${plural(quantity, forms)}`,
    howMany: (forms) => `Wie viele ${forms.many} insgesamt?`,
  },

  // Sem plural: o numero gruda no classificador, depois do substantivo.
  'ja-JP': {
    counted: (quantity, forms) => `${forms.one}${quantity}${forms.counter ?? '個'}`,
    howMany: (forms) => `${forms.one}は何${forms.counter ?? '個'}？`,
  },

  'ko-KR': {
    counted: (quantity, forms) => `${forms.one} ${quantity}${forms.counter ?? '개'}`,
    howMany: (forms) => `${forms.one}이 몇 ${forms.counter ?? '개'}인가요?`,
  },

  // Em chines o classificador vem ANTES do substantivo: 3个贝壳.
  'zh-CN': {
    counted: (quantity, forms) => `${quantity}${forms.counter ?? '个'}${forms.one}`,
    howMany: (forms) => `一共有多少${forms.counter ?? '个'}${forms.one}？`,
  },
};
