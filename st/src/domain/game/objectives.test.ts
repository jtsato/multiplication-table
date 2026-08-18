import { describe, expect, it } from "vitest";
import { createDailyObjective } from "./objectives";

describe("optional objectives", () => {
  it("creates deterministic objectives without making them mandatory", () => {
    expect(createDailyObjective(10)).toEqual(createDailyObjective(10));
    expect(createDailyObjective(10).requiredVisits).toBeGreaterThanOrEqual(3);
  });

  it("rotates through the three objectives by seed", () => {
    expect(createDailyObjective(0)).toMatchObject({
      id: "welcome-customers",
      title: "Portas abertas",
      description: "Atenda clientes com calma.",
      requiredVisits: 3,
    });
    expect(createDailyObjective(1)).toMatchObject({
      id: "stock-shelf",
      title: "Prateleira em ordem",
      description: "Conclua cinco atendimentos.",
      requiredVisits: 5,
    });
    expect(createDailyObjective(2)).toMatchObject({
      id: "keep-discovering",
      title: "Descobertas do dia",
      description: "Atenda quatro clientes e veja a loja crescer.",
      requiredVisits: 4,
    });
    expect(createDailyObjective(3).id).toBe("welcome-customers");
  });

  it("treats negative seeds like their absolute value", () => {
    expect(createDailyObjective(-1)).toEqual(createDailyObjective(1));
  });

  it("floors fractional seeds before selecting an objective", () => {
    expect(createDailyObjective(1.9)).toEqual(createDailyObjective(1));
    expect(createDailyObjective(-1.9)).toEqual(createDailyObjective(2));
    expect(createDailyObjective(-0.5)).toEqual(createDailyObjective(1));
  });
});
