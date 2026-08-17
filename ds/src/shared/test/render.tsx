import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "../i18n/I18nProvider";

/** Renderiza com o contexto i18n; o idioma segue o localStorage (default pt-BR). */
export function renderWithI18n(ui: ReactElement, options?: RenderOptions) {
  return render(<I18nProvider>{ui}</I18nProvider>, options);
}
