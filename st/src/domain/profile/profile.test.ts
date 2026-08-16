import { describe, expect, it } from "vitest";
import { createProfile } from "./profile";

describe("local player profiles", () => {
  it("creates a local profile without personal data", () => {
    const profile = createProfile({ nickname: "Lojista Pixel", storeId: "bookstore", id: "player-1" });

    expect(profile).toMatchObject({
      id: "player-1",
      schemaVersion: 1,
      nickname: "Lojista Pixel",
      chapter: 1,
      day: 1,
      cash: 120,
      store: { storeId: "bookstore", unlockedProducts: ["bookmark", "magazine", "book"] },
    });
    expect(profile).not.toHaveProperty("email");
    expect(profile.mathProgress["1x1"]).toBeDefined();
  });
});
