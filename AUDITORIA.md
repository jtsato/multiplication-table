# Auditoria de Boas Práticas — 99, cc, ds, st

**Data da verificação:** 18/08/2026 (6ª rodada — Stryker elevado e CI do 99 verde)
**Método:** inspeção do código-fonte e documentação + execução local de `npm run ci` em cada projeto + contagem de testes via `npx playwright test --list` + execução do Stryker em `cc` e `st`.
**Escopo:** diretórios `99`, `cc`, `ds`, `st` no working tree atual (a auditoria reflete o estado atual do disco; o `HEAD` já contém os ajustes anteriores).

> Ajustes aplicados nesta rodada:
> - **CI do `99` voltou a ficar verde** (teste do `PlayerView` corrigido com espera pelo corpo da física).
> - **Stryker do `st` elevado para `break: 60`** (mutation score **63.5%**).
> - **Stryker do `cc` elevado para `break: 65`** (mutation score **65.3%**; meta de 70 ainda não atingida).
> - **+21 testes no `st`** (99 unit) e **+21 testes no `cc`** (295 unit), mirando os mutantes sobreviventes.

---

## Resumo executivo

| Projeto | CI (`lint+typecheck+test+build`) | Testes unitários | Testes E2E | Stryker (semanal) | Estado geral |
| --- | --- | --- | --- | --- | --- |
| **99** (Numi 99) | ✅ **verde** | 408 | 25 | fora da pipeline | CI restaurado; fora das pipelines por decisão |
| **cc** (Ilhas da Tabuada) | ✅ verde | 295 | 24 | ✅ 65.3% (break 65) | Muito maduro; caminho para 70% em andamento |
| **ds** (Batalha da Tabuada) | ✅ verde | 201 | 13 | ✅ (≥80%) | Bom; cobertura E2E ainda menor |
| **st** (Lojinha Maluca) | ✅ verde | 99 | 16 | ✅ 63.5% (break 60) | Mutation testing em trajetória de melhora |

---

## 1. Numi 99 (`99`)

**Stack:** React 19 + TS strict + Vite + R3F/Three/Rapier + Zustand.

### Pontos fortes

- **Vertical slices** com lógica pura em `slices/*/*.logic.ts` e fachada `index.ts`; slice nunca importa o store.
- **Performance exemplar**: posição (`playerTransform`), relógio (`dayNightClock`) e combustível (`fuelUntil`) vivem fora do React; store só recebe eventos raros e HUD é throttled a 4 Hz.
- **Persistência** (`src/slices/save/`): `GameSave` versionado, migração que lança em dado inválido, repositório que engole erro de armazenamento, autosave com debounce.
- **E2E de altíssimo valor**: 25 testes contra o build de produção, desktop + celular emulado, toque nativo via CDP e **screenshots versionados**.
- ✅ **CI verde novamente** — `PlayerView.test.tsx` foi corrigido esperando o corpo da física (`sceneHarness`) e o save parou de usar o `Storage` global do navegador no ambiente node.

### Lacunas

- ❌ **Sem i18n**, **sem áudio**, **sem axe-core**.
- ⚠️ README diz **392 testes**; a execução atual encontrou **408**.
- ⚠️ Fora da pipeline de E2E e Stryker por decisão (trabalho em andamento).

### Ações recomendadas

1. Atualizar README com o número atual de testes (392 → 408).
2. Reavaliar i18n/áudio/axe quando o trabalho atual estabilizar.
3. Reinserir `99` nas pipelines de E2E/Stryker quando fizer sentido (CI já está verde).

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
- ✅ **README atualizado** (295 testes, 8 locales, comandos de e2e/mutation).
- ✅ **E2E no GitHub Actions**.
- ✅ **Stryker na pipeline semanal** — mutation score **65.3%**, `break: 65`.
- ✅ **+21 testes** adicionados (questions, persistence/schema, levelSession).

### Lacunas

- ❌ **Sem axe-core**: contraste é verificado por testes computados, mas não há varredura WCAG automatizada.
- ❌ **Sem offline/PWA** (aceitável para o escopo atual).
- ⚠️ Mutation score 65.3% — a meta de **70%** ainda não foi atingida; `questions.ts` (45%) e `schema.ts` (60%) são os maiores gargalos.

### Ações recomendadas

1. Adicionar `@axe-core/playwright` nos E2E principais (ou documentar por que a verificação computada é suficiente).
2. Continuar matando mutantes em `questions.ts` e `schema.ts` para elevar o `break` para 70 e depois 80.

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
- ✅ **Documentação atualizada** (99 testes, 16 E2E, axe nas telas principais).
- ✅ **E2E no GitHub Actions**.
- ✅ **Stryker na pipeline semanal** — mutation score **63.5%**, `break: 60`.
- ✅ **+21 testes** adicionados (objetivos, progressão, conquistas, economia, fatos, dicas) — vários arquivos chegaram a **100%**.

### Lacunas

- ⚠️ Mutation score 63.5% — abaixo da meta de 80%; `session.ts` (34%) e `mastery.ts` (52%) são os maiores gargalos.
- ⚠️ Trabalho em andamento não commitado (nova `src/i18n/`, mudanças em áudio, `App.tsx`).

### Ações recomendadas

1. Continuar matando mutantes em `session.ts` e `mastery.ts` para elevar o `break` para 70 e depois 80.
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
| Testes unitários | 408 ✅ | 295 ✅ | 201 ✅ | 99 ✅ |
| Testes E2E Playwright | 25 | 24 | 13 | 16 |
| Mutation testing (Stryker semanal) | ❌ | ✅ 65.3% (break 65) | ✅ ≥80% | ✅ 63.5% (break 60) |
| E2E no GitHub Actions | ❌ | ✅ | ✅ | ✅ |
| CI verde hoje | ✅ | ✅ | ✅ | ✅ |
| Docs de arquitetura/decisões | ✅ | ✅ | ✅ | ✅ |
| Docs atualizadas com números atuais | ⚠️ | ✅ | ✅ | ✅ |

Legenda: ✅ atende · ➖ atende de forma diferente · ⚠️ parcial/desatualizado · ❌ não atende.

---

## Prioridade de correção (próximos passos)

1. **99 — README**: atualizar número de testes (392 → 408).
2. **cc — Stryker 70%**: matar mutantes em `questions.ts` e `schema.ts` (maior impacto no score).
3. **st — Stryker 70%**: matar mutantes em `session.ts` e `mastery.ts`.
4. **cc/99 — axe**: adicionar varredura WCAG automatizada nos fluxos principais.
5. **99 — i18n/áudio**: quando sair do escopo POC.
6. **ds — E2E**: ampliar cobertura além do arquivo `smoke.spec.ts`.
