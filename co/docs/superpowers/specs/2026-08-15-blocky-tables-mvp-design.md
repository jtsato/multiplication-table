# Blocky Tables MVP — Design

## Product direction

Blocky Tables is a browser-only learning adventure in which multiplication repairs and expands a colorful block-built archipelago. The experience avoids school-test framing: each answer immediately changes the current construction, while mistakes reveal a concrete block-array hint and invite another attempt without removing progress.

The first-run path is locale selection, avatar creation, world map, a short contextual tutorial, and the bridge mission on the Island of 2. Every table from 2 through 10 is playable. Progression is linear, but completion is intentionally forgiving: completing all mission questions unlocks the next island while performance continues to influence later review questions.

## Technical approach

Use React 19, TypeScript strict, and Vite. Phaser is deliberately omitted: the MVP uses interactive DOM controls plus SVG/CSS scenery, which offers smaller startup cost, straightforward responsiveness, keyboard accessibility, translated labels, and sufficient lightweight animation for the construction loop. No remote assets, backend, cookies, or protected game material are used.

Application state lives in a small React context/reducer-style provider. Pure domain modules own question generation, mastery, adaptive weighting, progression, achievements, and schema migration. UI screens consume commands exposed by the provider and never access storage directly.

## Data and persistence

`GameState` is the single persistent aggregate. `ProgressRepository` exposes asynchronous `load`, `save`, and `reset`; `LocalStorageProgressRepository` is the MVP adapter. Loading merges valid data with defaults, recovers corrupted payloads, and migrates old schema shapes. A future API adapter can implement the same interface.

Per-fact mastery uses attempts, correct/incorrect counts, last-seen timestamp, and a bounded score. The adaptive selector raises the weight of facts with low mastery and recent errors, lowers mastered facts, and excludes the immediately previous fact when another candidate exists.

## Content model

An island catalogue describes table number, biome, mission type, number of questions, and construction metadata. The same mission engine renders bridge, grove, crystal tower, lighthouse, magic tree, cavern gate, ice beacon, volcano path, and final city, while color palettes and SVG block geometry keep every island distinct.

Each phase contains six questions. The final question completes the island's main construction, updates statistics/mastery, awards achievements, marks the island complete, and unlocks the next one. Previously weak facts from completed tables may enter later sessions as review questions without replacing the active table's identity.

## UX and accessibility

Screens: splash, locale/onboarding, avatar customization, home, world map, phase, result/island celebration, achievements, and settings. Gameplay prioritizes landscape but remains usable in portrait. Controls have large targets, visible focus states, text/icon status labels, reduced-motion support, and no color-only meaning. Audio is optional and generated with the Web Audio API; no instruction depends on sound.

## Error handling

Corrupt storage is quarantined by resetting to schema defaults. Repository failures keep the in-memory session playable. Invalid routes return to the home screen. Reset requires explicit confirmation. Missing translation keys fall back to `pt-BR` and then to the key, preventing blank UI.

## Testing

Vitest covers question/distractor correctness, weighted review and immediate-repeat avoidance, mastery calculation, linear unlocks, achievements, repository corruption/defaults, schema migration, and both locale catalogues. React Testing Library covers the first-access and gameplay-critical UI path. Build, lint, test, and manual responsive smoke checks form the final gate.

## Explicit MVP decisions

- Six questions per island session, balancing the requested five-to-seven range.
- Factors range from 1 to 10; an island session samples six adaptively.
- Completion unlocks the next island after the construction finishes, regardless of score, avoiding indefinite blocking. A score of 80% or more grants three stars; 60–79% grants two; lower grants one.
- Avatar body choices are presentation presets named Explorer and Builder in translations; every hair, clothing color, and accessory is available to either preset.
- The app is a client-side single page application without a routing dependency.
- Music and effects use short legal Web Audio tones; music defaults on but only begins after user interaction.
