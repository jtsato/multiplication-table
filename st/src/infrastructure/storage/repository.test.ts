import { deleteDB } from "idb";
import { afterEach, describe, expect, it } from "vitest";
import { createProfile } from "../../domain/profile/profile";
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
    const profile = createProfile({ nickname: "Mestre dos Blocos", storeId: "art", id: "player-2" });

    await repository.save(profile);

    await expect(repository.load("player-2")).resolves.toEqual(profile);
    await expect(repository.list()).resolves.toEqual([profile]);
  });

  it("migrates a profile with an older schema version", async () => {
    const repository = createRepository();
    const profile = createProfile({ nickname: "Capitão da Loja", storeId: "sports", id: "player-3" });
    const oldProfile = { ...profile, schemaVersion: 0, audio: undefined };

    await repository.save(oldProfile);
    const loaded = await repository.load("player-3");

    expect(loaded?.schemaVersion).toBe(1);
    expect(loaded?.audio).toEqual({ effects: true, narration: false });
  });
});
