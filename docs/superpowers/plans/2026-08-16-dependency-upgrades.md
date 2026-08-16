# Dependency Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar as dependências JavaScript dos projetos para as versões estáveis atuais e confirmar zero vulnerabilidades conhecidas.

**Architecture:** Atualizar apenas os manifests que possuem versões defasadas, deixando o npm regenerar os lockfiles correspondentes. `cc`, `co` e `cw` serão validados com seus testes e builds; `gt` permanecerá sem dependências externas e será auditado pelo lockfile existente.

**Tech Stack:** npm 11, Node.js 24+, React, Vite, Vitest, TypeScript, ESLint e GitHub Actions.

## Global Constraints

- Não alterar a lógica dos aplicativos para acomodar upgrades; se uma atualização quebrar o código, investigar e corrigir somente a incompatibilidade necessária.
- Manter `package-lock.json` sincronizado com cada `package.json`.
- O workflow usa Node.js 24, compatível com as versões atuais de `jsdom`, `undici` e das ferramentas.
- TypeScript fica em `6.0.3`, pois `typescript-eslint@8.67.0` declara o peer range `>=4.8.4 <6.1.0`.
- Cada projeto deve terminar com `npm audit` reportando zero vulnerabilidades.
- `gt` não recebe dependências novas.

---

### Task 1: Atualizar a toolchain do `cc`

**Files:**
- Modify: `cc/package.json`
- Modify: `cc/package-lock.json`

**Interfaces:**
- Consumes: versões atuais do `cc` e o registry npm.
- Produces: toolchain atualizada com React/Vite compatíveis e lockfile reproduzível.

- [x] **Step 1: Atualizar os pacotes defasados**

No diretório `cc`, executar:

```text
npm install --save-dev @eslint/js@10.0.1 @vitejs/plugin-react@6.0.5 eslint@10.8.1 eslint-plugin-react-hooks@7.1.1 eslint-plugin-react-refresh@0.5.4 globals@17.11.0 typescript@6.0.3 vite@8.2.1 vitest@4.1.10
```

- [x] **Step 2: Validar testes e build**

Executar `npm run test` e `npm run build` em `cc`; ambos devem terminar com exit code 0.

- [x] **Step 3: Auditar dependências**

Executar `npm audit --audit-level=low`; esperado: `found 0 vulnerabilities`.

### Task 2: Atualizar o TypeScript do `co`

**Files:**
- Modify: `co/package.json`
- Modify: `co/package-lock.json`

**Interfaces:**
- Consumes: dependências atuais do `co`.
- Produces: confirmação de TypeScript 6.0.3 como a maior versão suportada pela versão estável atual de `typescript-eslint`.

- [x] **Step 1: Confirmar TypeScript compatível**

No diretório `co`, manter `typescript: "6.0.3"`; a versão 7.0.2 não é usada porque viola o peer range do `typescript-eslint@8.67.0`.

- [x] **Step 2: Validar testes e build**

Executar `npm run test:run` e `npm run build` em `co`; ambos devem terminar com exit code 0.

- [x] **Step 3: Auditar dependências**

Executar `npm audit --audit-level=low`; esperado: `found 0 vulnerabilities`.

### Task 3: Atualizar a stack do `cw`

**Files:**
- Modify: `cw/package.json`
- Modify: `cw/package-lock.json`

**Interfaces:**
- Consumes: React 18 e toolchain atual do `cw`.
- Produces: React 19, Vite 8, TypeScript 6.0.3, ESLint 10 e plugins compatíveis.

- [x] **Step 1: Atualizar runtime e tipos React**

No diretório `cw`, executar:

```text
npm install react@19.2.8 react-dom@19.2.8 --save
npm install --save-dev @types/react@19.2.18 @types/react-dom@19.2.4
```

- [x] **Step 2: Atualizar a toolchain**

Executar:

```text
npm install --save-dev @vitejs/plugin-react@6.0.5 eslint@10.8.1 eslint-plugin-react-hooks@7.1.1 typescript@6.0.3 vite@8.2.1 vitest@4.1.10
```

- [x] **Step 3: Validar testes e build**

Executar `npm run test` e `npm run build` em `cw`; ambos devem terminar com exit code 0.

- [x] **Step 4: Auditar dependências**

Executar `npm audit --audit-level=low`; esperado: `found 0 vulnerabilities`.

### Task 4: Validar o conjunto dos quatro projetos

**Files:**
- Verify: `cc/package.json`, `cc/package-lock.json`, `co/package.json`, `co/package-lock.json`, `cw/package.json`, `cw/package-lock.json`, `gt/package-lock.json`

**Interfaces:**
- Consumes: manifests e lockfiles atualizados nas Tasks 1–3.
- Produces: evidência de que os quatro projetos continuam testáveis, compiláveis quando aplicável e sem vulnerabilidades conhecidas.

- [x] **Step 1: Auditar todos os projetos**

Executar `npm audit --audit-level=low` em `cc`, `co`, `cw` e `gt`.

- [x] **Step 2: Executar os checks completos**

Executar:

```text
cc: npm run test && npm run build
co: npm run test:run && npm run build
cw: npm run test && npm run build
gt: npm test && npm run check && npm run build
```

- [x] **Step 3: Confirmar sincronização dos manifests**

Executar `git diff --check` e verificar que `npm ci --dry-run` não relata divergência entre cada `package.json` e seu lockfile.
