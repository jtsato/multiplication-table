# Auditoria de Boas Práticas — 99, cc, ds, st

**Data da verificação:** 18/08/2026 (3ª rodada — revalidação após ajustes)
**Método:** inspeção do código-fonte e documentação + execução local de `npm run ci` em cada projeto + contagem de testes via `npx playwright test --list`.
**Escopo:** diretórios `99`, `cc`, `ds`, `st` no working tree atual (há alterações não commitadas; a auditoria reflete o estado atual do disco, não o `HEAD` do git).

> Ajustes aplicados nesta rodada: pipeline semanal de **Stryker** (`.github/workflows/mutation.yml`, fora do push na main e sem o `99`), **Prettier** adicionado no `st`, documentação do `st` atualizada e **warnings ESLint do `cc` zerados**.

---

## Resumo executivo

| Projeto | CI (`lint+typecheck+test+build`) | Testes unitários | Testes E2E | Estado geral |
| --- | --- | --- | --- | --- |
| **99** (Numi 99) | ❌ **vermelho** | 408 (407 passam, 1 falha) | 25 | Arquitetura, performance e persistência excelentes, mas CI quebrado |
| **cc** (Ilhas da Tabuada) | ✅ verde (0 warnings) | 274 | 24 | Muito maduro; poucas lacunas |
| **ds** (Batalha da Tabuada) | ✅ verde | 201 | 13 | Mutation testing agora roda em pipeline semanal |
| **st** (Lojinha Maluca) | ✅ verde | 78 | 16 | Prettier e docs alinhados; falta mutation e E2E no CI |

---

## 1. Numi 99 (`99`)

**Stack:** React 19 + TS strict + Vite + R3F/Three/Rapier + Zustand.

### Pontos fortes

- **Vertical slices** com lógica pura em `slices/*/*.logic.ts` e fachada `index.ts`; slice nunca importa o store.
- **Performance exemplar**: posição (`playerTransform`), relógio (`dayNightClock`) e combustível (`fuelUntil`) vivem fora do React; store só recebe eventos raros e HUD é throttled a 4 Hz.
- **Persistência** (`src/slices/save/`): `GameSave` versionado, migração que lança em dado inválido, repositório que engole erro de armazenamento, autosave com debounce e filtro de igualdade.
- **E2E de altíssimo valor**: 25 testes contra o build de produção, desktop + celular emulado, toque nativo via CDP e **screenshots versionados** (`e2e/telas/`).
- **Documentação de decisões** (`docs/decisoes.md`) registra o porquê de cada escolha e bugs pegos por teste.
- **PRNG semeado** e determinismo em toda a lógica.

### Lacunas

- ❌ **CI quebrado agora**: `src/slices/player/PlayerView.test.tsx` falha — `playerTransform.y` esperado `2`, recebido `0`. É a primeira coisa a corrigir.
- ❌ **Sem i18n**: texto fixo em pt-BR.
- ❌ **Sem camada de áudio**.
- ❌ **Sem axe-core**: acessibilidade é tratada pontualmente, mas sem varredura automatizada WCAG.
- ⚠️ Bundle grande (WASM do Rapier embutido); mitigado com `React.lazy`/tela de carregamento.
- ⚠️ README diz **392 testes**; a execução atual encontrou **408**.

### Ações recomendadas

1. Corrigir o teste de `PlayerView` (mais urgente).
2. Adicionar i18n tipado se o jogo for além de pt-BR.
3. Avaliar axe nos fluxos principais.
4. Incluir E2E no CI (hoje roda só localmente).

---

## 2. Ilhas da Tabuada (`cc`)

**Stack:** React 19 + TS strict + Vite + SVG/CSS (sem game engine) + localStorage.

### Pontos fortes

- **Domínio puro** em `src/domain/` e máquina de estados em `src/game/levelSession.ts`; UI não conhece storage.
- **Persistência robusta**: `storageService` + `ProgressRepository` injetável + schema versionado + migrações + `normalizeState`.
- **i18n completo**: 8 locales, chaves tipadas, teste de paridade e cobertura de conteúdo.
- **E2E com verificação de design system**: 24 testes incluem contraste medido sobre pixels reais do build de produção.
- **Mínimo de dependências**: runtime é só React/ReactDOM.
- **Áudio sintetizado** com Web Audio API, sem assets.
- ✅ **ESLint sem warnings** (os 2 avisos de `react-refresh/only-export-components` foram suprimidos com justificativa colocalizada).

### Lacunas

- ❌ **Sem axe-core**: contraste é verificado por testes computados, mas não há varredura WCAG automatizada.
- ❌ **Sem mutation testing** (Stryker).
- ❌ **Sem offline/PWA** (aceitável para o escopo atual).
- ⚠️ README desatualizado: diz ~135 testes, mas hoje são **274**.
- ⚠️ Trabalho em andamento não commitado no seletor de idioma (`LanguageChoice`, locales, `global.css`).

### Ações recomendadas

1. Adicionar `@axe-core/playwright` nos E2E principais (ou documentar por que a verificação computada é suficiente).
2. Atualizar README com números atuais.
3. Considerar Stryker na lógica crítica (domínio/review) — a pipeline semanal já está pronta para receber `cc`.

---

## 3. Batalha da Tabuada (`ds`)

**Stack:** React 19 + TS strict + Vite + DOM/SVG + localStorage + Stryker.

### Pontos fortes

- **Vertical slices** completas com domínio puro (`slices/*/*.ts`), UI colocalizada e RNG injetado.
- **Quality gates avançados**: lint, typecheck, test, build, e2e **e mutation testing (Stryker ≥80%)** na lógica crítica.
- ✅ **Mutation testing em pipeline semanal** (`.github/workflows/mutation.yml`): roda domingo 06:00 UTC + `workflow_dispatch`, sem bloquear push na main e sem o `99`.
- **Acessibilidade forte**: `@axe-core/playwright` falha em violações serious/critical; E2E cobre teclado, `aria-live`, skip link, alvos e reduced-motion.
- **i18n tipado**: 8 locales com `satisfies` + teste de paridade bidirecional.
- **Persistência com versão**: `SaveRepository` + `local-storage.repository` + auto-resume no reload.

### Lacunas

- ❌ **Sem áudio**.
- ❌ **Sem offline/PWA**.
- ⚠️ E2E é 1 arquivo com 13 testes — menor cobertura de telas que `cc`/`st`/`99`.

### Ações recomendadas

1. Considerar incluir E2E no CI.
2. Avaliar áudio/feedback sonoro opcional (não essencial).

---

## 4. Lojinha Maluca (`st`)

**Stack:** React 19 + TS strict + Vite + IndexedDB (`idb`) + Service Worker + axe.

### Pontos fortes

- **MVP funcional completo**: múltiplos perfis, lojas, atendimento, pistas progressivas, domínio adaptativo, economia, capítulos, conquistas, fechamento de dia.
- **Offline-first real**: Service Worker com cache versionado, teste E2E com rede desligada e aviso de atualização.
- **Persistência robusta**: IndexedDB com `schemaVersion`, migração, autosave e `close()`; `fake-indexeddb` nos testes.
- **Acessibilidade forte**: E2E roda axe em **várias telas**, verifica alvos ≥24px e movimento reduzido.
- **i18n tipado**: 8 locales com teste de paridade e gramática.
- ✅ **Prettier adicionado**: `.prettierrc.json`, `.prettierignore`, scripts `format`/`format:check` e código formatado.
- ✅ **Documentação atualizada**: README, `current-state.md` e `docs/ACCESSIBILITY.md` refletem 78 testes, 16 E2E e cobertura de axe nas telas principais.

### Lacunas

- ❌ **Sem mutation testing**.
- ⚠️ Trabalho em andamento não commitado (nova `src/i18n/`, mudanças em áudio, `App.tsx`).
- ⚠️ CI local não roda E2E (só `npm run ci`).

### Ações recomendadas

1. Considerar Stryker na lógica crítica (domínio matemático) — a pipeline semanal já está pronta para receber `st`.
2. Incluir E2E no CI.

---

## Comparativo consolidado

| Prática | 99 | cc | ds | st |
| --- | --- | --- | --- | --- |
| TypeScript strict | ✅ | ✅ | ✅ | ✅ |
| ESLint flat config | ✅ | ✅ (0 warnings) | ✅ | ✅ |
| Prettier + format scripts | ✅ | ✅ | ✅ | ✅ |
| Domínio puro sem React/DOM/storage | ✅ | ✅ | ✅ | ✅ |
| Vertical slices | ✅ | ➖ camadas claras | ✅ | ➖ camadas claras |
| Estado mínimo (sem lib desnecessária) | ✅ Zustand | ✅ Context | ✅ useReducer/useState | ✅ useState |
| i18n com chaves tipadas + paridade | ❌ | ✅ | ✅ | ✅ |
| Persistência versionada + migração | ✅ | ✅ | ✅ | ✅ |
| Offline/PWA | ❌ | ❌ | ❌ | ✅ |
| Áudio opcional/configurável | ❌ | ✅ | ❌ | ✅ |
| Acessibilidade automatizada (axe) | ❌ | ➖ contraste computado | ✅ | ✅ |
| Testes unitários | 407 ✅ / 1 ❌ | 274 ✅ | 201 ✅ | 78 ✅ |
| Testes E2E Playwright | 25 | 24 | 13 | 16 |
| Mutation testing (Stryker) | ❌ | ❌ | ✅ semanal | ❌ |
| E2E no GitHub Actions | ❌ | ❌ | ❌ | ❌ |
| CI verde hoje | ❌ | ✅ | ✅ | ✅ |
| Docs de arquitetura/decisões | ✅ | ✅ | ✅ | ✅ |
| Docs atualizadas com números atuais | ⚠️ | ⚠️ | ✅ | ✅ |

Legenda: ✅ atende · ➖ atende de forma diferente · ⚠️ parcial/desatualizado · ❌ não atende.

---

## Prioridade de correção (ordem: menor esforço → maior impacto)

1. **99 — CI vermelho**: corrigir `PlayerView.test.tsx` (bloqueia deploy).
2. **CI geral — E2E**: incluir `test:e2e` no workflow GitHub Actions (hoje roda só localmente).
3. **cc/99 — axe**: adicionar varredura WCAG automatizada nos fluxos principais.
4. **cc — README**: atualizar números (~135 → 274).
5. **99 — i18n/áudio**: quando sair do escopo POC.
6. **st/cc — Stryker**: adicionar `test:mutation` e incluí-los na pipeline semanal (opcional; a infraestrutura já existe).
