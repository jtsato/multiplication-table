### Task 2: Implement distinct palette-driven SVG landmarks

**Files:**

- Modify: `src/art/IslandBadge.tsx`
- Modify: `src/screens/WorldMapScreen.tsx:54-57`

**Interfaces:**

- Consumes: `BiomeId`, `BiomePalette`, `IslandStatus`.
- Produces: `IslandBadgeProps = { biome: BiomeId; palette: BiomePalette; status: IslandStatus; size?: number }` and one `[data-landmark="<biome>"]` group per render.

**Required implementation:**

1. In `WorldMapScreen.tsx`, pass `biome={island.biome}` to `IslandBadge` alongside the existing palette, status, and size.
2. In `IslandBadge.tsx`, import `BiomeId` and `ReactNode`, add `biome: BiomeId` to the props, and create a typed `LANDMARKS: Record<BiomeId, (palette: BiomePalette) => ReactNode>` map.
3. Replace the repeated three terrain bands with one centered SVG `<g data-landmark="<biome>">` per biome. Keep all geometry inside `viewBox="0 0 120 104"` and preserve `shapeRendering="crispEdges"`. Use only existing `BiomePalette` colors.
4. Implement these distinct silhouettes:
   - `fields`: three stepped green rectangles, stem, five-petal flower with `accent` center;
   - `forest`: trunk and three layered triangular pine sections;
   - `mountains`: faceted diamond/crystal;
   - `beach`: boat hull, mast, two sails, short water line;
   - `magicForest`: large four-point star and two small sparkles;
   - `caves`: dark cave arch with centered crystal;
   - `ice`: six-armed snowflake;
   - `volcano`: triangular volcano, lava slit, two smoke puffs;
   - `city`: two side towers, center castle, roofs, doorway.
5. Keep the existing locked overlay geometry and colors after the landmark. Preserve `aria-hidden="true"` on the SVG. Add a completion group with `data-completion-accent` only for completed islands, containing a small flag using `palette.blockDark` and `palette.accent`.

Run `npx vitest run src/art/IslandBadge.test.tsx` and ensure the Task 1 tests pass. Do not modify mission scenes, translations, persistence, or existing unrelated user changes.

Global constraints:

- No new assets or dependencies.
- Preserve disabled button behavior, keyboard focus, status text, number chip, and lock behavior.
- Do not modify pre-existing user changes in `src/art/SceneView.tsx`, `src/audio/audioService.ts`, `src/domain/defaultState.ts`, `src/persistence/persistence.test.ts`, `src/screens/LevelResultScreen.tsx`, or `src/styles/global.css`.
