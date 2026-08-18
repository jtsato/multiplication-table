import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleEndPanel } from "./BattleScreen";
import { renderWithI18n } from "../../shared/test/render";

describe("BattleEndPanel", () => {
  it("mostra a vitória com o nome do monstro e recebe o foco", () => {
    renderWithI18n(<BattleEndPanel phase="victory" monsterName="Vingador" onPlayAgain={vi.fn()} />);
    const heading = screen.getByRole("heading", { level: 3, name: "Vitória!" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveFocus();
    expect(screen.getByText("Você derrotou o Vingador!")).toBeInTheDocument();
  });

  it("mostra a derrota com o nome do monstro", () => {
    renderWithI18n(<BattleEndPanel phase="defeat" monsterName="Vingador" onPlayAgain={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 3, name: "Derrota!" })).toBeInTheDocument();
    expect(screen.getByText(/O Vingador venceu desta vez/)).toBeInTheDocument();
  });

  it("o botão Jogar novamente dispara o reinício", async () => {
    const user = userEvent.setup();
    const onPlayAgain = vi.fn();
    renderWithI18n(
      <BattleEndPanel phase="victory" monsterName="Vingador" onPlayAgain={onPlayAgain} />,
    );
    await user.click(screen.getByRole("button", { name: "Jogar novamente" }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("mostra a mensagem de jornada completa quando allDefeated", () => {
    renderWithI18n(
      <BattleEndPanel
        phase="victory"
        monsterName="Criatura Observadora"
        allDefeated
        onPlayAgain={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Você derrotou todos os chefes e completou a jornada!"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Você derrotou o Criatura Observadora!")).not.toBeInTheDocument();
  });
});
