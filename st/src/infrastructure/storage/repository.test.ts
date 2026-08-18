import { deleteDB } from "idb";
import { afterEach, describe, expect, it } from "vitest";
import { createProfile, PROFILE_SCHEMA_VERSION } from "../../domain/profile/profile";
import { ProfileRepository } from "./repository";

let openRepository: ProfileRepository | undefined;

afterEach(async () => {
  await openRepository?.close();
  await deleteDB("lojinha-maluca");
  openRepository = undefined;
});

function createRepository(): ProfileRepository {
  openRepository = new ProfileRepository();
  return openRepository;
}

describe("profile repository", () => {
  it("saves and loads profiles from IndexedDB", async () => {
    const repository = createRepository();
    const profile = createProfile({ nickname: "Bento", storeId: "art", id: "player-2" });

    await repository.save(profile);

    await expect(repository.load("player-2")).resolves.toEqual(profile);
    await expect(repository.list()).resolves.toEqual([profile]);
  });

  it("migrates a profile with an older schema version", async () => {
    const repository = createRepository();
    const profile = createProfile({ nickname: "Iara", storeId: "sports", id: "player-3" });
    const oldProfile = { ...profile, schemaVersion: 0, audio: undefined };

    await repository.save(oldProfile);
    const loaded = await repository.load("player-3");

    expect(loaded?.schemaVersion).toBe(PROFILE_SCHEMA_VERSION);
    expect(loaded?.audio).toEqual({ effects: true, narration: false });
  });

  it("turns a v1 avatar into a mascot without losing the shop", async () => {
    const repository = createRepository();
    const base: Record<string, unknown> = {
      ...createProfile({ nickname: "Iara", storeId: "sports", id: "player-4" }),
    };
    delete base.mascot;
    const v1Profile = {
      ...base,
      schemaVersion: 1,
      cash: 640,
      day: 9,
      avatar: { skin: "warm", hair: "curly", outfit: "apron", accessory: "cap" },
    };

    await repository.save(v1Profile as never);
    const loaded = await repository.load("player-4");

    // O progresso da criança tem de sobreviver à troca de boneco por mascote.
    expect(loaded?.cash).toBe(640);
    expect(loaded?.day).toBe(9);
    expect(loaded?.mascot).toEqual({ kind: "cap", color: "orange" });
    expect(loaded).not.toHaveProperty("avatar");
  });
});
