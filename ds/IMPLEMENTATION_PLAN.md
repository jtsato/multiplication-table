# IMPLEMENTATION_PLAN.md — Batalha da Tabuada (POC)

Plano de implementação do jogo **Batalha da Tabuada**: um jogo educacional de
batalha por turnos onde o herói resolve multiplicações para atacar monstros
(slime, etc.). Roda 100% no navegador, sem backend.

Este documento é o contrato técnico do projeto. Nenhuma slice é implementada
antes de este plano estar coerente (regra 1 da estratégia).

---

## 1. Stack

| Camada       | Tecnologia                                        | Justificativa                                |
| ------------ | ------------------------------------------------- | -------------------------------------------- |
| Build        | Vite 7 + TypeScript 5.9 (strict)                  | Início rápido, TS strict obrigatório         |
| UI           | React 19 + DOM                                    | acessibilidade nativa (axe-core, TAB/ENTER)  |
| Testes unit. | Vitest 3 + Testing Library + jsdom                | rápidos, determinísticos                     |
| Testes E2E   | Playwright 1.55 + @axe-core/playwright            | Golden path + varredura WCAG                 |
| Mutation     | StrykerJS 10 (vitest-runner + typescript-checker) | quality gate de lógica crítica               |
| Lint/Format  | ESLint 9 flat config + Prettier 3                 | consistência + erros comuns                  |
| i18n         | Solução própria mínima (sem lib)                  | política de dependências: não precisa de lib |
| Persistência | `localStorage` via interface de repositório       | POC sem backend; interface permite troca     |

**Política de versões:** pinamos o conjunto comprovado do projeto irmão `st/`
(React 19.1, Vite 7.1, Vitest 3.2, Playwright 1.55, ESLint 9, TS 5.9) e Stryker 10. Nada de "latest" de major novo sem validação (regra 29).

---

## 2. Princípios arquiteturais

1. **Vertical Slice Architecture** — código que muda pela mesma funcionalidade
   fica próximo. Proibido separar por `components/`, `services/`, `models/`.
2. **TDD** — RED → GREEN → REFACTOR para toda lógica relevante. Teste escreve
   comportamento, não detalhes internos.
3. **i18n desde o primeiro componente** — nenhum texto de usuário hardcoded.
4. **WCAG 2.2 nível AA** desde o primeiro componente.
5. **Quality Gates automatizados** — uma slice só fecha com todos os gates
   verdes (regra 26).

---

## 3. Estrutura de diretórios

```
src/

  app/
    bootstrap/            # main.tsx (entrada da aplicação)
    App.tsx               # composição das telas (state-based, sem router)
    App.test.tsx

  slices/
    battle/               # BattleState, reducer, BattleScene.tsx
    math-question/        # geração de multiplicação + alternativas
    player-attack/        # ataque do herói
    monster-turn/         # reação do inimigo ao erro
    combo/                # sequência de acertos
    super-attack/         # recompensa dos 3 acertos
    rewards/              # recompensas (XP/estrelas)
    progression/          # sequência de monstros e tabuadas
    adaptive-review/      # reforço das multiplicações difíceis
    save-game/            # repository + local-storage.repository
    achievements/         # conquistas

  shared/
    i18n/                 # locales, t(), I18nProvider
    accessibility/        # SkipLink e utilitários a11y
    ui/                   # componentes visuais reaproveitáveis
    game/                 # tipos/constantes compartilhados (HP, dano)
    test/                 # setup do Vitest + helpers de render
    styles/               # global.css (tokens, focus, reduced-motion)
```

Cada slice tem o formato: `slice.ts` (domínio puro), `slice.types.ts`,
`slice.test.ts`, `SliceScene.tsx` (UI colocalizada). Domínio puro = sem React,
determinístico, RNG injetado.

---

## 4. Slices e ordem de implementação

| #   | Slice           | Entrega                                               | Depende de |
| --- | --------------- | ----------------------------------------------------- | ---------- |
| 0   | Foundation      | tooling, i18n, a11y base, gates, app mínimo           | —          |
| 1   | Battle Shell    | herói, slime, HP, HUD acessível                       | 0          |
| 2   | Math Attack     | multiplicação → alternativas → acerto → ataque → dano | 1          |
| 3   | Monster Turn    | erro + reação do inimigo                              | 2          |
| 4   | Combo           | sequência de acertos                                  | 3          |
| 5   | Super Attack    | recompensa pelos 3 acertos                            | 4          |
| 6   | Vitória         | final completo da batalha                             | 5          |
| 7   | Save Game       | persistência + migração do save                       | 6          |
| 8   | Progressão      | sequência de monstros e tabuadas                      | 7          |
| 9   | Adaptive Review | reforço automático das difíceis                       | 8          |

**Regra de ouro:** cada slice nasce completa (lógica + UI + testes + a11y +
i18n + E2E principal). Nada de domínio inteiro primeiro e UI depois (regra 28).

---

## 5. Contratos públicos (domínio puro)

### math-question

```ts
generateQuestion(tables: number[], rng: Rng): MultiplicationFact // { a, b, answer }
generateAlternatives(fact: MultiplicationFact, rng: Rng, count?: number): number[]
// distratores: valores próximos (±1, ±a, ±b), sem duplicatas, não negativos
```

### battle

```ts
type BattlePhase = "intro" | "question" | "hero-turn" | "monster-turn" | "victory" | "defeat";
interface BattleState {
  phase: BattlePhase;
  hero: { hp: number; maxHp: number };
  monster: { id: string; nameKey: MessageKey; maxHp: number; hp: number };
  combo: number;             // acertos consecutivos
  superReady: boolean;       // combo >= 3
  question: MultiplicationFact;
  alternatives: number[];
  log: BattleLogEntry[];     // mensagens i18n (chaves + params)
}
battleReducer(state: BattleState, action: BattleAction): BattleState
// ações: ANSWER(value), USE_SUPER_ATTACK(), START_BATTLE(monster, tables)
```

### combo / super-attack

```ts
nextCombo(current: number, correct: boolean): number // reset p/ 0 no erro
canUseSuper(combo: number): boolean                  // combo >= 3
superAttackDamage(base: number, combo: number): number
```

### player-attack / monster-turn

```ts
playerAttackDamage(base: number): number
takeMonsterTurn(heroHp: number, monster: MonsterSpec): number // novo HP
```

### rewards / progression / adaptive-review

```ts
computeRewards(correct: number, superUsed: boolean): Rewards
nextMonster(progress: Progress): MonsterSpec
nextTables(progress: Progress): number[]
pickFact(facts: FactStats[], rng: Rng): MultiplicationFact // peso = erro/idade
```

### save-game

```ts
interface SaveRepository { save(state: GameSave): void; load(): GameSave | null; }
// GameSave v1: { version: 1, locale, progress, mastery, achievements }
migrateSave(raw: unknown): GameSave  // rejeita versões desconhecidas
```

---

## 6. Estratégia de estado

- **Domínio puro:** funções/reducers sem efeitos colaterais em `src/slices/*`.
  Testáveis e alvo do Stryker.
- **UI:** `App.tsx` mantém o `BattleState` via `useReducer(battleReducer)` e
  passa handlers para as cenas. Nenhuma biblioteca de estado externa (não há
  necessidade na POC — regra 29).
- **RNG:** injetado (`rng: () => number`); o código de produção usa
  `Math.random`, os testes usam gerador determinístico.

---

## 7. Persistência

- `save-game/repository.ts` define a interface `SaveRepository`.
- `local-storage.repository.ts` implementa com `localStorage` (chave
  `batalha-da-tabuada.save`), com schema versionado (`GameSave.version`).
- `migrateSave` valida e migra versões antigas; falha explícito para versões
  desconhecidas.
- i18n persiste `locale` em `localStorage` (chave `batalha-da-tabuada.locale`).
- Save real só na Slice 7, mas a interface nasce na Slice 0 (vazia até lá não —
  a interface chega com a Slice 7; o locale é a única persistência na Slice 0).

---

## 8. i18n

- Locales: `pt-BR` (padrão) e `en-US`, em JSON com namespaces semânticos
  (`battle.attack`, `math.question`, `monster.slime`).
- `shared/i18n/i18n.ts`: `translate(messages, key, params)` puro +
  `t("namespace.key", { a, b })` com interpolação `{{a}}`.
- **Paridade garantida 2x:**
  1. Tempo de compilação: `enUS satisfies typeof ptBR`.
  2. Runtime (CI): teste compara chaves profundas dos dois locales nos dois
     sentidos — falha se faltar chave obrigatória (regra 8).
- Chaves tipadas: `MessageKey = DotPath<typeof ptBR>` — erro de compilação para
  chave inexistente. Proibido chaves `text1`/`label2` (regra 7).
- Sem lib externa: a solução é ~80 linhas e cobre o necessário (regra 29).

---

## 9. Acessibilidade (WCAG 2.2 AA)

| Requisito            | Implementação                                                                   |
| -------------------- | ------------------------------------------------------------------------------- |
| Teclado              | Alternativas são `<button>`s; atalhos opcionais `1..4`; TAB/ENTER/SPACE nativos |
| Foco visível         | `:focus-visible` com contraste ≥ 3:1 em todos os controles                      |
| Ordem lógica         | landmarks (`header`/`main`/`footer`), DOM na ordem de leitura                   |
| Contraste            | tokens de cor com ratio ≥ 4.5:1 (texto)                                         |
| Escalável            | `rem` em tudo; sem bloqueio de zoom                                             |
| Touch                | alvos ≥ 44×44px                                                                 |
| Nomes acessíveis     | `aria-label`/texto em todos os controles                                        |
| Feedback não só cor  | ícone + texto + animação + som opcional (✓ "Correto!" / "Quase! 6 × 4 = 24")    |
| Flashes              | sem animações estroboscópicas                                                   |
| Movimento reduzido   | `@media (prefers-reduced-motion: reduce)` reduz shake/zoom/partículas           |
| Tecnologia assistiva | `aria-live="polite"` para resultados e mudanças de HP; skip link                |

## 10. Estratégia de testes

Pirâmide (regra 23): maioria unitários rápidos; E2E valida jornadas; Stryker
mede a qualidade sobre regras críticas.

- **Unit (Vitest + Testing Library):** todo domínio puro + componentes de UI.
- **E2E (Playwright):** `e2e/` — golden path (regra 16) + cenários de
  persistência, idioma, teclado, erro e progressão (regra 17).
- **axe-core (@axe-core/playwright):** varredura nas telas principais (menu,
  mapa, batalha, vitória, configurações) — falha em violações serious/critical
  (regra 18).
- **Mutation (Stryker):** alvo `>= 80%` de mutation score nos módulos
  críticos: `math-question`, `battle`, `combo`, `super-attack`, `progression`,
  `adaptive-review` (regra 22). Config cresce a cada slice.

---

## 11. Quality Gates

```bash
npm run lint            # ESLint
npm run typecheck       # tsc -b --pretty false
npm run test            # Vitest (unit)
npm run test:e2e        # Playwright (build + preview)
npm run test:mutation   # Stryker (lógica crítica)
npm run build           # tsc -b && vite build
npm run validate        # lint + typecheck + test + build (ciclo local rápido)
```

Gates lentos (e2e, mutation) ficam fora do `validate` (regra 25), mas são
obrigatórios no fechamento de slice (regra 26).

---

## 12. Definição de pronto (regra 27)

1. comportamento implementado; 2. teste escrito antes (quando aplicável);
2. teste observado falhando; 4. implementação faz passar; 5. regressões verdes;
3. strings em i18n; 7. pt-BR funciona; 8. en-US funciona; 9. teclado funciona;
4. WCAG relevante considerado; 11. Playwright cobre fluxo importante;
5. build passa; 13. typecheck passa; 14. lint passa; 15. console sem erros.

---

## 13. Detalhamento — Slice 0 (Foundation)

**Goal:** aplicação mínima inicia, i18n e a11y bases existem, todos os gates
funcionam de ponta a ponta (incluindo Stryker e axe-core).

**Arquitetura:** tooling + `shared/i18n` + `shared/accessibility` +
`shared/styles` + `app/App.tsx` mínimo. Sem lógica de jogo ainda.

**Arquivos:**

```
package.json, tsconfig*.json, vite.config.ts, vitest.config.ts,
playwright.config.ts, stryker.config.json, eslint.config.js,
.prettierrc.json, index.html,
src/main.tsx, src/app/App.tsx, src/app/App.test.tsx,
src/shared/i18n/{i18n.ts, i18n.test.ts, locale.types.ts, I18nProvider.tsx,
  I18nProvider.test.tsx, locales/pt-BR.json, locales/en-US.json},
src/shared/accessibility/SkipLink.tsx, src/shared/accessibility/SkipLink.test.tsx,
src/shared/test/{setup.ts, render.tsx}, src/shared/styles/global.css,
e2e/smoke.spec.ts
```

**Critérios de aceite:**

- `npm run validate` passa (lint + typecheck + test + build).
- `npm run test:e2e` passa: app abre em pt-BR, troca para en-US, reload mantém.
- `npm run test:mutation` passa com score ≥ 80% em `shared/i18n/i18n.ts`.
- axe-core não reporta violações serious/critical na tela inicial.
- Navegação da tela inicial inteira por teclado; skip link funciona.
- Nenhum texto de usuário hardcoded em componentes (tudo via `t()`).

**Testes a escrever:** `i18n.test.ts` (tradução, interpolação, chave ausente,
paridade pt-BR/en-US), `I18nProvider.test.tsx` (locale padrão, troca,
persistência), `App.test.tsx` (título, troca de idioma, aria-pressed),
`SkipLink.test.tsx` (href, foco). E2E `smoke.spec.ts`.

**A11y:** skip link, foco visível, landmarks, reduced-motion, contraste,
alvos ≥ 44px, `aria-live` (reservado para batalha na Slice 1).

**i18n:** namespaces `app.*` e `lang.*`; pt-BR padrão; persistência do locale.

---

## 14. Política de dependências (regra 29)

Antes de instalar: resolve problema real? manutenido? tamanho? impacto no
browser? acessível quando aplicável? — A POC evita libs supérfluas (sem
react-router, sem lib de estado, sem lib de i18n, sem lib de animação).

---

## 15. Riscos e decisões registradas

| Decisão                          | Motivo                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `e2e/` (e não `tests/e2e/`)      | convenção já existente no repo (st/, 99/); Playwright testDir aponta para lá |
| React + DOM (e não Phaser)       | requisitos WCAG/axe-core exigem DOM real (regras 9–13)                       |
| i18n própria (sem i18next)       | ~80 linhas cobrem a necessidade; evita dependência (regra 29)                |
| Sem react-router                 | POC tem poucas telas; `App` com state é suficiente                           |
| Stryker apenas em lógica crítica | executar em arquivo visual é custo sem valor (regra 19)                      |
