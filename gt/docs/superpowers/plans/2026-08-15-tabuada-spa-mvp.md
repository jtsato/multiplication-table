# Tabuada em Blocos SPA MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver a complete browser SPA MVP where children create a block avatar, progress linearly through multiplication-table islands 2–10, answer adaptive questions, and retain progress locally in PT-BR or English.

**Architecture:** Browser-native ES Modules with framework-independent domain modules for question generation, mastery, progression, and persistence. UI is DOM/CSS/SVG based, with a single app state owner and a repository abstraction around localStorage.

**Tech Stack:** Modern JavaScript ES Modules, DOM, CSS/SVG, Node built-in test runner.

## Global Constraints
- SPA only; no backend, accounts, multiplayer, ranking, ads, or payments.
- Persist through versioned localStorage behind `ProgressRepository`.
- `pt-BR` and `en-US` from the first release; no user-visible hardcoded copy outside locale dictionaries.
- Original 2D colorful block aesthetic; no Minecraft assets or copied IP.
- Linear tables 2 → 10, short missions of 5–7 questions, adaptive review, non-punitive error feedback.
- No external runtime dependencies; keep modules small and explicit.

---

### Task 1: Project shell and domain contracts
**Files:** Create `package.json`, `index.html`, `src/domain/defaultState.js`, `src/app.js`, `src/styles.css`, and Node scripts.
**Produces:** versioned game-state shape and `createDefaultState()`.
- [x] Add project/config files and test runner wiring.
- [x] Write failing tests for default state: table 2 available, tables 3–10 locked, default locale pt-BR.
- [x] Run targeted test and verify RED.
- [x] Implement minimal domain types/default state.
- [x] Run targeted test and verify GREEN.

### Task 2: Multiplication question engine
**Files:** Create `src/domain/questions.js`, `tests/questions.test.js`.
**Produces:** `factKey(a,b)`, `generateChoices(answer, rng?)`, `pickAdaptiveFact(table, stats, recentKeys, rng?)`.
- [x] Write failing tests that choices include one correct unique answer and plausible nearby distractors.
- [x] Verify RED.
- [x] Implement minimal choice generation; verify GREEN.
- [x] Write failing tests that low-mastery/missed facts receive higher selection weight and immediate repeats are avoided.
- [x] Verify RED, implement weighted selection, verify GREEN.

### Task 3: Mastery, statistics, progression, achievements
**Files:** Create `src/domain/progress.js`, `tests/progress.test.js`.
**Produces:** `recordAnswer(state, fact, correct)`, `completeMission(state, table, missionScore)`, `getUnlockedTable(state)`, achievement derivation.
- [x] Write RED tests for attempts/correct/incorrect/mastery/streak updates.
- [x] Implement and verify GREEN.
- [x] Write RED tests for linear unlock (2 unlocks 3, 3 remains locked before completion) and weak-fact carryover.
- [x] Implement and verify GREEN.
- [x] Write/verify achievement tests for first correct, 10 correct, 5-streak, table completion.

### Task 4: Versioned persistence repository
**Files:** Create `src/persistence/repository.js`, `src/persistence/localStorageRepository.js`, `tests/persistence.test.js`.
**Produces:** `ProgressRepository`, `LocalStorageProgressRepository`, corruption fallback, schema v1 normalization, reset.
- [x] RED tests with in-memory Storage stub for load/save/reset/corrupt payload.
- [x] Implement repository and verify GREEN.

### Task 5: Internationalization
**Files:** Create `src/i18n/pt-BR.js`, `src/i18n/en-US.js`, `src/i18n/index.js`, `tests/i18n.test.js`.
**Produces:** `Locale`, `t(locale,key,params?)` and complete dictionaries for all MVP UI copy.
- [x] RED tests for both locales and interpolation.
- [x] Implement dictionaries/translator; verify GREEN.

### Task 6: App state and onboarding/home/settings
**Files:** Create `src/app.js`, `src/styles.css`.
**Produces:** persisted app state mutations and first-run flow.
- [x] Add behavior checks for onboarding and locale switch.
- [x] Verify RED.
- [x] Implement screens/state wiring; verify GREEN.

### Task 7: World map and linear island selection
**Files:** Create `src/data/islands.js`, `src/app.js`, `src/styles.css`.
**Produces:** table 2–10 biome metadata and map navigation respecting lock state.
- [x] RED domain and navigation checks for locked vs available navigation.
- [x] Implement map and verify GREEN.

### Task 8: Playable block mission loop
**Files:** Create `src/app.js`, `src/styles.css`.
**Produces:** 5-question bridge mission, answer feedback, environment build animation, persistent answer recording.
- [x] RED tests for correct answer advancing bridge and incorrect answer preserving progress/showing hint.
- [x] Implement mission loop and verify GREEN.
- [x] Extend mission visuals by table biome while reusing the same engine.

### Task 9: Mission results, table completion, achievements
**Files:** Create `src/app.js`, `src/styles.css`.
**Produces:** result summary, completion celebration, next island unlock, achievements list.
- [x] RED tests for finishing a mission and unlocking next table.
- [x] Implement and verify GREEN.

### Task 10: Responsive polish and accessibility
**Files:** Update `src/styles.css` and `src/app.js`.
**Produces:** responsive block UI, large targets, keyboard focus, reduced-motion handling, landscape gameplay hint on narrow portrait screens.
- [x] Add accessibility assertions for answer buttons/status labels.
- [x] Verify RED/GREEN around semantic UI behavior.
- [x] Add CSS polish without changing domain behavior.

### Task 11: Documentation and full verification
**Files:** Create `README.md`; update package scripts if needed.
- [x] Document install/dev/build/test, architecture, local storage schema, adding locale/table/mission, and future API repository swap.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run `npm run check`.
- [x] Inspect production output for console/build errors and verify acceptance criteria.
