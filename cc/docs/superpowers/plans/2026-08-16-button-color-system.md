# Game Button Colors and Interface Grid Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repetitive yellow button palette with a clear game-oriented color hierarchy and add a subtle navy grid background to interface screens while preserving biome backgrounds during missions.

**Architecture:** Keep the existing `Button` React API and implement the visual system in `src/styles/global.css` with CSS custom properties. Add small static CSS contract tests so the approved design tokens and selectors cannot silently regress. Apply the grid only to the global document shell; mission-level inline biome backgrounds remain unchanged.

**Tech Stack:** React 19, TypeScript, CSS custom properties, Vitest, Testing Library, Vite, ESLint.

## Global Constraints

- Keep the existing `Button` variants: `primary`, `secondary`, `ghost`, and `danger`.
- Keep the minimum touch target at `48px` for medium and large buttons.
- Preserve the existing visible focus indicator and reduced-motion rules.
- Do not add dependencies or change the `Button` component API.
- Apply the interface grid to home, map, settings, achievements, and result screens; keep the mission biome background.
- Use the approved colors exactly: primary `#f5b82e`, secondary `#fff4c2`, ghost `#e8f3ff`, danger `#e9665a`.
- Meet at least `4.5:1` text contrast for normal button text in base, hover, and active states.

---

### Task 1: Add failing CSS contracts for button colors

**Files:**
- Create: `src/styles/buttonColors.test.ts`

**Interfaces:**
- Consumes: the literal contents of `src/styles/global.css`.
- Produces: a red test contract for the button tokens and interaction selectors implemented in Task 2.

- [ ] **Step 1: Write the failing test**

Create a static contract test that reads the stylesheet and checks the approved token values plus one explicit selector for each interaction family:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('button color system', () => {
  it.each([
    ['--button-primary-bg', '#f5b82e'],
    ['--button-primary-text', '#172b4d'],
    ['--button-secondary-bg', '#fff4c2'],
    ['--button-secondary-text', '#3d2b00'],
    ['--button-ghost-bg', '#e8f3ff'],
    ['--button-ghost-text', '#174a78'],
    ['--button-danger-bg', '#e9665a'],
    ['--button-danger-text', '#431a1e'],
  ])('defines %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value};`);
  });

  it.each([
    '.btn--primary:hover',
    '.btn--primary:active',
    '.btn--secondary:hover',
    '.btn--ghost:active',
    '.btn--danger:active',
  ])('defines the interaction selector %s', (selector) => {
    expect(css).toContain(selector);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/styles/buttonColors.test.ts`

Expected: FAIL because the current stylesheet has hard-coded yellow declarations and does not define the approved button tokens or variant state selectors.

- [ ] **Step 3: Commit the failing contract**

```bash
git add src/styles/buttonColors.test.ts
git commit -m "test: define button color contracts"
```

### Task 2: Implement the game button color hierarchy

**Files:**
- Modify: `src/styles/global.css:9-24` for button tokens.
- Modify: `src/styles/global.css:111-190` for button variant states.
- Test: `src/styles/buttonColors.test.ts`

**Interfaces:**
- Consumes: the failing CSS contract from Task 1.
- Produces: `.btn` variants that use shared tokens and communicate hover, active, disabled, and danger states without changing React props.

- [ ] **Step 1: Add the button tokens**

Add these declarations to `:root`:

```css
  --button-primary-bg: #f5b82e;
  --button-primary-hover: #ffd166;
  --button-primary-active: #d99a17;
  --button-primary-text: #172b4d;
  --button-primary-shadow: #b98208;
  --button-secondary-bg: #fff4c2;
  --button-secondary-hover: #ffebb0;
  --button-secondary-active: #f1d77a;
  --button-secondary-text: #3d2b00;
  --button-secondary-border: #d59a13;
  --button-ghost-bg: #e8f3ff;
  --button-ghost-hover: #d7ebff;
  --button-ghost-active: #b9d8f4;
  --button-ghost-text: #174a78;
  --button-ghost-border: #96c2e8;
  --button-danger-bg: #e9665a;
  --button-danger-hover: #f27c70;
  --button-danger-active: #c94b42;
  --button-danger-text: #431a1e;
  --button-danger-border: #a73735;
```

- [ ] **Step 2: Replace hard-coded variant colors and add explicit states**

Use the tokens in the existing four variant blocks. Keep the existing radius, sizing, transition, and touch-target rules. Add the following state behavior after the base variant rules:

```css
.btn--primary:hover {
  background: var(--button-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--button-primary-shadow);
}

.btn--primary:active {
  background: var(--button-primary-active);
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--button-primary-shadow);
}

.btn--secondary:hover {
  background: var(--button-secondary-hover);
  transform: translateY(-2px);
}

.btn--secondary:active {
  background: var(--button-secondary-active);
}

.btn--ghost:hover {
  background: var(--button-ghost-hover);
  transform: translateY(-2px);
}

.btn--ghost:active {
  background: var(--button-ghost-active);
}

.btn--danger:hover {
  background: var(--button-danger-hover);
  transform: translateY(-2px);
}

.btn--danger:active {
  background: var(--button-danger-active);
  color: #ffffff;
}
```

Use a non-transparent border for secondary, ghost, and danger variants. Set disabled buttons to `opacity: 0.68`, remove transform/shadow, and preserve the existing `cursor: not-allowed`; do not use a disabled color that makes the label unreadable.

- [ ] **Step 3: Run the focused test to verify it passes**

Run: `npm test -- src/styles/buttonColors.test.ts`

Expected: PASS with all token and selector assertions green.

- [ ] **Step 4: Run focused lint and whitespace checks**

Run: `npx eslint src/styles/buttonColors.test.ts` and `git diff --check`

Expected: PASS with no errors.

- [ ] **Step 5: Commit the button visual system**

```bash
git add src/styles/global.css src/styles/buttonColors.test.ts
git commit -m "feat: refine game button color hierarchy"
```

### Task 3: Add failing contract for the interface grid background

**Files:**
- Create: `src/styles/interfaceBackground.test.ts`

**Interfaces:**
- Consumes: the literal contents of `src/styles/global.css`.
- Produces: a red contract for the navy interface background, grid texture, and light shell headings implemented in Task 4.

- [ ] **Step 1: Write the failing test**

Create a stylesheet contract test:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('interface background', () => {
  it('defines the navy grid tokens', () => {
    expect(css).toContain('--color-bg: #172f6b;');
    expect(css).toContain('--color-bg-grid: rgba(255, 255, 255, 0.08);');
    expect(css).toContain('--color-text-on-dark: #f4f7ff;');
    expect(css).toContain('--color-text-soft-on-dark: #cbd8f5;');
  });

  it('applies a static 52 pixel grid to the body shell', () => {
    expect(css).toContain('background-color: var(--color-bg);');
    expect(css).toContain(
      'linear-gradient(var(--color-bg-grid) 1px, transparent 1px)',
    );
    expect(css).toContain(
      'linear-gradient(90deg, var(--color-bg-grid) 1px, transparent 1px)',
    );
    expect(css).toContain('background-size: 52px 52px;');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/styles/interfaceBackground.test.ts`

Expected: FAIL because the current body has a flat light background and no grid tokens.

- [ ] **Step 3: Commit the failing contract**

```bash
git add src/styles/interfaceBackground.test.ts
git commit -m "test: define interface background contract"
```

### Task 4: Implement the navy grid shell without changing mission scenes

**Files:**
- Modify: `src/styles/global.css:9-55` for background and shell text tokens.
- Modify: `src/styles/global.css:206-225` for shared screen headings.
- Modify: `src/styles/global.css:630-650` for home headings.
- Test: `src/styles/interfaceBackground.test.ts`

**Interfaces:**
- Consumes: the failing background contract from Task 3.
- Produces: a static navy grid on the global interface shell while leaving `.level` and island biome backgrounds untouched.

- [ ] **Step 1: Add background and shell text tokens**

Add these declarations to `:root`:

```css
  --color-bg: #172f6b;
  --color-bg-grid: rgba(255, 255, 255, 0.08);
  --color-text-on-dark: #f4f7ff;
  --color-text-soft-on-dark: #cbd8f5;
```

- [ ] **Step 2: Apply the non-animated grid to `body`**

Replace the flat body background with:

```css
  background-color: var(--color-bg);
  background-image:
    linear-gradient(var(--color-bg-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-bg-grid) 1px, transparent 1px);
  background-size: 52px 52px;
  background-position: 0 0;
```

Do not add a background rule to `.level`; its existing inline island palette must continue to own the mission backdrop.

- [ ] **Step 3: Keep global headings readable over the grid**

Add:

```css
.screen__title,
.home__title,
.settings__section-title {
  color: var(--color-text-on-dark);
}

.screen__subtitle,
.home__subtitle {
  color: var(--color-text-soft-on-dark);
}
```

Leave text inside white cards using `var(--color-text)` and `var(--color-text-soft)` so card content does not lose contrast.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- src/styles/interfaceBackground.test.ts`

Expected: PASS with both background contract tests green.

- [ ] **Step 5: Commit the interface background**

```bash
git add src/styles/global.css src/styles/interfaceBackground.test.ts
git commit -m "feat: add navy grid interface background"
```

### Task 5: Verify contrast, behavior, and production output

**Files:**
- Modify: none.
- Test: `src/styles/buttonColors.test.ts`, `src/styles/interfaceBackground.test.ts`, existing full suite.

**Interfaces:**
- Consumes: the completed CSS system from Tasks 2 and 4.
- Produces: evidence that the visual change preserves accessibility and application behavior.

- [ ] **Step 1: Measure the approved color pairs**

Run this Node command and verify each reported ratio is at least `4.5` for normal text:

```bash
node -e "const lum=h=>{const c=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]}; const ratio=(a,b)=>{const x=lum(a),y=lum(b);return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2)}; for(const [name,text,bg] of [['primary','#172b4d','#f5b82e'],['primary-hover','#172b4d','#ffd166'],['primary-active','#172b4d','#d99a17'],['secondary','#3d2b00','#fff4c2'],['ghost','#174a78','#e8f3ff'],['danger','#431a1e','#e9665a'],['danger-active','#ffffff','#c94b42'],['heading','#f4f7ff','#172f6b']]) console.log(name,ratio(text,bg))"
```

Expected: every ratio is `>= 4.5`.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: all existing and new tests pass.

- [ ] **Step 3: Run typecheck and production build**

Run: `npm run typecheck` and `npm run build`

Expected: both commands exit with code 0.

- [ ] **Step 4: Run targeted lint and diff checks**

Run: `npx eslint src/styles/buttonColors.test.ts src/styles/interfaceBackground.test.ts` and `git diff --check`

Expected: no errors in the changed files and no whitespace errors. Report any unrelated repository-wide lint failure separately rather than changing unrelated files.

- [ ] **Step 5: Inspect the final visual behavior**

Run the existing development server and inspect the home, map, settings, achievements, result, and mission screens. Confirm that interface screens show a subtle static navy grid, cards remain readable, buttons have distinct hierarchy/states, and the mission still shows its island biome background.

- [ ] **Step 6: Commit verification evidence if needed**

Do not create a code commit for generated build output. Keep the two implementation commits and report the exact verification results.
