# GitHub Pages Unificado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar o repositório raiz para ignorar artefatos comuns e publicar `cc`, `co`, `cw` e `gt` no mesmo site do GitHub Pages.

**Architecture:** O workflow será executado na raiz, validará cada projeto com seus scripts existentes, copiará os quatro diretórios `dist/` para um artefato `site/<projeto>/` e copiará a página inicial versionada em `pages/index.html`. O deploy usará as actions oficiais do GitHub Pages fixadas em SHAs completos.

**Tech Stack:** GitHub Actions, GitHub Pages, Node.js 20, npm, Vite, Vitest e Node.js test runner.

## Global Constraints

- O repositório é único e tem os projetos em `cc`, `co`, `cw` e `gt`.
- Cada aplicativo deve continuar funcionando quando servido a partir de seu subdiretório Pages.
- O workflow deve executar os testes/checks existentes antes do deploy.
- Não alterar a lógica, o conteúdo ou o visual dos aplicativos.
- O diretório `site/` é gerado apenas para o artefato do deploy e deve ser ignorado pelo Git.
- A página inicial deve ser mantida como arquivo versionado, sem heredoc ou HTML gerado no workflow.

---

### Task 1: Criar o `.gitignore` raiz

**Files:**
- Create: `.gitignore`

**Interfaces:**
- Produces: regras compartilhadas para todos os projetos descendentes.

- [x] **Step 1: Especificar as categorias de arquivos locais**

Incluir dependências (`**/node_modules/`), builds (`**/dist/`, `**/build/`), caches (`**/.vite/`, `**/*.tsbuildinfo`), cobertura, logs, arquivos `.env` locais, `site/`, IDEs e arquivos de sistema operacional.

- [x] **Step 2: Verificar o conteúdo**

Run: `Get-Content -Raw .gitignore`

Expected: o arquivo contém uma regra explícita para cada categoria e não contém regras para `package-lock.json`.

### Task 2: Tornar o build de `co` compatível com subdiretório

**Files:**
- Modify: `co/vite.config.ts`

**Interfaces:**
- Consumes: configuração atual do Vite.
- Produces: assets relativos no build de `co`.

- [x] **Step 1: Adicionar `base: './'`**

Inserir `base: './',` na configuração retornada por `defineConfig`, mantendo os plugins e as opções de testes existentes.

- [x] **Step 2: Verificar o build e os caminhos**

Run: `npm run build --prefix co`

Expected: exit code 0 e criação de `co/dist/index.html`.

Run: `Select-String -Path co/dist/index.html -Pattern 'src="\./|href="\./'`

Expected: pelo menos uma referência relativa aos assets do build.

### Task 3: Criar o workflow de Pages

**Files:**
- Create: `pages/index.html`
- Create: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: scripts npm de `cc`, `co`, `cw` e `gt`.
- Produces: artefato Pages com `site/index.html`, `site/cc/index.html`, `site/co/index.html`, `site/cw/index.html` e `site/gt/index.html`.

- [x] **Step 1: Definir disparadores e permissões**

Configurar `push` na branch `main`, `workflow_dispatch`, permissões `contents: read`, `pages: write` e `id-token: write`, além de concorrência para cancelar deploys antigos.

- [x] **Step 2: Instalar dependências e validar os quatro projetos**

Usar `actions/checkout@v4`, `actions/setup-node@v4` com Node 20 e `npm ci` em `cc`, `co` e `cw`. Executar:

```yaml
cc: npm run test && npm run build
co: npm run test:run && npm run build
cw: npm run test && npm run build
gt: npm test && npm run check && npm run build
```

- [x] **Step 3: Montar e enviar o artefato**

Copiar cada `dist/` para seu diretório em `site/`, copiar `pages/index.html` para `site/index.html`, usar `actions/configure-pages` e `actions/upload-pages-artifact` fixadas em SHAs completos.

- [x] **Step 4: Publicar o artefato**

Criar um job dependente do build, com environment `github-pages`, e usar `actions/deploy-pages@v4`.

### Task 4: Validar a integração local

**Files:**
- Verify: `.gitignore`, `co/vite.config.ts`, `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: os arquivos produzidos pelas Tasks 1–3.
- Produces: evidência local de que os quatro builds e os testes passam e que o artefato tem a estrutura esperada.

- [x] **Step 1: Executar os testes e builds dos projetos**

Run, dentro de cada projeto, os mesmos comandos definidos no workflow.

Expected: todos terminam com exit code 0.

- [x] **Step 2: Montar uma cópia local do site**

Copiar os quatro `dist/` para `site/cc`, `site/co`, `site/cw` e `site/gt`, e confirmar a existência dos quatro `index.html`.

- [x] **Step 3: Revisar as alterações**

Run: `git diff --check` quando o repositório raiz estiver inicializado; enquanto isso, revisar os arquivos alterados com `Get-Content` e listar o estado do workspace.
