import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LOCALE_STORAGE_KEY } from "./i18n";
import { I18nProvider } from "./I18nProvider";
import { useI18n } from "./I18nContext";

function Probe() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="title">{t("app.title")}</span>
      <button type="button" onClick={() => setLocale("en-US")}>
        para-en
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
}

describe("I18nProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("inicia em pt-BR por padrão", () => {
    renderProbe();
    expect(screen.getByTestId("locale")).toHaveTextContent("pt-BR");
    expect(screen.getByTestId("title")).toHaveTextContent("Batalha da Tabuada");
  });

  it("troca o idioma e persiste no localStorage", async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByRole("button", { name: "para-en" }));
    expect(screen.getByTestId("locale")).toHaveTextContent("en-US");
    expect(screen.getByTestId("title")).toHaveTextContent("Times Table Battle");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en-US");
  });

  it("inicia com o idioma armazenado", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US");
    renderProbe();
    expect(screen.getByTestId("locale")).toHaveTextContent("en-US");
    expect(screen.getByTestId("title")).toHaveTextContent("Times Table Battle");
  });

  it("sincroniza o atributo lang do documento", async () => {
    const user = userEvent.setup();
    renderProbe();
    expect(document.documentElement.lang).toBe("pt-BR");
    await user.click(screen.getByRole("button", { name: "para-en" }));
    expect(document.documentElement.lang).toBe("en-US");
  });
});

describe("useI18n", () => {
  it("lança erro quando usado fora do provider", () => {
    expect(() => render(<Probe />)).toThrow(/I18nProvider/);
  });
});
