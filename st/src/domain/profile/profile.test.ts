import { describe, expect, it } from "vitest";
import { createProfile, PROFILE_SCHEMA_VERSION } from "./profile";

describe("local player profiles", () => {
  it("creates a local profile without personal data", () => {
    const profile = createProfile({ nickname: "Ana", storeId: "bookstore", id: "player-1" });

    expect(profile).toMatchObject({
      id: "player-1",
      schemaVersion: PROFILE_SCHEMA_VERSION,
      nickname: "Ana",
      mascot: { kind: "antenna", color: "orange" },
      chapter: 1,
      day: 1,
      cash: 120,
      store: { storeId: "bookstore", unlockedProducts: ["bookmark", "magazine", "book"] },
    });
    expect(profile).not.toHaveProperty("email");
    expect(profile.mathProgress["1x1"]).toBeDefined();
  });

  it("persists the chosen store style as cosmetic state", () => {
    const profile = createProfile({
      nickname: "Bento",
      storeId: "technology",
      style: "ocean",
      id: "player-style",
    });

    expect(profile.store.style).toBe("ocean");
  });
});
