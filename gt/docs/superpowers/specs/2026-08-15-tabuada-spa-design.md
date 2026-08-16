# Tabuada em Blocos — SPA MVP Design

## Product goal
Build a browser-first 2D educational game for children to practice multiplication tables through a colorful block-world adventure. The MVP is a single-page application with no backend, no login, and local persistence.

## Experience
- Original 2D block aesthetic: bright, geometric, playful; no Minecraft assets or copied IP.
- First-run flow: choose language (`pt-BR` / `en-US`), choose boy/girl avatar, pick a small cosmetic variation, then enter the world map.
- Linear islands for multiplication tables 2 through 10. Completing one unlocks the next.
- Each island has short 5–7 question missions. Correct answers visibly build/repair the environment.
- The first polished mission rebuilds a block bridge for the table of 2.
- Incorrect answers are non-punitive and can show a visual grouping hint.

## Pedagogical model
- Track attempts, correct answers, incorrect answers, last seen time, and a mastery score per multiplication fact.
- Question selection is weighted toward low-mastery and recently missed facts while preventing immediate repetition.
- Advancement should not trap a child forever: mission completion and a reasonable accuracy target unlock the next island, while weak facts continue appearing in review.

## Architecture
Browser-native ES Modules + DOM/CSS/SVG. This dependency-free MVP keeps the bundle small, responsive, accessible, and directly runnable even without package-registry access. Domain logic (questions, mastery, unlocks) is framework-independent and covered by Node unit tests.

Persistence uses a `ProgressRepository` interface with a `LocalStorageProgressRepository` implementation. The stored document is versioned so a future API-backed repository can replace local storage without changing game logic.

Internationalization uses a tiny typed dictionary layer with all user-facing text centralized in `pt-BR` and `en-US` dictionaries.

## Main UI states
1. Onboarding: locale, avatar type, cosmetic color.
2. Home: Play, Achievements, Settings.
3. World map: islands 2–10 with locked/available/in-progress/completed states.
4. Mission: current construction, multiplication question, answer choices, feedback.
5. Mission result: score, progress, next action.
6. Table completion: larger celebration and next-island unlock.
7. Achievements.
8. Settings: locale, audio toggles, reset progress.

## Data model
A versioned `GameState` contains player profile, settings, island progress, global statistics, fact-level mastery, and achievement ids. Writes are centralized through the repository.

## MVP constraints
- No backend, accounts, rankings, multiplayer, ads, or payments.
- Responsive for desktop/tablet and usable on mobile, with gameplay optimized for landscape.
- Large targets, good contrast, keyboard support for answer buttons, no color-only status communication, no flashing effects.
