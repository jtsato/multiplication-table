# Island Biome Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repeated island badge artwork on the world map with nine distinct SVG pixel-art landmarks, one for each biome, while preserving map behavior and status communication.

**Architecture:** Keep `IslandBadge` as the single SVG renderer used by the map. Add the island `biome` as an explicit prop and select a small, palette-driven landmark renderer from a typed `BiomeId` map. Keep the lock overlay, completion accent, number chip, text, and button behavior in their current layers so only the map artwork changes.

**Tech Stack:** React 19, TypeScript strict mode, inline SVG, Vitest, Testing Library, ESLint, Vite.

## Global Constraints

- The scope is only `WorldMapScreen` and `IslandBadge`; mission scenes and block constructions remain unchanged.
- Use the existing `BiomePalette`; do not duplicate palette colors inside the landmark renderers.
- Add no raster assets, external assets, dependencies, translations, or persistence changes.
- Keep `aria-hidden="true"` on the decorative SVG; island name, table, status, and lock hint remain textual.
- Keep the current locked overlay, disabled button behavior, keyboard focus behavior, and status text.
- Preserve existing user modifications in `src/art/SceneView.tsx`, `src/audio/audioService.ts`, `src/domain/defaultState.ts`, `src/persistence/persistence.test.ts`, `src/screens/LevelResultScreen.tsx`, and `src/styles/global.css`.

---

### Task 1: Add the landmark rendering contract and failing coverage

**Files:**
- Create: `src/art/IslandBadge.test.tsx`
- Read: `src/domain/islands.ts`, `src/domain/types.ts`, `src/art/IslandBadge.tsx`

**Interfaces:**
- Consumes: `ISLANDS`, `IslandStatus`, `BiomePalette`.
- Produces: the expected `IslandBadge` prop contract with `biome: BiomeId` and a stable `data-landmark` marker for each rendered landmark.

- [ ] **Step 1: Write the failing test for all nine biomes**

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ISLANDS } from '../domain/islands';
import { IslandBadge } from './IslandBadge';

describe('IslandBadge landmarks', () => {
  it('renders a distinct landmark for every island biome', () => {
    for (const island of ISLANDS) {
      const { container, unmount } = render(
        <IslandBadge
          biome={island.biome}
          palette={island.palette}
          status="available"
        />,
      );

      expect(
        container.querySelector(`[data-landmark="${island.biome}"]`),
      ).not.toBeNull();
      unmount();
    }
  });
});
```

- [ ] **Step 2: Add status regression cases to the same test file**

```tsx
it('keeps the lock overlay for locked islands', () => {
  const { container } = render(
    <IslandBadge
      biome="forest"
      palette={ISLANDS[1].palette}
      status="locked"
    />,
  );

  expect(container.querySelector('[data-landmark="forest"]')).not.toBeNull();
  expect(container.querySelector('.island-badge--locked')).not.toBeNull();
  expect(container.querySelector('rect[fill="#1c2333"]')).not.toBeNull();
});

it('keeps a completion accent for completed islands', () => {
  const { container } = render(
    <IslandBadge
      biome="city"
      palette={ISLANDS[8].palette}
      status="completed"
    />,
  );

  expect(container.querySelector('[data-landmark="city"]')).not.toBeNull();
  expect(container.querySelector('[data-completion-accent]')).not.toBeNull();
});
```

- [ ] **Step 3: Run the focused test and verify it fails for the missing prop/markers**

Run: `npx vitest run src/art/IslandBadge.test.tsx`

Expected: FAIL because `IslandBadge` does not yet accept `biome` and does not yet render the landmark markers.

### Task 2: Implement distinct palette-driven SVG landmarks

**Files:**
- Modify: `src/art/IslandBadge.tsx`
- Modify: `src/screens/WorldMapScreen.tsx:54-57`

**Interfaces:**
- Consumes: `BiomeId`, `BiomePalette`, `IslandStatus`.
- Produces: `IslandBadgeProps = { biome: BiomeId; palette: BiomePalette; status: IslandStatus; size?: number }` and one `[data-landmark="<biome>"]` group per render.

- [ ] **Step 1: Extend the `IslandBadge` props and pass the biome from the map**

In `WorldMapScreen.tsx`, update the badge call to:

```tsx
<IslandBadge
  biome={island.biome}
  palette={island.palette}
  status={status}
  size={140}
/>
```

In `IslandBadge.tsx`, import `BiomeId` and add `biome: BiomeId` to `IslandBadgeProps`.

- [ ] **Step 2: Add typed landmark renderers for the nine biomes**

Create a `LANDMARKS` map in `IslandBadge.tsx` with the signature:

```tsx
import type { ReactNode } from 'react';

type LandmarkRenderer = (palette: BiomePalette) => ReactNode;
const LANDMARKS: Record<BiomeId, LandmarkRenderer> = { ... };
```

Each renderer must return a `<g data-landmark="...">` using only existing palette colors:

- `fields`: three stepped green rectangles, a stem, and a five-petal flower with `accent` center;
- `forest`: trunk plus three layered triangular pine sections using `groundTop`, `groundMid`, and `accentSoft`;
- `mountains`: a faceted diamond/crystal using `groundMid`, `blockLight`, and `accentSoft`;
- `beach`: boat hull, mast, and two sails with a short water line using `block`, `blockLight`, and `water`;
- `magicForest`: one large four-point star plus two small sparkles using `accent` and `accentSoft`;
- `caves`: dark cave arch with a centered crystal using `groundDeep`, `groundMid`, `blockLight`, and `accent`;
- `ice`: six-armed snowflake using `blockLight`, `accent`, and `accentSoft`;
- `volcano`: triangular volcano, lava slit, and two smoke puffs using `groundDeep`, `block`, `accent`, and `accentSoft`;
- `city`: two side towers, center castle, roofs, and a doorway using `block`, `blockLight`, `accent`, and `accentSoft`.

Keep the geometry inside the existing `viewBox="0 0 120 104"`, center the landmark around `x=60`, and preserve `shapeRendering="crispEdges"`.

- [ ] **Step 3: Replace the repeated terrain stack with the selected landmark and preserve status layers**

Render the selected landmark after the SVG opens and before the status-specific overlay:

```tsx
{LANDMARKS[biome](palette)}
{locked && <LockedOverlay />}
{completed && (
  <g data-completion-accent aria-hidden="true">
    <rect x="94" y="8" width="4" height="15" fill={palette.blockDark} />
    <rect x="98" y="8" width="12" height="7" fill={palette.accent} />
  </g>
)}
```

Keep the existing lock overlay geometry and colors unchanged, and keep the SVG decorative with `aria-hidden="true"`.

- [ ] **Step 4: Run focused tests and verify the implementation passes**

Run: `npx vitest run src/art/IslandBadge.test.tsx`

Expected: PASS for all nine landmark cases, the locked overlay case, and the completed accent case.

### Task 3: Run the complete validation suite and inspect the map

**Files:**
- Modify: none unless a validation failure identifies a necessary correction in `src/art/IslandBadge.tsx` or `src/screens/WorldMapScreen.tsx`.

**Interfaces:**
- Consumes: the completed landmark renderer and existing map tests.
- Produces: a buildable, lint-clean map with the approved visual direction.

- [ ] **Step 1: Run type checking**

Run: `npm run typecheck`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 2: Run linting**

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Run the complete test suite**

Run: `npm test`

Expected: all existing and new tests pass.

- [ ] **Step 4: Build the production bundle**

Run: `npm run build`

Expected: exit code 0 and a refreshed `dist/` build without TypeScript or Vite errors.

- [ ] **Step 5: Inspect the rendered map at two widths**

Run the app with `npm run dev` and inspect the map at desktop width and a narrow viewport. Confirm that the nine silhouettes are visually different, the number circle does not cover a landmark, locked islands remain visibly locked, and the available island remains easy to identify.

- [ ] **Step 6: Commit only the implementation files**

Because the worktree contains unrelated user changes, stage only:

```bash
git add src/art/IslandBadge.tsx src/art/IslandBadge.test.tsx src/screens/WorldMapScreen.tsx
git commit -m "feat: add distinct island biome landmarks"
```

Do not stage the pre-existing modified files or the generated `.superpowers/` companion directory.
