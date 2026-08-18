import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "../i18n/I18nProvider";
import { LOCALE_STORAGE_KEY } from "../i18n/i18n";
import type { LocaleCode } from "../i18n/locale.types";

/**
 * Renderiza com o contexto i18n num idioma fixo (pt-BR por padrão).
 *
 * O idioma é gravado no localStorage antes de montar porque, sem escolha
 * salva, o provider cai na detecção pelo navegador — e o `navigator.language`
 * do jsdom é en-US. Fixar aqui deixa os testes independentes do ambiente.
 */
export function renderWithI18n(
  ui: ReactElement,
  options?: RenderOptions & { locale?: LocaleCode },
) {
  const { locale = "pt-BR", ...renderOptions } = options ?? {};
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  return render(<I18nProvider>{ui}</I18nProvider>, renderOptions);
}
