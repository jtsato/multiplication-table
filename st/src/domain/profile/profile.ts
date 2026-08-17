import { listFacts, factKey } from "../math/facts";
import { createFactProgress, type FactProgress } from "../math/mastery";
import type { StoreId } from "../../content/stores";

export type MascotKind = "antenna" | "cap" | "crown" | "bow" | "leaf";
export type MascotColor = "orange" | "mint" | "berry" | "sky" | "grape" | "sun";

export const MASCOT_KINDS: MascotKind[] = ["antenna", "cap", "crown", "bow", "leaf"];
export const MASCOT_COLORS: MascotColor[] = ["orange", "mint", "berry", "sky", "grape", "sun"];

export type MascotConfig = {
  kind: MascotKind;
  color: MascotColor;
};

export type AccessibilitySettings = {
  reducedMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
};

export type AudioSettings = {
  effects: boolean;
  narration: boolean;
};

export type StoreState = {
  storeId: StoreId;
  unlockedProducts: string[];
  purchasedProducts: string[];
  cosmetics: string[];
  style: StoreStyle;
};

export type StoreStyle = "sunrise" | "ocean" | "garden";

export type ObjectiveHistory = {
  completed: string[];
};

export type PlayerProfile = {
  id: string;
  schemaVersion: number;
  nickname: string;
  mascot: MascotConfig;
  store: StoreState;
  chapter: number;
  day: number;
  cash: number;
  mathProgress: Record<string, FactProgress>;
  achievements: string[];
  objectives: ObjectiveHistory;
  accessibility: AccessibilitySettings;
  audio: AudioSettings;
  createdAt: string;
  updatedAt: string;
};

export type CreateProfileInput = {
  nickname: string;
  storeId: StoreId;
  style?: StoreStyle;
  id?: string;
  mascot?: Partial<MascotConfig>;
  accessibility?: Partial<AccessibilitySettings>;
};

export const DEFAULT_MASCOT: MascotConfig = {
  kind: "antenna",
  color: "orange",
};

/** Sobe com qualquer mudança no formato salvo do perfil. */
export const PROFILE_SCHEMA_VERSION = 2;

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reducedMotion: false,
  largeText: false,
  highContrast: false,
};

export const DEFAULT_AUDIO: AudioSettings = {
  effects: true,
  narration: false,
};

export function createProfile(input: CreateProfileInput): PlayerProfile {
  const now = new Date().toISOString();
  const mathProgress = Object.fromEntries(
    listFacts().map((fact) => [factKey(fact), createFactProgress(fact)]),
  );

  return {
    id: input.id ?? crypto.randomUUID(),
    schemaVersion: PROFILE_SCHEMA_VERSION,
    nickname: input.nickname.trim() || "Lojista",
    mascot: { ...DEFAULT_MASCOT, ...input.mascot },
    store: {
      storeId: input.storeId,
      unlockedProducts: initialProductIds(input.storeId),
      purchasedProducts: [],
      cosmetics: [],
      style: input.style ?? "sunrise",
    },
    chapter: 1,
    day: 1,
    cash: 120,
    mathProgress,
    achievements: [],
    objectives: { completed: [] },
    accessibility: { ...DEFAULT_ACCESSIBILITY, ...input.accessibility },
    audio: DEFAULT_AUDIO,
    createdAt: now,
    updatedAt: now,
  };
}

function initialProductIds(storeId: StoreId): string[] {
  const initialByStore: Record<StoreId, string[]> = {
    bookstore: ["bookmark", "magazine", "book"],
    art: ["pencil", "brush", "ruler"],
    sports: ["cone", "rope", "sports-bottle"],
    technology: ["led", "connection-cable", "electronic-button"],
  };
  return initialByStore[storeId];
}
