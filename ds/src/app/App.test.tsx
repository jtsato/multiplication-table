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

    await user.click(screen.getByRole("button", { name: "Iniciar aventura" }));

    expect(screen.getByRole("heading", { level: 2, name: "Batalha" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Vingador" })).toHaveAttribute(
      "aria-valuenow",
      "20",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Um Vingador selvagem apareceu!");
  });

  it("retoma a batalha salva ao abrir o aplicativo", () => {
    window.localStorage.setItem(
      "batalha-da-tabuada.save",
      JSON.stringify({
        version: 2,
        locale: "pt-BR",
        avatar: { classId: "fighter", colorId: "crimson" },
        progress: { stage: 0 },
        battle: {
          phase: "question",
          hero: { nameKey: "battle.hero", maxHp: 30, hp: 30 },
          monster: { nameKey: "monster.avenger", maxHp: 14, hp: 8, id: "avenger", damage: 3 },
          question: { a: 6, b: 4, answer: 24 },
          alternatives: [24, 23, 25, 18],
          combo: 0,
          superReady: false,
          log: [],
        },
      }),
    );

    renderWithI18n(<App />);

    expect(screen.getByRole("heading", { level: 2, name: "Batalha" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Iniciar aventura" })).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Vingador" })).toHaveAttribute(
      "aria-valuenow",
      "8",
    );
  });
});
