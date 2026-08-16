# Active Projects and GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep only `cc`, `99`, and `st` in the repository and publish those three applications through GitHub Pages.

**Architecture:** Preserve the existing single-job Pages workflow and its explicit per-project commands. Remove the three obsolete project trees, update the workflow and landing page to the retained projects, and make `st` emit relative asset URLs for its `/st/` deployment path.

**Tech Stack:** GitHub Actions, GitHub Pages, Node.js/npm, Vite, React, TypeScript, Vitest.

## Global Constraints

- Keep `cc`, `99`, and `st` unchanged except for the Pages deployment base setting in `st/vite.config.ts`.
- Remove `co`, `cw`, and `gt` completely.
- Preserve unrelated existing worktree changes in `99` and `st`.
- Do not refactor application code or change dependencies.

---

### Task 1: Remove obsolete project trees

**Files:**
- Delete: `co/`
- Delete: `cw/`
- Delete: `gt/`

**Interfaces:**
- Produces a repository containing only the three active application directories requested by the user.

- [ ] **Step 1: Verify the exact deletion targets**

Run:

```powershell
Resolve-Path -LiteralPath co,cw,gt
```

Expected: all three paths resolve directly under the repository root.

- [ ] **Step 2: Delete only the authorized directories**

Run:

```powershell
Remove-Item -LiteralPath co,cw,gt -Recurse -Force
```

Expected: `co`, `cw`, and `gt` no longer exist; no other directory is touched.

- [ ] **Step 3: Confirm retained directories still exist**

Run:

```powershell
Test-Path -LiteralPath cc
Test-Path -LiteralPath 99
Test-Path -LiteralPath st
```

Expected: three `True` results.

### Task 2: Update the GitHub Pages workflow

**Files:**
- Modify: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: `package-lock.json` and npm scripts from `cc`, `99`, and `st`.
- Produces: a Pages artifact with `site/cc`, `site/99`, and `site/st`.

- [ ] **Step 1: Update dependency caching and installation**

Keep only these cache paths and install commands:

```yaml
cache-dependency-path: |
  cc/package-lock.json
  99/package-lock.json
  st/package-lock.json
```

```yaml
npm ci --prefix cc
npm ci --prefix 99
npm ci --prefix st
```

- [ ] **Step 2: Keep build checks for `cc` and `99`, and add `st`**

Use the existing commands for `cc` and `99`. Add the `st` project check:

```yaml
- name: Test and build st
  working-directory: st
  run: npm run verify
```

- [ ] **Step 3: Update Pages artifact assembly**

Replace obsolete directories with the active set:

```bash
mkdir -p site/cc site/99 site/st
cp -R cc/dist/. site/cc/
cp -R 99/dist/. site/99/
cp -R st/dist/. site/st/
```

Expected: no workflow reference remains to `co`, `cw`, or `gt`.

### Task 3: Update the Pages landing page and `st` base path

**Files:**
- Modify: `pages/index.html`
- Modify: `st/vite.config.ts`

**Interfaces:**
- Produces: landing-page links to `/cc/`, `/99/`, and `/st/`; Vite output that works from `/st/`.

- [ ] **Step 1: Replace landing-page links**

The project list must contain exactly:

```html
<li><a href="./cc/">Ilhas da Tabuada</a></li>
<li><a href="./99/">Sobrevivência da Tabuada</a></li>
<li><a href="./st/">Lojinha Maluca</a></li>
```

- [ ] **Step 2: Set a relative Vite base for `st`**

Add `base: './',` to the top-level `defineConfig` object in `st/vite.config.ts`, matching the existing deployment configuration in the other retained Vite apps.

### Task 4: Run project verification and inspect the final diff

**Files:**
- Verify: `.github/workflows/pages.yml`, `pages/index.html`, `st/vite.config.ts`
- Verify: retained project directories and deleted project directories

- [ ] **Step 1: Run the active-project test and build commands**

Run from the repository root:

```powershell
npm run test --prefix cc
npm run build --prefix cc
npm run lint --prefix 99
npm run test --prefix 99
npm run build --prefix 99
npm run verify --prefix st
```

Expected: every command exits successfully.

- [ ] **Step 2: Check references and formatting**

Run:

```powershell
rg -n --hidden -g '!.git/**' -g '!99/e2e/.resultados/**' '(co|cw|gt)' .github pages/index.html
git diff --check
```

Expected: the reference search returns no output and `git diff --check` succeeds.

- [ ] **Step 3: Review worktree scope**

Run:

```powershell
git status --short
git diff --stat
```

Expected: deletions are limited to `co`, `cw`, and `gt`; intended workflow/index/config changes are present; pre-existing changes in `99` and `st` remain.
