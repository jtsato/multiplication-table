import { describe, expect, it } from "vitest";
import { getAchievementProgress } from "./achievementCatalog";

describe("achievement catalog", () => {
  it("marks unlocked shop milestones without exposing a score", () => {
    expect(getAchievementProgress(["first-day"])).toEqual([
      { id: "first-day", title: "Primeiro dia", description: "Feche um dia de atendimento.", unlocked: true },
      { id: "first-expansion", title: "Loja crescendo", description: "Compre a primeira expansão.", unlocked: false },
      { id: "new-chapter", title: "Novo capítulo", description: "Abra um novo capítulo da loja.", unlocked: false },
    ]);
  });
});
