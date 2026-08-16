# Task 2 Report: Palette-Driven SVG Landmarks

## Files changed

- `src/art/IslandBadge.tsx`
  - Added the `biome` prop and typed `LANDMARKS` map for all nine `BiomeId` values.
  - Replaced the repeated terrain bands with per-biome landmark geometry.
  - Preserved the locked overlay and added the completed-island flag accent.
- `src/screens/WorldMapScreen.tsx`
  - Passes `island.biome` to `IslandBadge`.

## Test result

Command:

```text
npm test -- src/art/IslandBadge.test.tsx
```

Output:

```text
> ilhas-da-tabuada@0.1.0 test
> vitest run src/art/IslandBadge.test.tsx


 RUN  v4.1.10 C:/Dev/00-work/multiplication-table/cc


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  02:03:24
   Duration  944ms (transform 47ms, setup 0ms, import 162ms, tests 34ms, environment 597ms)
```

## Self-review

- `IslandBadgeProps` is typed with `BiomeId`; `LANDMARKS` is an exhaustive `Record<BiomeId, (palette: BiomePalette) => ReactNode>`.
- Each biome renders one `data-landmark` group with its required distinct silhouette and palette-only landmark colors.
- The SVG still has `viewBox="0 0 120 104"`, `shapeRendering="crispEdges"`, and `aria-hidden="true"`.
- The locked overlay is still rendered after the landmark with its original geometry and colors.
- Completed islands alone render `data-completion-accent`, using `palette.blockDark` and `palette.accent`.
- The world map preserves existing behavior and supplies the new `biome` input.
- Scoped diff check passed; no tests, docs, generated files, or pre-existing user changes were edited.

## Concerns

None. The requested focused test is green; full-suite/build verification was not requested or run.
