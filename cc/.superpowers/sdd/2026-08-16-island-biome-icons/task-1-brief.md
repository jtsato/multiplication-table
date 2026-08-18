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
        <IslandBadge biome={island.biome} palette={island.palette} status="available" />,
      );

      expect(container.querySelector(`[data-landmark="${island.biome}"]`)).not.toBeNull();
      unmount();
    }
  });
});
```

- [ ] **Step 2: Add status regression cases to the same test file**

```tsx
it('keeps the lock overlay for locked islands', () => {
  const { container } = render(
    <IslandBadge biome="forest" palette={ISLANDS[1].palette} status="locked" />,
  );

  expect(container.querySelector('[data-landmark="forest"]')).not.toBeNull();
  expect(container.querySelector('.island-badge--locked')).not.toBeNull();
  expect(container.querySelector('rect[fill="#1c2333"]')).not.toBeNull();
});

it('keeps a completion accent for completed islands', () => {
  const { container } = render(
    <IslandBadge biome="city" palette={ISLANDS[8].palette} status="completed" />,
  );

  expect(container.querySelector('[data-landmark="city"]')).not.toBeNull();
  expect(container.querySelector('[data-completion-accent]')).not.toBeNull();
});
```

- [ ] **Step 3: Run the focused test and verify it fails for the missing prop/markers**

Run: `npx vitest run src/art/IslandBadge.test.tsx`

Expected: FAIL because `IslandBadge` does not yet accept `biome` and does not yet render the landmark markers.

Global constraints:

- Only `WorldMapScreen` and `IslandBadge` are in scope for production changes.
- Use the existing `BiomePalette`; add no raster assets, external assets, dependencies, translations, or persistence changes.
- Preserve lock overlay, disabled button behavior, keyboard focus, status text, and decorative `aria-hidden="true"` SVG behavior.
- Do not modify pre-existing user changes in `src/art/SceneView.tsx`, `src/audio/audioService.ts`, `src/domain/defaultState.ts`, `src/persistence/persistence.test.ts`, `src/screens/LevelResultScreen.tsx`, or `src/styles/global.css`.
