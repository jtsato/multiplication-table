import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleScreen } from "./BattleScreen";
import { renderWithI18n } from "../../shared/test/render";
import { seededRng } from "../../shared/test/rng";
import { AVENGER } from "./monsters";
import { battleReducer, createBattle, HERO_MAX_HP } from "./battle";
import { HERO_BASE_DAMAGE } from "../player-attack/player-attack";
import { SAVE_STORAGE_KEY } from "../save-game/local-storage.repository";
import { SAVE_VERSION } from "../save-game/repository";

function questionNumbers(): { a: number; b: number } {
  const text = screen.getByText(/=\s*\?/).textContent ?? "";
  const match = text.match(/(\d+)\s*×\s*(\d+)/);
  if (!match) throw new Error(`pergunta inesperada: ${text}`);
  return { a: Number(match[1]), b: Number(match[2]) };
}

/** Grava um save com o vingador em 14 HP e a pergunta 6 × 4 = 24. */
function seedBattleSave() {
  const battle = battleReducer(createBattle(AVENGER), {
    type: "BEGIN_QUESTION",
    question: { a: 6, b: 4, answer: 24 },
    alternatives: [24, 23, 25, 18],
  });
  const danificado = { ...battle, monster: { ...battle.monster, hp: 14 } };
  window.localStorage.setItem(
    SAVE_STORAGE_KEY,
    JSON.stringify({ version: SAVE_VERSION, locale: "pt-BR", battle: danificado }),
  );
}

describe("BattleScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("mostra o título da batalha e recebe o foco ao montar", () => {
    renderWithI18n(<BattleScreen rng={seededRng(1)} />);
    const heading = screen.getByRole("heading", { level: 2, name: "Batalha" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveFocus();
  });

  it("anuncia o início da batalha via região de status", () => {
    renderWithI18n(<BattleScreen rng={seededRng(1)} />);
    expect(screen.getByRole("status")).toHaveTextContent("Um Vingador selvagem apareceu!");
  });

  it("mostra herói e vingador com suas barras de HP acessíveis", () => {
    renderWithI18n(<BattleScreen rng={seededRng(1)} />);
    const heroBar = screen.getByRole("progressbar", { name: "Herói" });
    expect(heroBar).toHaveAttribute("aria-valuemax", "30");
    expect(heroBar).toHaveAttribute("aria-valuenow", "30");
    const vingadorBar = screen.getByRole("progressbar", { name: "Vingador" });
    expect(vingadorBar).toHaveAttribute("aria-valuemax", "20");
    expect(vingadorBar).toHaveAttribute("aria-valuenow", "20");
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

  it("acertar reduz o HP do vingador e anuncia o dano", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);
    const { a, b } = questionNumbers();
    await user.click(screen.getByRole("button", { name: String(a * b) }));
    expect(screen.getByRole("progressbar", { name: "Vingador" })).toHaveAttribute(
      "aria-valuenow",
      String(AVENGER.maxHp - HERO_BASE_DAMAGE),
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
    expect(screen.getByRole("progressbar", { name: "Vingador" })).toHaveAttribute(
      "aria-valuenow",
      String(AVENGER.maxHp),
    );
    expect(screen.getByRole("progressbar", { name: "Herói" })).toHaveAttribute(
      "aria-valuenow",
      String(HERO_MAX_HP - AVENGER.damage),
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

  it("três acertos liberam o super ataque, que derrota o vingador", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);

    // Auto-avanço real de 700 ms entre as perguntas.
    async function responderCorreto() {
      const { a, b } = questionNumbers();
      await user.click(screen.getByRole("button", { name: String(a * b) }));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 750));
      });
    }

    await responderCorreto();
    await responderCorreto();
    await responderCorreto();

    const superButton = screen.getByRole("button", { name: "Super Ataque" });
    expect(superButton).toBeInTheDocument();
    await user.click(superButton);

    expect(screen.getByRole("progressbar", { name: "Vingador" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Super Ataque");
  });

  it("vitória mostra o painel final com foco", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);

    async function responderCorreto() {
      const { a, b } = questionNumbers();
      await user.click(screen.getByRole("button", { name: String(a * b) }));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 750));
      });
    }

    await responderCorreto();
    await responderCorreto();
    await responderCorreto();
    await user.click(screen.getByRole("button", { name: "Super Ataque" }));

    const vitoria = screen.getByRole("heading", { level: 3, name: "Vitória!" });
    expect(vitoria).toBeInTheDocument();
    expect(vitoria).toHaveFocus();
    expect(screen.getByText("Você derrotou o Vingador!")).toBeInTheDocument();
  });

  it("vitória avança a progressão e Jogar novamente luta contra o próximo monstro", async () => {
    const onProgressChange = vi.fn();
    const user = userEvent.setup();
    renderWithI18n(
      <BattleScreen
        rng={seededRng(7)}
        progress={{ stage: 0 }}
        onProgressChange={onProgressChange}
      />,
    );

    async function responderCorreto() {
      const { a, b } = questionNumbers();
      await user.click(screen.getByRole("button", { name: String(a * b) }));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 750));
      });
    }

    await responderCorreto();
    await responderCorreto();
    await responderCorreto();
    await user.click(screen.getByRole("button", { name: "Super Ataque" }));

    await user.click(screen.getByRole("button", { name: "Jogar novamente" }));

    expect(onProgressChange).toHaveBeenCalledWith({ stage: 1 });
    expect(screen.getByRole("progressbar", { name: "Tiamat" })).toHaveAttribute(
      "aria-valuenow",
      "26",
    );
    expect(screen.getByText(/=\s*\?/)).toBeInTheDocument();
  });

  it("salva a batalha automaticamente", () => {
    renderWithI18n(<BattleScreen rng={seededRng(1)} />);
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}") as { version: number; locale: string; battle: unknown };
    expect(parsed.version).toBe(SAVE_VERSION);
    expect(parsed.locale).toBe("pt-BR");
    expect(parsed.battle).not.toBeNull();
  });

  it("restaura uma batalha salva e permite continuar jogando", async () => {
    seedBattleSave();
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);

    expect(screen.getByRole("progressbar", { name: "Vingador" })).toHaveAttribute(
      "aria-valuenow",
      "14",
    );
    expect(screen.getByText("6 × 4 = ?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "24" }));
    expect(screen.getByRole("progressbar", { name: "Vingador" })).toHaveAttribute(
      "aria-valuenow",
      "8",
    );
  });

  it("rastreia os fatos respondidos e persiste no save", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);
    const { a, b } = questionNumbers();
    await user.click(screen.getByRole("button", { name: String(a * b) }));

    const parsed = JSON.parse(window.localStorage.getItem(SAVE_STORAGE_KEY) ?? "{}") as {
      facts: { a: number; b: number; attempts: number; errors: number }[];
    };
    const fato = parsed.facts.find((f) => f.a === a && f.b === b);
    expect(fato).toBeDefined();
    expect(fato?.attempts).toBe(1);
    expect(fato?.errors).toBe(0);
  });

  it("erros ficam registrados para o reforço adaptativo", async () => {
    const user = userEvent.setup();
    renderWithI18n(<BattleScreen rng={seededRng(7)} />);
    const { a, b } = questionNumbers();
    const resposta = String(a * b);
    const errada = screen
      .getAllByRole("button", { name: /^\d+$/ })
      .find((btn) => btn.textContent !== resposta);
    expect(errada).toBeDefined();
    await user.click(errada!);

    const parsed = JSON.parse(window.localStorage.getItem(SAVE_STORAGE_KEY) ?? "{}") as {
      facts: { a: number; b: number; attempts: number; errors: number }[];
    };
    const fato = parsed.facts.find((f) => f.a === a && f.b === b);
    expect(fato).toBeDefined();
    expect(fato?.attempts).toBe(1);
    expect(fato?.errors).toBe(1);
  });
});
