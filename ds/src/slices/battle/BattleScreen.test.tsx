import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleScreen } from "./BattleScreen";
import { renderWithI18n } from "../../shared/test/render";
import { seededRng } from "../../shared/test/rng";
import { SLIME } from "./monsters";
import { HERO_MAX_HP } from "./battle";
import { HERO_BASE_DAMAGE } from "../player-attack/player-attack";

function questionNumbers(): { a: number; b: number } {
  const text = screen.getByText(/=\s*\?/).textContent ?? "";
  const match = text.match(/(\d+)\s*×\s*(\d+)/);
  if (!match) throw new Error(`pergunta inesperada: ${text}`);
  return { a: Number(match[1]), b: Number(match[2]) };
}

describe("BattleScreen", () => {
  it("mostra o título da batalha e recebe o foco ao montar", () => {
    renderWithI18n(<BattleScreen rng={seededRng(1)} />);
    const heading = screen.getByRole("heading", { level: 2, name: "Batalha" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveFocus();
  });

  it("anuncia o início da batalha via região de status", () => {
    renderWithI18n(<BattleScreen rng={seededRng(1)} />);
    expect(screen.getByRole("status")).toHaveTextContent("Um Slime selvagem apareceu!");
  });

  it("mostra herói e slime com suas barras de HP acessíveis", () => {
    renderWithI18n(<BattleScreen rng={seededRng(1)} />);
    const heroBar = screen.getByRole("progressbar", { name: "Herói" });
    expect(heroBar).toHaveAttribute("aria-valuemax", "30");
    expect(heroBar).toHaveAttribute("aria-valuenow", "30");
    const slimeBar = screen.getByRole("progressbar", { name: "Slime" });
    expect(slimeBar).toHaveAttribute("aria-valuemax", "20");
    expect(slimeBar).toHaveAttribute("aria-valuenow", "20");
  });

  it("mostra o HP como texto (feedback não depende só de cor)", () => {
    renderWithI18n(<BattleScreen rng={seededRng(1)} />);
    expect(screen.getByText("30 / 30")).toBeInTheDocument();
    expect(screen.getByText("20 / 20")).toBeInTheDocument();
  });

  it("mostra a multiplicação com quatro alternativas distintas", () => {
    renderWithI18n(<BattleScreen rng={seededRng(3)} />);
    expect(screen.getByText(/=\s*\?/)).toBeInTheDocument();
    const alternatives = screen.getAllByRole("button", { name: /^\d+$/ });
    expect(alternatives).toHaveLength(4);
    expect(new Set(alternatives.map((b) => b.textContent)).size).toBe(4);
  });

  it("acertar reduz o HP do slime e anuncia o dano", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);
    const { a, b } = questionNumbers();
    await user.click(screen.getByRole("button", { name: String(a * b) }));
    expect(screen.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      String(SLIME.maxHp - HERO_BASE_DAMAGE),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Correto");
  });

  it("errar faz o monstro atacar e o herói perder HP", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);
    const { a, b } = questionNumbers();
    const answer = String(a * b);
    const wrong = screen
      .getAllByRole("button", { name: /^\d+$/ })
      .find((btn) => btn.textContent !== answer);
    if (!wrong) throw new Error("nenhuma alternativa errada");
    await user.click(wrong);
    expect(screen.getByRole("progressbar", { name: "Slime" })).toHaveAttribute(
      "aria-valuenow",
      String(SLIME.maxHp),
    );
    expect(screen.getByRole("progressbar", { name: "Herói" })).toHaveAttribute(
      "aria-valuenow",
      String(HERO_MAX_HP - SLIME.damage),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Quase");
    expect(screen.getByRole("status")).toHaveTextContent(`${a} × ${b} = ${a * b}`);
    expect(screen.getByRole("status")).toHaveTextContent("te acertou");
  });

  it("mostra o combo após acertar", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);
    const { a, b } = questionNumbers();
    await user.click(screen.getByRole("button", { name: String(a * b) }));
    expect(screen.getByText("Combo ×1")).toBeInTheDocument();
  });

  it("zera o combo ao errar", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);
    const { a, b } = questionNumbers();
    const answer = String(a * b);
    const wrong = screen
      .getAllByRole("button", { name: /^\d+$/ })
      .find((btn) => btn.textContent !== answer);
    if (!wrong) throw new Error("nenhuma alternativa errada");
    await user.click(wrong);
    expect(screen.queryByText(/Combo/)).not.toBeInTheDocument();
  });

  it("o atalho numérico 1 responde a primeira alternativa", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);
    await user.keyboard("1");
    expect(screen.getByRole("status")).toHaveTextContent(/Correto|Quase/);
  });
});
