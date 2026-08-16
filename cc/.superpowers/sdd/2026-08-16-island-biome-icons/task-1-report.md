# Task 1 report

Status: DONE

Implemented the RED coverage for the island biome badge contract in
`src/art/IslandBadge.test.tsx`, including jsdom setup, all nine biome markers,
the locked overlay, and the completed accent.

TDD evidence:

- RED command: `npm test -- src/art/IslandBadge.test.tsx`
- RED result: 3 tests failed as expected with `AssertionError: expected null not to be null` because the production component does not yet render `data-landmark` or `data-completion-accent`.
- An earlier run failed with `document is not defined`; the test was corrected with the file-level jsdom directive before the valid RED run.

Files changed: `src/art/IslandBadge.test.tsx` only.

Self-review: test assertions exercise real rendered SVG output and preserve the
existing lock class/overlay contract. No unrelated files are staged.

Commit: `beb6dc7 test: cover island biome landmarks`.
