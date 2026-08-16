# Blocky Tables MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a polished, bilingual, browser-only multiplication adventure covering tables 2–10 with adaptive practice and local persistence.

**Architecture:** React renders accessible SVG/CSS screens over pure TypeScript domain modules. A single provider coordinates immutable `GameState` transitions and persists through the `ProgressRepository` interface. Content data drives nine visually distinct missions through one reusable gameplay engine.

**Tech Stack:** React 19, TypeScript 5 strict, Vite 7, Vitest, Testing Library, ESLint, Prettier, SVG/CSS, Web Audio API.

## Global Constraints

- No backend, login, cookies, remote database, or external/protected game assets.
- Support `pt-BR` and `en-US`; no visible component copy is hardcoded.
- Persist only through `ProgressRepository`; never call `localStorage` from UI/domain code.
- Gameplay is responsive, keyboard-operable, readable, and does not rely on color or audio.
- Tables unlock linearly from 2 through 10 and mistakes never remove progress.
- TypeScript uses strict mode and avoids `any`.

---

### Task 1: Tooling, data model, and persistence

**Files:** `package.json`, config files, `src/domain/types.ts`, `src/domain/defaultState.ts`, `src/services/progressRepository.ts`, `src/services/localStorageProgressRepository.ts`, and matching tests.

**Interfaces:** Produce `GameState`, `createDefaultGameState()`, `migrateState()`, `ProgressRepository`, and `LocalStorageProgressRepository`.

- [ ] Add the Vite/React/TypeScript/Vitest/ESLint/Prettier foundation.
- [ ] Write repository tests for first access, round trip, corrupted JSON, reset, and schema migration; run them and confirm expected failures.
- [ ] Implement versioned state types, defaults, migration, and repository; rerun until green.

### Task 2: Pedagogical domain

**Files:** `src/domain/questions.ts`, `src/domain/mastery.ts`, `src/domain/progression.ts`, `src/domain/achievements.ts`, and matching tests.

**Interfaces:** Produce `generateQuestion()`, `selectAdaptiveFactor()`, `recordAnswer()`, `completeIsland()`, and `evaluateAchievements()`.

- [ ] Write failing tests proving valid plausible alternatives, randomized correct positions, bounded mastery, weighted weak-fact selection, repeat avoidance, unlock behavior, and achievement thresholds.
- [ ] Run targeted tests and verify failures are due to missing behavior.
- [ ] Implement minimal pure domain logic and refactor only after the complete domain suite is green.

### Task 3: Internationalized content and application state

**Files:** `src/locales/pt-BR.ts`, `src/locales/en-US.ts`, `src/i18n/index.tsx`, `src/content/islands.ts`, `src/state/GameProvider.tsx`, and tests.

**Interfaces:** Produce `useI18n()`, `ISLANDS`, and `useGame()` commands for onboarding, answers, completion, settings, and reset.

- [ ] Write failing tests for locale parity/fallback and state transitions.
- [ ] Implement both complete catalogues, biome/mission data, and provider commands.
- [ ] Verify changing locale preserves all non-setting state.

### Task 4: Onboarding, navigation, and map

**Files:** `src/App.tsx`, `src/components/AppShell.tsx`, `src/screens/OnboardingScreen.tsx`, `HomeScreen.tsx`, `WorldMapScreen.tsx`, and component tests.

**Interfaces:** Screens use `useGame()` and `useI18n()` only; app navigation remains ephemeral.

- [ ] Write failing tests for locale-first onboarding, profile creation, and locked-map behavior.
- [ ] Implement compact screens, semantic buttons, avatar SVG, island state labels, progress stars, and route guard behavior.
- [ ] Verify keyboard navigation and locked islands cannot start.

### Task 5: Mission gameplay and results

**Files:** `src/screens/GameScreen.tsx`, `src/screens/ResultScreen.tsx`, `src/components/BlockScene.tsx`, `QuestionPanel.tsx`, `VisualHint.tsx`, and tests.

**Interfaces:** A phase starts from an available island, records each first-attempt answer, advances construction on correct answers, and completes after six questions.

- [ ] Write failing tests for friendly retry, visual hint, construction advance, completion persistence, and next-island unlock.
- [ ] Implement the bridge scene first, then drive all other themed constructions from island data.
- [ ] Add immediate feedback, celebration, avatar motion, and optional generated sound effects.

### Task 6: Achievements, settings, visual polish, and documentation

**Files:** `src/screens/AchievementsScreen.tsx`, `SettingsScreen.tsx`, `src/services/audioService.ts`, `src/styles/*.css`, `README.md`.

**Interfaces:** Settings persist locale/audio flags; reset requires confirmation; achievements read saved unlock state.

- [ ] Implement auxiliary screens and audio controls.
- [ ] Add responsive layouts for desktop/tablet/mobile landscape, portrait menu support, reduced motion, focus states, and high-contrast status labels.
- [ ] Document architecture, extension paths, scripts, persistence, languages, islands, missions, and API replacement.

### Task 7: Verification and acceptance audit

**Files:** all project files and `README.md` acceptance notes.

- [ ] Run `npm test -- --run`, `npm run lint`, `npm run build`, and `git diff --check` when Git exists.
- [ ] Run the app and manually exercise first-run, reload persistence, locale swap, bridge mission, unlock, reset cancellation, desktop, tablet, and landscape phone sizes.
- [ ] Check every acceptance criterion, fix gaps with a failing regression test where behavior is involved, and repeat the complete verification suite.
