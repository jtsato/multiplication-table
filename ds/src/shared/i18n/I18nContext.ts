import { createContext, useContext } from "react";
import type { TFunction } from "./i18n";
import type { LocaleCode } from "./locale.types";

export interface I18nContextValue {
  t: TFunction;
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n deve ser usado dentro de um I18nProvider");
  }
  return ctx;
}
