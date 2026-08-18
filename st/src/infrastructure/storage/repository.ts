import { DBSchema, IDBPDatabase, openDB } from "idb";
import {
  DEFAULT_MASCOT,
  PROFILE_SCHEMA_VERSION,
  type MascotConfig,
  type PlayerProfile,
} from "../../domain/profile/profile";

/** Formato antigo (v1): boneco com pele/cabelo/roupa/acessório. */
type LegacyAvatar = { accessory?: string };

type PersistedProfile = Omit<PlayerProfile, "schemaVersion" | "audio" | "mascot"> & {
  schemaVersion: number;
  audio?: PlayerProfile["audio"];
  mascot?: MascotConfig;
  avatar?: LegacyAvatar;
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

  async remove(id: string): Promise<void> {
    try {
      const database = await this.database;
      await database.delete("profiles", id);
    } catch (error) {
      throw new StorageError("Não foi possível apagar o perfil.", { cause: error });
    }
  }

  async close(): Promise<void> {
    const database = await this.database;
    database.close();
  }
}

export function migrateProfile(profile: PersistedProfile): PlayerProfile {
  const { avatar, ...rest } = profile;
  return {
    ...rest,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    audio: profile.audio ?? { effects: true, narration: false },
    // v1 -> v2: o boneco virou mascote. Só o boné tinha equivalente direto,
    // então ele é preservado e o resto cai no padrão.
    mascot: profile.mascot ?? {
      ...DEFAULT_MASCOT,
      kind: avatar?.accessory === "cap" ? "cap" : DEFAULT_MASCOT.kind,
    },
  };
}
