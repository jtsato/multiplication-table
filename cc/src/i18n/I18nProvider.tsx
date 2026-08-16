import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Locale } from '../domain/types';
import { createTranslator, type TranslateFn, type TranslationParams } from './translate';

interface I18nContextValue {
  locale: Locale;
  t: TranslateFn;
  /** Escolhe uma das variacoes numeradas de uma chave (feedback.correct.0..3). */
  tVariant: (baseKey: string, index: number, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(() => {
    const t = createTranslator(locale);
    return {
      locale,
      t,
      tVariant: (baseKey, index, params) => t(`${baseKey}.${index}`, params),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation precisa estar dentro de <I18nProvider>');
  }
  return context;
}
