import { DBSchema, IDBPDatabase, openDB } from "idb";
import type { PlayerProfile } from "../../domain/profile/profile";

type PersistedProfile = Omit<PlayerProfile, "schemaVersion" | "audio"> & {
  schemaVersion: number;
  audio?: PlayerProfile["audio"];
};

interface LojinhaDatabase extends DBSchema {
  profiles: {
    key: string;
    value: PlayerProfile;
  };
}

const DATABASE_NAME = "lojinha-maluca";
const DATABASE_VERSION = 1;

export class StorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StorageError";
  }
}

export class ProfileRepository {
  private readonly database: Promise<IDBPDatabase<LojinhaDatabase>>;

  constructor() {
    this.database = openDB<LojinhaDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("profiles")) {
          database.createObjectStore("profiles", { keyPath: "id" });
        }
      },
    });
  }

  async save(profile: PersistedProfile): Promise<void> {
    try {
      const database = await this.database;
      await database.put("profiles", profile as PlayerProfile);
    } catch (error) {
      throw new StorageError("Não foi possível salvar o perfil.", { cause: error });
    }
  }

  async load(id: string): Promise<PlayerProfile | undefined> {
    try {
      const database = await this.database;
      const profile = await database.get("profiles", id);
      return profile ? migrateProfile(profile) : undefined;
    } catch (error) {
      throw new StorageError("Não foi possível carregar o perfil.", { cause: error });
    }
  }

  async list(): Promise<PlayerProfile[]> {
    try {
      const database = await this.database;
      const profiles = await database.getAll("profiles");
      return profiles.map(migrateProfile);
    } catch (error) {
      throw new StorageError("Não foi possível listar os perfis.", { cause: error });
    }
  }

  async close(): Promise<void> {
    const database = await this.database;
    database.close();
  }
}

export function migrateProfile(profile: PersistedProfile): PlayerProfile {
  return {
    ...profile,
    schemaVersion: 1,
    audio: profile.audio ?? { effects: true, narration: false },
  };
}
