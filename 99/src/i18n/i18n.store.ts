import type { StateCreator } from 'zustand';
import type { GameState } from '../app/store';
import { DEFAULT_LOCALE, bundleFor, migrateLocale } from './index';
import type { LocaleBundle, UserLocale } from './types';

/**
 * O idioma escolhido.
 *
 * Fica no store, e nao num contexto de React proprio, por dois motivos. O
 * primeiro e que ele **persiste** junto com o resto do save, como a aparencia do
 * avatar. O segundo e que o pacote de textos e um objeto estavel por idioma: um
 * seletor `state.text` devolve sempre a mesma referencia enquanto o idioma nao
 * muda, entao trocar de idioma repinta tudo e jogar nao repinta nada.
 */
export interface I18nSlice {
  locale: UserLocale;
  /** O pacote pronto do idioma atual: textos, substantivos e gramatica. */
  text: LocaleBundle;
  setLocale: (locale: UserLocale) => void;
  resetLocale: () => void;
}

export const createI18nSlice: StateCreator<GameState, [], [], I18nSlice> = (set) => ({
  locale: DEFAULT_LOCALE,
  text: bundleFor(DEFAULT_LOCALE),

  setLocale: (locale) =>
    set((state) => {
      const escolhido = migrateLocale(locale);
      if (state.locale === escolhido) return state;
      return { locale: escolhido, text: bundleFor(escolhido) };
    }),

  resetLocale: () => set({ locale: DEFAULT_LOCALE, text: bundleFor(DEFAULT_LOCALE) }),
});
