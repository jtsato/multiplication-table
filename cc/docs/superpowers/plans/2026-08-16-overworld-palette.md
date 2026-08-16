# Overworld Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recolor every visual layer of the `cc` experience with an original, Minecraft-inspired overworld palette while preserving its game behavior, layout, accessibility semantics, and biomes.

**Architecture:** Keep the existing separation between CSS UI tokens, domain-owned biome/avatar/mascot colors, and SVG component details. Update each layer in place, using semantic CSS variables for interface states and material-based TypeScript palettes for the game world; no new rendering system or dependency is needed.

**Tech Stack:** React 19, TypeScript 6, Vite 8, CSS, Vitest, Testing Library, ESLint.

## Global Constraints

- Alter only files inside `cc/`; preserve the existing changes in the repository root and sibling projects.
- Do not alter screens, texts, game rules, progression, navigation, geometry, dimensions, or component APIs.
- Do not add Minecraft textures, logos, characters, names, or protected assets; use only an original voxel-inspired color direction.
- Preserve distinct visual identities for all nine islands.
- Preserve the semantic distinction and readable contrast of success, error, focus, disabled, hover, and active states.
- Keep the existing touch-target sizes, radii, animation behavior, and reduced-motion behavior.
- Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` from `cc` before completion.

---

### Task 1: Lock the overworld UI palette in contract tests

**Files:**
- Modify: `src/styles/buttonColors.test.ts`
- Modify: `src/styles/interfaceBackground.test.ts`

**Interfaces:**
- Consumes: the approved Overworld UI token values from the design specification.
- Produces: failing tests that describe the exact interface palette required by the CSS implementation task.

- [ ] **Step 1: Replace the button token expectations with the approved values**

Use these exact expectations in the existing `it.each` table:

```ts
[
  ['--button-primary-bg', '#6da94d'],
  ['--button-primary-text', '#1f2a1a'],
  ['--button-secondary-bg', '#f0bf45'],
  ['--button-secondary-text', '#3b2910'],
  ['--button-ghost-bg', '#e2e1d3'],
  ['--button-ghost-text', '#2f4f36'],
  ['--button-danger-bg', '#c45b4b'],
  ['--button-danger-text', '#fff3df'],
]
```

Keep the existing interaction-selector assertions unchanged so hover and active states remain part of the contract.

- [ ] **Step 2: Replace the background token expectations with the approved values**

Use these exact expectations in `interfaceBackground.test.ts`:

```ts
expect(css).toContain('--color-bg: #2f4a32;');
expect(css).toContain('--color-bg-grid: rgba(173, 198, 137, 0.2);');
expect(css).toContain('--color-text-on-dark: #fff8e7;');
expect(css).toContain('--color-text-soft-on-dark: #d7e1c4;');
```

Keep the assertions for `background-color: var(--color-bg)`, both grid gradients, and `background-size: 52px 52px` unchanged.

- [ ] **Step 3: Run the focused tests before changing CSS**

Run:

```bash
npm test -- src/styles/buttonColors.test.ts src/styles/interfaceBackground.test.ts
```

Expected: FAIL because `src/styles/global.css` still contains the old blue/yellow token values.

- [ ] **Step 4: Commit the red contract tests**

Run:

```bash
git add src/styles/buttonColors.test.ts src/styles/interfaceBackground.test.ts
git commit -m "test: define overworld ui palette"
```

### Task 2: Apply the overworld CSS token system and UI states

**Files:**
- Modify: `src/styles/global.css:9-50` and all later selectors containing the old UI color literals

**Interfaces:**
- Consumes: the failing token contracts from Task 1.
- Produces: a semantic CSS palette used by every interface surface, button state, status message, focus ring, card, and shadow.

- [ ] **Step 1: Replace the `:root` token block with the approved UI palette**

The root token block must contain these values:

```css
--color-bg: #2f4a32;
--color-bg-grid: rgba(173, 198, 137, 0.2);
--color-surface: #f4ecd8;
--color-surface-soft: #e9e1cf;
--color-text: #2d2a24;
--color-text-soft: #5d5b50;
--color-text-on-dark: #fff8e7;
--color-text-soft-on-dark: #d7e1c4;
--color-primary: #6da94d;
--color-primary-dark: #3f752f;
--color-focus: #f0bf45;
--color-secondary: #f0bf45;
--color-success: #4d963e;
--color-danger: #c45b4b;
--color-danger-dark: #913a34;
--color-success-soft: #e4f0d8;
--color-danger-soft: #f3dfd7;
--color-warning-soft: #fff0c2;
--color-info-soft: #dce9dd;
--color-muted: #788276;
--button-primary-bg: #6da94d;
--button-primary-hover: #7fba5b;
--button-primary-active: #56883d;
--button-primary-text: #1f2a1a;
--button-primary-shadow: #3e662d;
--button-secondary-bg: #f0bf45;
--button-secondary-hover: #f7d16c;
--button-secondary-active: #d9a933;
--button-secondary-text: #3b2910;
--button-secondary-border: #b67b1e;
--button-ghost-bg: #e2e1d3;
--button-ghost-hover: #d2d5be;
--button-ghost-active: #b8c2a3;
--button-ghost-text: #2f4f36;
--button-ghost-border: #8ea184;
--button-danger-bg: #c45b4b;
--button-danger-hover: #d46e5d;
--button-danger-active: #9f4239;
--button-danger-text: #fff3df;
--button-danger-border: #79352f;
--color-border: #c9c4b0;
--shadow-soft: 0 8px 24px rgba(36, 48, 31, 0.2);
--shadow-pop: 0 4px 0 rgba(36, 48, 31, 0.24);
```

Retain the existing radius, font, and touch-target tokens exactly.

- [ ] **Step 2: Replace direct UI literals with semantic tokens or approved earthy variants**

Search the complete stylesheet with:

```bash
rg -n '#[0-9a-fA-F]{3,8}|rgba?\\([^)]*\\)|hsl\\([^)]*\\)' src/styles/global.css
```

Replace repeated status and surface literals with the new semantic variables: success backgrounds use `var(--color-success-soft)`, error backgrounds use `var(--color-danger-soft)`, reward/warning backgrounds use `var(--color-warning-soft)`, pale informational backgrounds use `var(--color-info-soft)`, muted text uses `var(--color-muted)`, and shadows use the new earthy shadow tokens. Replace remaining one-off blue, purple, and neon pink accents with the corresponding grass, water, terracotta, gold, or amethyst values used by the domain palette.

- [ ] **Step 3: Run the focused tests to verify the CSS contract**

Run:

```bash
npm test -- src/styles/buttonColors.test.ts src/styles/interfaceBackground.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit the CSS token implementation**

Run:

```bash
git add src/styles/global.css
git commit -m "feat: apply overworld ui palette"
```

### Task 3: Recolor biome, mascot, and avatar domain data

**Files:**
- Modify: `src/domain/islands.ts`
- Modify: `src/domain/mascots.ts`
- Modify: `src/domain/avatar.ts`
- Create: `src/domain/visualPalette.test.ts`

**Interfaces:**
- Consumes: the existing `BiomePalette`, `MascotColors`, and avatar color maps.
- Produces: the same exported types and functions with new material-based color values; `getPalette`, `getMascotDefinition`, and `OUTFIT_COLORS_HEX` signatures do not change.

- [ ] **Step 1: Add focused palette tests before changing domain values**

Create `src/domain/visualPalette.test.ts` with these checks:

```ts
import { describe, expect, it } from 'vitest';
import { getPalette, ISLANDS } from './islands';
import { getMascotDefinition } from './mascots';
import { OUTFIT_COLORS_HEX } from './avatar';

describe('overworld visual palette', () => {
  it('keeps nine islands distinct while using material colors', () => {
    expect(ISLANDS).toHaveLength(9);
    expect(new Set(ISLANDS.map(({ palette }) => palette.skyTop)).size).toBeGreaterThanOrEqual(7);
    expect(getPalette(2)).toMatchObject({
      skyTop: '#72b7d6',
      groundTop: '#70a84a',
      block: '#b7864b',
      accent: '#d8b341',
    });
    expect(getPalette(7)).toMatchObject({
      skyTop: '#252c36',
      groundDeep: '#2f2c28',
      accent: '#d4a947',
    });
  });

  it('uses overworld outfit accents', () => {
    expect(OUTFIT_COLORS_HEX).toEqual({
      red: '#b85a45',
      blue: '#5b8e68',
      green: '#6da94d',
      purple: '#856a9d',
      orange: '#c67a3f',
      pink: '#b76f68',
    });
  });

  it('keeps mascot identities in the same material family', () => {
    expect(getMascotDefinition('bloco').colors).toEqual({
      accent: '#6f9d89',
      accentSoft: '#dbe9dc',
      blockDark: '#466855',
    });
    expect(getMascotDefinition('cristal').colors).toEqual({
      accent: '#8b83b5',
      accentSoft: '#d8d2ec',
      blockDark: '#5b567c',
    });
  });
});
```

- [ ] **Step 2: Run the new domain test before changing domain data**

Run:

```bash
npm test -- src/domain/visualPalette.test.ts
```

Expected: FAIL on the old island, outfit, and mascot values.

- [ ] **Step 3: Replace all nine `PALETTES` entries in `src/domain/islands.ts`**

Use the following material palette table, keeping the existing object keys and biome-to-table mapping:

| Biome | `skyTop` / `skyBottom` | `groundTop` / `groundMid` / `groundDeep` | `water` / `waterDeep` | `block` / `blockLight` / `blockDark` | `accent` / `accentSoft` |
| --- | --- | --- | --- | --- | --- |
| fields | `#72b7d6` / `#d9ecdf` | `#70a84a` / `#4f8738` / `#734b2b` | `#4c9fbe` / `#2f6f88` | `#b7864b` / `#d5ad70` / `#78552f` | `#d8b341` / `#9fc56b` |
| forest | `#5a9ab8` / `#cfe2d3` | `#497a3c` / `#345b32` / `#5a402a` | `#3f8798` / `#29616f` | `#8a633d` / `#b08150` / `#5f4227` | `#d6b246` / `#89b86c` |
| mountains | `#7f9cae` / `#d9e4e5` | `#929c9c` / `#6b7777` / `#444e4e` | `#5c99ac` / `#3c6674` | `#7a8582` / `#b1bbb3` / `#4c5754` | `#d3a63a` / `#a8c2c0` |
| beach | `#67b6d0` / `#f1dfb5` | `#d8bc78` / `#b99558` / `#8c6d42` | `#4e9eb7` / `#2d6e82` | `#b8744b` / `#d59a65` / `#75432f` | `#d35a45` / `#e9c861` |
| magicForest | `#5c557f` / `#c9bfdc` | `#648c58` / `#456a43` / `#4e3f5e` | `#6f74ae` / `#4a4f7f` | `#856a9d` / `#b49aca` / `#5a456c` | `#d8b84f` / `#8ac3a0` |
| caves | `#252c36` / `#4b4b4a` | `#6e6654` / `#504a3d` / `#2f2c28` | `#3a8d82` / `#256158` | `#8b7150` / `#b59a6e` / `#584633` | `#d4a947` / `#8ac0a5` |
| ice | `#75b4c8` / `#e5f2ee` | `#d7e5df` / `#a6c4c0` / `#6e9493` | `#67abc0` / `#3d7180` | `#9fc2c5` / `#d9ece8` / `#648e95` | `#d8b348` / `#f2f1da` |
| volcano | `#493541` / `#b85b43` | `#5b423c` / `#3c2b2d` / `#211d21` | `#c45b35` / `#7a2e27` | `#8a4d3b` / `#b97148` / `#572f31` | `#e2a83e` / `#c85a3d` |
| city | `#5f9fbc` / `#e5d7ba` | `#777c72` / `#595f5b` / `#3b413e` | `#4f8fa4` / `#2d6172` | `#b09b68` / `#d4bc7d` / `#78623e` | `#d4a53e` / `#99b4a0` |

- [ ] **Step 4: Replace mascot and avatar color maps**

Use these exact values:

```ts
const OUTFIT_COLORS_HEX = {
  red: '#b85a45',
  blue: '#5b8e68',
  green: '#6da94d',
  purple: '#856a9d',
  orange: '#c67a3f',
  pink: '#b76f68',
};
```

Keep existing skin and hair values unless they are only used as thematic accents. Set mascot colors to:

```ts
bloco: { accent: '#6f9d89', accentSoft: '#dbe9dc', blockDark: '#466855' }
brasa: { accent: '#d06a45', accentSoft: '#f0bf45', blockDark: '#8d3f31' }
folha: { accent: '#6da94d', accentSoft: '#b9d58a', blockDark: '#3f752f' }
flor: { accent: '#b76f68', accentSoft: '#e6c1bd', blockDark: '#7e4a4a' }
cristal: { accent: '#8b83b5', accentSoft: '#d8d2ec', blockDark: '#5b567c' }
```

- [ ] **Step 5: Run the focused domain test and commit**

Run:

```bash
npm test -- src/domain/visualPalette.test.ts
```

Expected: PASS.

Then run:

```bash
git add src/domain/islands.ts src/domain/mascots.ts src/domain/avatar.ts src/domain/visualPalette.test.ts
git commit -m "feat: recolor overworld domain palettes"
```

### Task 4: Align SVG art, splash, and celebration colors

**Files:**
- Modify: `src/art/Avatar.tsx`
- Modify: `src/art/Decor.tsx`
- Modify: `src/art/IslandBadge.tsx`
- Modify: `src/art/Mascot.tsx`
- Modify: `src/art/SceneView.tsx`
- Modify: `src/screens/SplashScreen.tsx`
- Modify: `src/screens/LevelScreen.tsx`
- Modify: `src/screens/IslandCompleteScreen.tsx`
- Modify: `src/art/IslandBadge.test.tsx`
- Modify: `src/art/Mascot.test.tsx`
- Modify: `src/art/SceneView.test.tsx` only where a fixture asserts the changed visual contract

**Interfaces:**
- Consumes: the material colors from `src/domain/islands.ts`, `src/domain/mascots.ts`, and `src/domain/avatar.ts`.
- Produces: the same SVG props and screen behavior with no old blue/rose/neon-purple literals in active source.

- [ ] **Step 1: Update color assertions and fixtures before source literals**

Change test-only expected colors to the approved family: SVG outlines use `#2d2a24`, shoes and dark details use `#554536`, warm highlights use `#f0bf45`, pale highlights use `#f4ecd8`, and water/leaf fixture values use the corresponding table entries from Task 3. Do not change assertions about element structure, dimensions, opacity, or animation classes.

- [ ] **Step 2: Run the focused art tests before changing implementation colors**

Run:

```bash
npm test -- src/art/IslandBadge.test.tsx src/art/Mascot.test.tsx src/art/SceneView.test.tsx
```

Expected: FAIL only where the tests now expect the new color literals.

- [ ] **Step 3: Replace fixed SVG and screen colors**

Use these fixed art values where the current components have equivalent roles:

```ts
const OUTLINE = '#2d2a24';
const SHOE = '#554536';
const EYE = '#233027';
const WARM_HIGHLIGHT = '#f0bf45';
const LIGHT_SURFACE = '#f4ecd8';
```

Use `#4f5f50` for badge/stone dark details, `#b85a45` for terracotta accents, `#6da94d` for leaf/grass accents, and `#6f9d89` for water/teal accents. Replace splash/confetti arrays with `['#d4a53e', '#b85a45', '#6da94d', '#5b8e68', '#856a9d']`. Preserve all existing keys, SVG structure, opacity values, and animation timing.

- [ ] **Step 4: Run the focused art tests after the recolor**

Run:

```bash
npm test -- src/art/IslandBadge.test.tsx src/art/Mascot.test.tsx src/art/SceneView.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the art and celebration recolor**

Run:

```bash
git add src/art src/screens/SplashScreen.tsx src/screens/LevelScreen.tsx src/screens/IslandCompleteScreen.tsx
git commit -m "feat: align cc art with overworld palette"
```

### Task 5: Run the complete verification sweep

**Files:**
- Modify: none unless a verification command exposes a color contract or formatting issue from Tasks 1–4

**Interfaces:**
- Consumes: the completed CSS, domain, art, and test changes.
- Produces: verified build artifacts and evidence that the old active palette is gone from `cc/src`.

- [ ] **Step 1: Search active source for the old palette families**

Run:

```bash
rg -n --glob '*.{css,ts,tsx}' --glob '!*.test.*' '#(172f6b|3aa0ff|1c7fd6|ffd23f|ff5d8f|c86bff|8b5cf6|ff5d6c|e9665a|e8f3ff|fff4c2|174a78|3d2b00)' src
```

Expected: no matches in active source. Natural skin/hair tones and intentionally unrelated neutral values should be reviewed individually rather than mass-replaced.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
npm test
```

Expected: all existing tests and `src/domain/visualPalette.test.ts` PASS.

- [ ] **Step 3: Run typecheck, lint, and build**

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit successfully and Vite writes the production bundle to `cc/dist/`.

- [ ] **Step 4: Check the final diff scope**

Run:

```bash
git diff HEAD~4..HEAD --stat -- cc
git status --short
```

Expected: only files inside `cc/` appear in the palette implementation commits; pre-existing root changes and sibling directories remain untouched.

- [ ] **Step 5: Commit any final verification-only fixes**

If formatting or a test fixture requires a final adjustment, run:

```bash
git add src
git commit -m "fix: verify overworld palette integration"
```

