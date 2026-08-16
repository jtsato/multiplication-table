import { createDefaultState } from '../domain/defaultState.js';

const STORAGE_KEY = 'tabuada-em-blocos:v1';

function normalizeState(candidate) {
  const fallback = createDefaultState();
  if (!candidate || typeof candidate !== 'object' || candidate.schemaVersion !== 1) {
    return fallback;
  }

  return {
    ...fallback,
    ...candidate,
    player: { ...fallback.player, ...(candidate.player ?? {}) },
    settings: { ...fallback.settings, ...(candidate.settings ?? {}) },
    progress: {
      ...fallback.progress,
      ...(candidate.progress ?? {}),
      islands: {
        ...fallback.progress.islands,
        ...(candidate.progress?.islands ?? {}),
      },
    },
    statistics: {
      ...fallback.statistics,
      ...(candidate.statistics ?? {}),
      facts: {
        ...fallback.statistics.facts,
        ...(candidate.statistics?.facts ?? {}),
      },
    },
    achievements: Array.isArray(candidate.achievements) ? candidate.achievements : [],
  };
}

export class LocalStorageProgressRepository {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  async load() {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    try {
      return normalizeState(JSON.parse(raw));
    } catch {
      return createDefaultState();
    }
  }

  async save(state) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async reset() {
    this.storage.removeItem(STORAGE_KEY);
  }
}

export { STORAGE_KEY };
