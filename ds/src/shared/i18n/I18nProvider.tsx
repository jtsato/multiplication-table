import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { I18nContext } from "./I18nContext";
import { createI18n, getStoredLocale, storeLocale } from "./i18n";
import type { LocaleCode } from "./locale.types";

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => getStoredLocale(window.localStorage));

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    storeLocale(window.localStorage, next);
  }, []);

  // Mantém o atributo lang do documento sincronizado com o idioma ativo.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => {
    const { t } = createI18n(locale);
    return { t, locale, setLocale };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
