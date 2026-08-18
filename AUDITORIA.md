# Auditoria de Boas Práticas — 99, cc, ds, st

**Data da verificação:** 18/08/2026 (5ª rodada — elevação gradual do Stryker)
**Método:** inspeção do código-fonte e documentação + execução local de `npm run ci` em cada projeto + contagem de testes via `npx playwright test --list` + execução do Stryker em `cc` e `st`.
**Escopo:** diretórios `99`, `cc`, `ds`, `st` no working tree atual (há alterações não commitadas; a auditoria reflete o estado atual do disco, não o `HEAD` do git).

> Ajustes aplicados nesta rodada:
> - **E2E no GitHub Actions** para `cc`, `ds` e `st` (o `99` fica fora por enquanto).
> - **README do `cc` atualizado** (274 testes, 8 locales, Playwright/Stryker nos comandos).
> - **Stryker configurado no `cc` e `st`** e incluído na pipeline semanal, com thresholds calibrados ao baseline atual (cc `break: 60`, st `break: 45`) para funcionar como guarda de regressão enquanto a suíte melhora.

---

## Resumo executivo

| Projeto | CI (`lint+typecheck+test+build`) | Testes unitários | Testes E2E | Stryker (semanal) | Estado geral |
| --- | --- | --- | --- | --- | --- |
| **99** (Numi 99) | ❌ **vermelho** | 408 (407 passam, 1 falha) | 25 | fora da pipeline | CI quebrado; fora dos ajustes por enquanto |
| **cc** (Ilhas da Tabuada) | ✅ verde | 274 | 24 | ✅ 61% (break 60) | Muito maduro; axe é a lacuna principal |
| **ds** (Batalha da Tabuada) | ✅ verde | 201 | 13 | ✅ (≥80%) | Bom; cobertura E2E ainda menor |
| **st** (Lojinha Maluca) | ✅ verde | 78 | 16 | ✅ 47% (break 45) | Completo; mutation é baseline de melhoria |

---

## 1. Numi 99 (`99`)

**Stack:** React 19 + TS strict + Vite + R3F/Three/Rapier + Zustand.

### Pontos fortes

- **Vertical slices** com lógica pura em `slices/*/*.logic.ts` e fachada `index.ts`; slice nunca importa o store.
- **Performance exemplar**: posição (`playerTransform`), relógio (`dayNightClock`) e combustível (`fuelUntil`) vivem fora do React; store só recebe eventos raros e HUD é throttled a 4 Hz.
- **Persistência** (`src/slices/save/`): `GameSave` versionado, migração que lança em dado inválido, repositório que engole erro de armazenamento, autosave com debounce.
- **E2E de altíssimo valor**: 25 testes contra o build de produção, desktop + celular emulado, toque nativo via CDP e **screenshots versionados**.
- **Documentação de decisões** (`docs/decisoes.md`) registra o porquê de cada escolha.

### Lacunas

- ❌ **CI quebrado agora**: `src/slices/player/PlayerView.test.tsx` falha — `playerTransform.y` esperado `2`, recebido `0`.
- ❌ **Sem i18n**, **sem áudio**, **sem axe-core**.
- ⚠️ README diz **392 testes**; a execução atual encontrou **408**.
- ⚠️ Fora da pipeline de E2E e Stryker por decisão (trabalho em andamento).

### Ações recomendadas

1. Corrigir o teste de `PlayerView` (mais urgente).
2. Reavaliar i18n/áudio/axe quando o trabalho atual estabilizar.
3. Reinserir `99` nas pipelines de E2E/Stryker quando o CI voltar a ficar verde.

---

## 2. Ilhas da Tabuada (`cc`)

**Stack:** React 19 + TS strict + Vite + SVG/CSS (sem game engine) + localStorage.

### Pontos fortes

- **Domínio puro** em `src/domain/` e máquina de estados em `src/game/levelSession.ts`; UI não conhece storage.
- **Persistência robusta**: `storageService` + `ProgressRepository` injetável + schema versionado + migrações + `normalizeState`.
- **i18n completo**: 8 locales, chaves tipadas, teste de paridade e cobertura de conteúdo.
- **E2E com verificação de design system**: 24 testes incluem contraste medido sobre pixels reais do build de produção.
- **Mínimo de dependências**: runtime é só React/ReactDOM.
- **Áudio sintetizado** com Web Audio API.
- ✅ **ESLint sem warnings**.
- ✅ **README atualizado** (274 testes, 8 locales, comandos de e2e/mutation).
- ✅ **E2E no GitHub Actions**.
- ✅ **Stryker configurado e na pipeline semanal** (mutation score atual **61%**, break **60**).

### Lacunas

- ❌ **Sem axe-core**: contraste é verificado por testes computados, mas não há varredura WCAG automatizada.
- ❌ **Sem offline/PWA** (aceitável para o escopo atual).
- ⚠️ Mutation score 61% — abaixo da meta de 80%; thresholds calibrados para não quebrar a pipeline enquanto a suíte melhora.

### Ações recomendadas

1. Adicionar `@axe-core/playwright` nos E2E principais (ou documentar por que a verificação computada é suficiente).
2. Elevar gradualmente o `break` do Stryker conforme os testes de domínio/persistência melhorarem (meta: 80).

---

## 3. Batalha da Tabuada (`ds`)

**Stack:** React 19 + TS strict + Vite + DOM/SVG + localStorage + Stryker.

### Pontos fortes

- **Vertical slices** completas com domínio puro (`slices/*/*.ts`), UI colocalizada e RNG injetado.
- **Quality gates avançados**: lint, typecheck, test, build, e2e **e mutation testing (Stryker ≥80%)** na lógica crítica.
- ✅ **Mutation testing em pipeline semanal** (`.github/workflows/mutation.yml`).
- ✅ **E2E no GitHub Actions**.
- **Acessibilidade forte**: `@axe-core/playwright` falha em violações serious/critical.
- **i18n tipado**: 8 locales com `satisfies` + teste de paridade bidirecional.
- **Persistência com versão**: `SaveRepository` + `local-storage.repository` + auto-resume.

### Lacunas

- ❌ **Sem áudio**.
- ❌ **Sem offline/PWA**.
- ⚠️ E2E é 1 arquivo com 13 testes — menor cobertura de telas que `cc`/`st`/`99`.

### Ações recomendadas

1. Ampliar E2E para mais telas (mapa, configurações, conquistas).
2. Avaliar áudio/feedback sonoro opcional (não essencial).

---

## 4. Lojinha Maluca (`st`)

**Stack:** React 19 + TS strict + Vite + IndexedDB (`idb`) + Service Worker + axe.

### Pontos fortes

- **MVP funcional completo**: múltiplos perfis, lojas, atendimento, pistas progressivas, domínio adaptativo, economia, capítulos, conquistas, fechamento de dia.
- **Offline-first real**: Service Worker com cache versionado, teste E2E com rede desligada.
- **Persistência robusta**: IndexedDB com `schemaVersion`, migração, autosave e `close()`.
- **Acessibilidade forte**: E2E roda axe em **várias telas**, verifica alvos ≥24px e movimento reduzido.
- **i18n tipado**: 8 locales com teste de paridade e gramática.
- ✅ **Prettier adicionado** e código formatado.
- ✅ **Documentação atualizada** (78 testes, 16 E2E, axe nas telas principais).
- ✅ **E2E no GitHub Actions**.
- ✅ **Stryker configurado e na pipeline semanal** (mutation score atual **47%**, break **45**).

### Lacunas

- ⚠️ Mutation score 47% — abaixo da meta de 80%; thresholds calibrados para não quebrar a pipeline enquanto a suíte melhora.
- ⚠️ Trabalho em andamento não commitado (nova `src/i18n/`, mudanças em áudio, `App.tsx`).

### Ações recomendadas

1. Elevar gradualmente o `break` do Stryker conforme os testes de domínio melhorarem (meta: 80).
2. Finalizar e commitar o trabalho em andamento de i18n/áudio.

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
| Mutation testing (Stryker semanal) | ❌ | ✅ 61% (break 60) | ✅ ≥80% | ✅ 47% (break 45) |
| E2E no GitHub Actions | ❌ | ✅ | ✅ | ✅ |
| CI verde hoje | ❌ | ✅ | ✅ | ✅ |
| Docs de arquitetura/decisões | ✅ | ✅ | ✅ | ✅ |
| Docs atualizadas com números atuais | ⚠️ | ✅ | ✅ | ✅ |

Legenda: ✅ atende · ➖ atende de forma diferente · ⚠️ parcial/desatualizado · ❌ não atende.

---

## Prioridade de correção (próximos passos)

1. **99 — CI vermelho**: corrigir `PlayerView.test.tsx` (bloqueia deploy e reinserção nas pipelines).
2. **cc/99 — axe**: adicionar varredura WCAG automatizada nos fluxos principais.
3. **99 — i18n/áudio**: quando sair do escopo POC.
4. **cc/st — Stryker**: elevar `break` gradualmente (60→70→80 e 45→60→80) conforme os testes melhorarem.
5. **ds — E2E**: ampliar cobertura além do arquivo `smoke.spec.ts`.
