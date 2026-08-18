# Desktop Viewport Fit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the gameplay screen fit the browser's current desktop viewport on the first render, without requiring a manual window resize.

**Architecture:** Keep the behavior CSS-only. The gameplay shell will use `vh`/`dvh` height fallbacks, the stage will remain a non-shrinking centered flex area, and the SVG will be capped by both the available width and a width equivalent to 40% of the viewport height. The mission panel will be allowed to shrink and scroll internally when the viewport is short; React components and game state remain unchanged.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Vite, and the existing in-app browser validation workflow.

## Global Constraints

- Limit the change to gameplay layout in `cc/src/styles/global.css` and its CSS contract test.
- Preserve the scene's `5:3` `viewBox` proportion (`360 × 216`).
- Use `min-height: 100vh` followed by `min-height: 100dvh` on the gameplay shell.
- Do not measure the window or add layout state in JavaScript.
- Preserve the existing mobile behavior and touch target sizing.
- Do not alter scene artwork, mission rules, or non-gameplay screens.

---

## File Map

- Modify: `cc/src/styles/global.css` — gameplay shell, stage, scene sizing, and panel overflow rules.
- Create: `cc/src/styles/desktopViewportFit.test.ts` — source-level CSS contract regression tests following the existing style-test pattern.
- Reference only: `cc/src/screens/LevelScreen.tsx` and `cc/src/art/scenes.ts` — confirm the DOM class names and the `360 × 216` scene dimensions; no production changes are needed there.

### Task 1: Add the failing CSS contract test

**Files:**

- Create: `cc/src/styles/desktopViewportFit.test.ts`

**Interfaces:**

- Consumes: the existing `cc/src/styles/global.css` file loaded with `readFileSync`.
- Produces: named assertions for the `.level`, `.level__stage`, `.level__stage .scene`, and `.level__panel` CSS rules.

- [ ] **Step 1: Write the failing test**

Create `cc/src/styles/desktopViewportFit.test.ts` with this content:

```ts
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

function rule(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) {
    return '';
  }

  const end = css.indexOf('\n}', start);
  return end === -1 ? css.slice(start) : css.slice(start, end);
}

describe('desktop gameplay viewport fit', () => {
  it('provides a viewport height fallback for the gameplay shell', () => {
    const levelRule = rule('.level');

    expect(levelRule).toContain('min-height: 100vh;');
    expect(levelRule).toContain('min-height: 100dvh;');
  });

  it('keeps the stage and panel shrinkable while allowing panel scrolling', () => {
    expect(rule('.level__stage')).toContain('min-height: 0;');

    const panelRule = rule('.level__panel');
    expect(panelRule).toContain('min-height: 0;');
    expect(panelRule).toContain('overflow-y: auto;');
  });

  it('bounds the desktop scene using the 5:3 viewBox proportion', () => {
    const sceneRule = rule('.level__stage .scene');

    expect(sceneRule).toContain('aspect-ratio: 5 / 3;');
    expect(sceneRule).toContain('width: min(100%, var(--level-scene-width-limit));');
    expect(css).toContain('--level-scene-width-limit: 66.6667vh;');
    expect(css).toContain('--level-scene-width-limit: 66.6667dvh;');
  });
});
```

- [ ] **Step 2: Run the new test and verify it fails for the missing layout contract**

Run from `C:\Dev\00-work\multiplication-table\cc`:

```text
npm test -- src/styles/desktopViewportFit.test.ts
```

Expected result: FAIL because the current `.level` rule has no `100vh` fallback, `.level__stage` and `.level__panel` do not declare `min-height: 0`, and there is no desktop scene rule using the `5:3` proportion and viewport-width limit.

- [ ] **Step 3: Commit the red test**

```text
git add -- cc/src/styles/desktopViewportFit.test.ts
git commit -m "test: cover desktop viewport fit"
```

### Task 2: Implement the CSS-only viewport fit

**Files:**

- Modify: `cc/src/styles/global.css:894-1000` — gameplay shell, stage, scene, and panel rules.
- Modify: `cc/src/styles/global.css:1694-1710` — desktop stage/scene breakpoint rules.

**Interfaces:**

- Consumes: the selectors and assertions from `desktopViewportFit.test.ts`.
- Produces: a first-render layout that uses the current viewport without React measurement or resize state.

- [ ] **Step 1: Add viewport fallbacks and shrink boundaries**

Update the gameplay rules so the shell and its flex children have explicit sizing behavior:

```css
.level {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.level__bar {
  flex: 0 0 auto;
}

.level__stage {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  justify-content: center;
}

.level__panel {
  min-height: 0;
  overflow-y: auto;
}
```

Keep the existing padding, background, and panel spacing declarations in place; only add or adjust the sizing declarations required by this layout contract.

- [ ] **Step 2: Add the proportional desktop scene limit**

Add a custom property to `.level__stage` and override it for browsers with dynamic viewport units:

```css
.level__stage {
  --level-scene-width-limit: 66.6667vh;
}

@supports (height: 100dvh) {
  .level__stage {
    --level-scene-width-limit: 66.6667dvh;
  }
}
```

Inside the existing `@media (min-width: 720px)` block, replace the desktop `.scene` sizing with a scoped rule that keeps the full `360 × 216` scene visible:

```css
.level__stage .scene {
  width: min(100%, var(--level-scene-width-limit));
  max-width: 100%;
  max-height: none;
  aspect-ratio: 5 / 3;
  height: auto;
}
```

Retain the existing desktop stage padding and level panel max-width. The scoped selector prevents the result screen's `.result__scene .scene` from inheriting the gameplay viewport cap.

- [ ] **Step 3: Run the focused test and verify it passes**

```text
npm test -- src/styles/desktopViewportFit.test.ts
```

Expected result: PASS with all three viewport-fit behaviors covered.

- [ ] **Step 4: Commit the minimal CSS implementation**

```text
git add -- cc/src/styles/global.css
git commit -m "fix: fit gameplay layout to desktop viewport"
```

### Task 3: Run automated checks and visual verification

**Files:**

- No new files expected. If a check exposes a defect, modify only `cc/src/styles/global.css` or `cc/src/styles/desktopViewportFit.test.ts`, then repeat the relevant test cycle before committing the correction.

**Interfaces:**

- Consumes: the CSS implementation and its regression test from Task 2.
- Produces: verified behavior at tall and wide/short desktop viewport sizes, with all project checks passing.

- [ ] **Step 1: Run the complete test suite**

Run from `C:\Dev\00-work\multiplication-table\cc`:

```text
npm test
```

Expected result: all existing tests and `desktopViewportFit.test.ts` pass without new warnings or errors.

- [ ] **Step 2: Run typecheck, lint, and production build**

Run from `C:\Dev\00-work\multiplication-table\cc`:

```text
npm run typecheck
npm run lint
npm run build
```

Expected result: each command exits successfully. The build must complete with the updated CSS included in `dist/`.

- [ ] **Step 3: Start the local app for browser inspection**

Run from `C:\Dev\00-work\multiplication-table\cc`:

```text
npm run dev -- --host 127.0.0.1
```

Open the local app at the Vite URL reported by the command and enter a mission. Do not resize the browser after the page opens.

- [ ] **Step 4: Inspect a tall desktop viewport**

At approximately `1366 × 900` CSS pixels, confirm on the first render that the header, complete scene width, briefing/question panel, and action controls are visible without a resize-triggered layout jump.

- [ ] **Step 5: Inspect a wide, short desktop viewport**

At approximately `1920 × 768` CSS pixels, confirm on the first render that the scene is centered and proportionally reduced, the header remains visible, and the panel below the scene is not clipped. If the panel content exceeds the remaining height, confirm that scrolling is confined to the panel.

- [ ] **Step 6: Confirm mobile regression coverage**

Run the existing mobile-oriented tests through `npm test` and inspect a narrow viewport if the browser session makes it available. Confirm that touch targets and the existing mobile scene/panel flow remain usable.

- [ ] **Step 7: Record final status**

Run:

```text
git status --short
git diff --check
```

Expected result: no uncommitted files belonging to `cc`, no whitespace errors, and any pre-existing changes under sibling projects left untouched.
