import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { translate, translateList, type TranslationParams } from './translate';
import type { Locale } from '../domain/types';

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: TranslationParams) => string;
  tList: (key: string) => string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, params) => translate(locale, key, params),
      tList: (key) => translateList(locale, key),
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n precisa estar dentro de <I18nProvider>');
  return ctx;
}
