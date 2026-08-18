import type { LocaleGrammar, NounForms, UserLocale } from "./types";

/**
 * Como cada idioma monta "N produtos", "Quantos produtos?" e "cada um".
 *
 * Isto existe porque um único modelo não cobre os oito. Os latinos escolhem
 * entre singular e plural e concordam em gênero; japonês, coreano e chinês não
 * têm nem plural nem gênero, mas exigem um classificador — e o chinês ainda o
 * coloca antes do substantivo. Nenhuma interpolação `{{n}} {{produto}}` daria
 * conta dos dois lados.
 */

const plural = (quantity: number, forms: NounForms) => (quantity === 1 ? forms.one : forms.many);

/** Base compartilhada por português e espanhol, que concordam igual. */
const romanceWithGender = (
  howManyMasculine: string,
  howManyFeminine: string,
  eachMasculine: string,
  eachFeminine: string,
): LocaleGrammar => ({
  counted: (quantity, forms) => `${quantity} ${plural(quantity, forms)}`,
  howMany: (forms) => `${forms.gender === "f" ? howManyFeminine : howManyMasculine} ${forms.many}?`,
  each: (forms) => (forms.gender === "f" ? eachFeminine : eachMasculine),
});

export const GRAMMAR_BY_LOCALE: Record<UserLocale, LocaleGrammar> = {
  "pt-BR": romanceWithGender("Quantos", "Quantas", "cada um", "cada uma"),

  "es-ES": romanceWithGender("Cuántos", "Cuántas", "cada uno", "cada una"),

  "en-US": {
    counted: (quantity, forms) => `${quantity} ${plural(quantity, forms)}`,
    howMany: (forms) => `How many ${forms.many}?`,
    each: () => "each one",
  },

  // "Combien de crayons ?" — `de` não muda com o gênero, mas `chacun` muda.
  "fr-FR": {
    counted: (quantity, forms) => `${quantity} ${plural(quantity, forms)}`,
    howMany: (forms) => `Combien de ${forms.many} ?`,
    each: (forms) => (forms.gender === "f" ? "chacune" : "chacun"),
  },

  // O alemão tem três gêneros, mas nem `wie viele` nem `jeweils` variam — o que
  // varia e precisa vir escrito é o plural (Buch→Bücher, Ball→Bälle).
  "de-DE": {
    counted: (quantity, forms) => `${quantity} ${plural(quantity, forms)}`,
    howMany: (forms) => `Wie viele ${forms.many}?`,
    each: () => "jeweils",
  },

  // Sem plural: o número gruda no classificador, depois do substantivo.
  "ja-JP": {
    counted: (quantity, forms) => `${forms.one}${quantity}${forms.counter ?? "個"}`,
    howMany: (forms) => `${forms.one}は何${forms.counter ?? "個"}？`,
    each: () => "1つあたり",
  },

  "ko-KR": {
    counted: (quantity, forms) => `${forms.one} ${quantity}${forms.counter ?? "개"}`,
    howMany: (forms) => `${forms.one} 몇 ${forms.counter ?? "개"}?`,
    each: () => "한 개당",
  },

  // Aqui o classificador vem ANTES do substantivo: 3支铅笔, e não 铅笔3支.
  "zh-CN": {
    counted: (quantity, forms) => `${quantity}${forms.counter ?? "个"}${forms.one}`,
    howMany: (forms) => `几${forms.counter ?? "个"}${forms.one}？`,
    each: () => "每个",
  },
};
