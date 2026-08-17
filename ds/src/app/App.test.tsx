import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { renderWithI18n } from "../shared/test/render";
import { LOCALE_STORAGE_KEY } from "../shared/i18n/i18n";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("mostra o título em pt-BR por padrão", () => {
    renderWithI18n(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Batalha da Tabuada" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("troca o idioma para en-US e marca o botão como pressionado", async () => {
    const user = userEvent.setup();
    renderWithI18n(<App />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Times Table Battle" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en-US");
  });

  it("mostra o idioma persistido ao renderizar novamente", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US");
    renderWithI18n(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Times Table Battle" }),
    ).toBeInTheDocument();
  });

  it("inicia a batalha a partir do menu", async () => {
    const user = userEvent.setup();
    renderWithI18n(<App />);

    await user.click(screen.getByRole("button", { name: "Iniciar batalha" }));

    expect(screen.getByRole("heading", { level: 2, name: "Batalha" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Um Slime selvagem apareceu!");
  });
});
