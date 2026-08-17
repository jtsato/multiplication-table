import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { BattleScreen } from "./BattleScreen";
import { renderWithI18n } from "../../shared/test/render";

describe("BattleScreen", () => {
  it("mostra o título da batalha e recebe o foco ao montar", () => {
    renderWithI18n(<BattleScreen />);
    const heading = screen.getByRole("heading", { level: 2, name: "Batalha" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveFocus();
  });

  it("anuncia o início da batalha via região de status", () => {
    renderWithI18n(<BattleScreen />);
    expect(screen.getByRole("status")).toHaveTextContent("Um Slime selvagem apareceu!");
  });

  it("mostra herói e slime com suas barras de HP acessíveis", () => {
    renderWithI18n(<BattleScreen />);

    const heroBar = screen.getByRole("progressbar", { name: "Herói" });
    expect(heroBar).toHaveAttribute("aria-valuemin", "0");
    expect(heroBar).toHaveAttribute("aria-valuemax", "30");
    expect(heroBar).toHaveAttribute("aria-valuenow", "30");

    const slimeBar = screen.getByRole("progressbar", { name: "Slime" });
    expect(slimeBar).toHaveAttribute("aria-valuemax", "20");
    expect(slimeBar).toHaveAttribute("aria-valuenow", "20");
  });

  it("mostra o HP como texto (feedback não depende só de cor)", () => {
    renderWithI18n(<BattleScreen />);
    expect(screen.getByText("30 / 30")).toBeInTheDocument();
    expect(screen.getByText("20 / 20")).toBeInTheDocument();
  });
});
