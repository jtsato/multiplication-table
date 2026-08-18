# Boas Práticas Genéricas — Aplicações Digitais

Guia consolidado para qualquer aplicação/produto digital do repositório (vale para `99`, `cc`, `ds`, `st` e para projetos novos). O objetivo é ser **genérico**: cada item explica a prática, o porquê e onde já é aplicada neste repositório.

> Use também a [AUDITORIA.md](AUDITORIA.md) para ver o que cada projeto já cumpre e o que falta.

---

## 1. Arquitetura

### 1.1 Domínio puro, separado da UI

- Regra de ouro: **regras de negócio não conhecem React, DOM, storage nem framework**.
- Coloque funções puras e determinísticas em módulos próprios:
  - `99/src/slices/*/*.logic.ts`
  - `cc/src/domain/` e `cc/src/game/`
  - `ds/src/slices/*/*.ts`
  - `st/src/domain/`
- Trocar renderizador, framework ou backend **não deve tocar** no domínio.

### 1.2 Organização: vertical slices ou camadas explícitas

- Prefira **vertical slices**: código que muda pela mesma funcionalidade fica junto (lógica + store + UI + testes + i18n).
  - `99` e `ds` seguem esse modelo.
- Cada fatia deve ser **ponta a ponta**: lógica de negócio, interface (UI) e persistência/repositório da própria feature.
- Se o projeto for menor, uma separação explícita `domain / game / screens / ui / infrastructure` também é válida, desde que as fronteiras sejam claras.
  - `cc` e `st` seguem esse modelo.
- Evite pastas globais `components/`, `services/`, `models/` sem dono.

### 1.3 Estado mínimo e explícito

- Use a **menor solução que resolve**:
  - `useState`/`useReducer` para estado local ou de uma tela (`st`, `ds`);
  - Context para estado global compartilhado pequeno (`cc`);
  - Zustand apenas quando várias slices independentes compartilham estado (`99`).
- Prefira **reducers/funções puras** a mutações espalhadas.
- Em aplicações com atualização contínua (ex.: cenas 3D, animações), **nada contínuo passa pelo React**:
  - valores contínuos (posição, relógio, carga) → fora do React (`99` faz isso com `playerTransform` e `dayNightClock`);
  - o store só recebe eventos raros; a interface (HUD) recebe amostras com throttle.

### 1.4 Persistência com contrato e migração

- Toda persistência atrás de uma interface (`SaveRepository`, `ProgressRepository`, `ProfileRepository`).
- Nunca espalhar `localStorage`/`IndexedDB` pelas telas.
- Save **versionado** com pipeline tolerante a falhas:
  `parse → migrate → normalize`.
- Fallback em memória quando storage indisponível.
- Exemplos no repo: `cc/src/persistence/`, `ds/src/slices/save-game/`, `st/src/infrastructure/storage/`.

### 1.5 Determinismo e RNG injetado

- Todo comportamento aleatório passa por um gerador **injetado**: produção usa `Math.random`, testes usam seed.
- Isso torna seleção de conteúdo, alternativas, agendamento e ordem de itens **reproduzíveis**.
- Exemplos: `99/src/shared/rng.ts`, `cc/src/domain/rng.ts`, `st/src/domain/math/rng.ts`.

---

## 2. Implementação

### 2.1 TypeScript strict + ferramentas

- TypeScript `strict` desde o dia 1.
- ESLint (flat config) + Prettier como baseline.
- Scripts padronizados:
  - `dev`, `build`, `preview`, `test`, `typecheck`, `lint`, `format`, `format:check`, `ci`.
- `package-lock.json` **versionado**; instalações reproduzíveis com `npm ci`.
- `ci` deve rodar: `lint → typecheck → test → build` (+ `audit` e `e2e` quando viável).
- Versões críticas **pinadas** quando o ecossistema quebra (ex.: `React ~19.2.8` no `99` por causa do peer do R3F).

### 2.2 Testes — pirâmide e TDD

- **TDD (RED → GREEN → REFACTOR)**: escreva os testes unitários/de integração **antes** de implementar a lógica de negócio; o teste deve falhar primeiro.
- **Unitários**: domínio puro, reducers, algoritmos (a maior parte).
- **Integração**: fluxos reais montando o app (`App.test.tsx`, testes de slice).
- **E2E**: Playwright contra o **build de produção** (`vite preview`), não contra dev server; cobrir os fluxos críticos de usuário.
- **Mutation testing** (Stryker) para validar a eficácia da suíte e a resiliência contra regressões (`ds` já usa).
- Teste o comportamento, não detalhes internos.

### 2.3 i18n desde o primeiro componente

- Nenhum texto de usuário hardcoded.
- Chaves **tipadas** (`MessageKey = DotPath<typeof ptBR>`).
- Paridade entre locales garantida por teste (as mesmas chaves nos dois sentidos).
- Solução própria mínima é aceitável (cc, ds, st usam soluções próprias); lib externa só se precisar de plural/contexto avançado.
- **Formatos de data, número e moeda** devem usar APIs nativas (`Intl.NumberFormat`, `Intl.DateTimeFormat`) parametrizadas pelo locale — nunca formatar manualmente com suposições do pt-BR.
- `99` ainda não tem i18n — é uma lacuna para quando sair do pt-BR fixo.

### 2.4 Acessibilidade (WCAG 2.2 AA)

- HTML semântico: `<button>`, `<fieldset>`, `<dialog>`, landmarks.
- Teclado completo: Tab, Enter, Space, Escape; sem armadilhas de foco.
- Foco visível forte (≥3px, contraste alto, não só cor).
- Contraste: 4.5:1 texto, 3:1 texto grande; alvos de toque ≥44–48px.
- Feedback nunca **só cor** nem **só som**.
- `prefers-reduced-motion` + preferência interna de movimento reduzido.
- Verificação automatizada com `@axe-core/playwright` (`ds`, `st`) ou testes computados de contraste (`cc`).
- Zoom até 200% sem perda de funcionalidade.

### 2.5 Performance

- Evitar re-render por quadro: estado contínuo fora do React.
- `useFrame` lê `getState()`, nunca hook seletor por quadro.
- Throttle de HUD para valores contínuos.
- Reaproveitar objetos/instâncias em loops (Three: `InstancedMesh`, `Vector3` reaproveitado).
- Carga: `React.lazy` + tela de carregamento para chunks pesados (`99` faz isso com o canvas 3D).
- Medir bundle e separar chunks quando necessário.

### 2.6 Dependências: atualização e vulnerabilidades

- **Lockfile versionado e instalação reproduzível**: commitar `package-lock.json` e usar `npm ci` em CI/deploy, nunca `npm install` em fluxo de build.
- **Verificação periódica de atualizações**: rodar `npm outdated` para enxergar o que está atrasado; manter uma política explícita de atualização (ex.: subir para `latest` estável validado pelos gates, com exceções documentadas por compatibilidade).
- **Auditoria de vulnerabilidades**: `npm audit` (ou `npm audit --omit=dev` para produção) deve rodar no CI ou antes de cada merge; meta: **0 vulnerabilidades conhecidas**.
- **Triagem documentada**: quando um pacote transitivo tiver problema sem correção, registrar a decisão (ex.: `overrides` no `package.json`, como o `ds` faz com `qs@6.15.3`) e justificar por que a versão não pode subir.
- **Pinagem estratégica**: usar `~` em versões que o peer exige (`React ~19.2.8` no `99`); `^` é aceitável para o restante desde que os gates validem.
- **Atualizar com segurança**: upgrade → rodar `lint + typecheck + test + build + e2e` antes de subir; quando possível, atualizar um pacote por vez.
- **Menos dependências, menos superfície de ataque**: cada lib nova precisa de justificativa (ver seção 4).

### 2.7 Lint e formatação

- ESLint flat config + Prettier como parte do `ci`; o CI deve falhar com erros e, idealmente, também com warnings.
- Regras úteis para React: `react-hooks`, `react-refresh/only-export-components` e `eslint-config-prettier` para evitar conflito com o Prettier.
- `npm run format:check` no CI para impedir drift de formatação — não basta `format` local.
- Não usar `eslint-disable` em código de produção sem comentário justificando.
- Manter **zero warnings**: warning hoje vira erro amanhã (ex.: o `cc` tem 2 warnings de `react-refresh` — candidatos a correção).

### 2.8 Testes E2E com Playwright

- Rodar contra o **build de produção** servido por `vite preview` — o mesmo artefato do deploy.
- Projetos separados por dispositivo: desktop + celular emulado (`devices['Pixel 5']`, etc.).
- Fixar `locale` do navegador nos testes para não depender do sistema da máquina/CI.
- Configurar `trace`/`video`/`screenshot` em falha para depuração.
- **Screenshots versionados** para inspeção visual de regressões (`99` faz isso em `e2e/telas/`).
- Integrar `@axe-core/playwright` nos fluxos principais para acessibilidade (`ds`, `st`).
- Cobrir: golden path, persistência (reload), teclado, mobile e offline quando aplicável.
- **Incluir E2E no CI** — hoje os projetos têm E2E local, mas o workflow GitHub Actions não roda `test:e2e`.

### 2.9 Código limpo

- **Nomes expressivos**: variáveis, funções e tipos com intenção clara; evite abreviações obscuras e nomes genéricos (`data`, `temp`, `handler`).
- **Funções pequenas** com uma única responsabilidade; extraia quando o nome precisar de "e".
- Sem código morto: imports não usados, branches inalcançáveis, parâmetros sem uso e TODOs permanentes.
- **DRY com moderação**: duplicação barata é melhor que abstração prematura; aplique YAGNI e KISS.
- Comentários explicam **o porquê**, não **o quê** — o código deve ser autoexplicativo.
- **Código todo em inglês**: identificadores, tipos, funções, nomes de arquivos, comentários e mensagens de commit em inglês; apenas textos exibidos ao usuário ficam no i18n.
- **Definition of Done** inclui revisão de código, lint/format verdes e testes passando.

### 2.10 UX para IA: streaming, feedback e Human-in-the-Loop

- **Streaming de respostas generativas**: sempre que uma resposta for gerada por IA, entregue por streaming com estados claros de carregamento/progresso (skeleton, `aria-busy`, indicador de progresso, botão de cancelar/repetir).
- **Feedback contínuo**: o usuário nunca deve ficar sem saber se o sistema está processando, aguardando ou pronto.
- **Acessibilidade no streaming**: conteúdo incremental deve ser anunciado com `aria-live` de forma não poluente; nada de depender de tempo para entender.
- **Human-in-the-Loop**: ações críticas (excluir progresso, resetar save, compra irreversível, enviar dado externo) exigem confirmação explícita do usuário, com descrição do efeito e opção de cancelar.
- **Nunca executar ação crítica no mesmo gesto que a abriu**: usar `dialog`/`confirm` acessível, com foco gerenciado e retorno ao gatilho.
- **Sem bloqueio**: streaming e confirmação não podem travar o fluxo principal da aplicação; permita continuar usando ou cancelar a qualquer momento.

---

## 3. UI/UX (experiência do usuário)

### 3.1 Fluxo principal claro e curto

- Ciclos de uso curtos (ex.: 3–6 minutos).
- O usuário sempre sabe: o que estou fazendo, por que, o que vem depois.
- Exemplos: `st` (5–6 clientes por dia), `99` (ciclo de 5 minutos).

### 3.2 Erro nunca é punição

- Errar deve **ajudar**: mensagem construtiva, ajuda progressiva, recompensa parcial.
- Nunca: perder progresso, zerar recompensas, exigir sequência perfeita, humilhar, impor cronômetro.
- Exemplos: `99` (erro rende 25% da colheita), `st` (4 níveis de pista e solução final).

### 3.3 Progresso visível no produto, métricas nos bastidores

- Progresso percebido por **mudança visível no produto** (loja cresce, ilha ganha casa), não por "Domínio: 71%".
- Conquistas e metas não exigem perfeição ("acerte 10 seguidas" é proibido).

### 3.4 Contextualização, não exercício decorado

- O conteúdo aparece dentro do contexto do produto (ex.: calcular uma compra na loja), não como exercício isolado.
- O que a interface afirma deve ser verificável na própria interface.
- Exemplo: `99` deriva `itemPlacements` e `generateChallenge` do mesmo `node.groups`.

### 3.5 Feedback imediato e específico

- Curto, positivo, com o resultado explícito (ex.: "✓ R$ 42 — certo!").
- Celebrações grandes reservadas para marcos (novo produto, capítulo, conquista).

### 3.6 Controles contextuais

- Mobile: mostrar só os controles que fazem sentido no momento.
- Todas as ações funcionam por clique, toque e teclado.
- Exemplo: `99` tem joystick + botões contextuais + mesmas ações semânticas do teclado.

### 3.7 Áudio e narração opcionais

- Separar música, efeitos e narração; cada um com volume/on-off persistente.
- Nenhuma informação essencial depende de som.
- `cc` e `st` sintetizam áudio com Web Audio API; `st` tem narração via TTS opcional.

### 3.8 Offline-first (quando fizer sentido)

- Service Worker com cache versionado.
- Persistência local (IndexedDB) com aviso de atualização.
- Exemplo: `st` implementa offline após o primeiro carregamento completo.

---

## 4. Libs — escolha a menor que resolve

| Necessidade | Recomendação | Quando evitar |
| --- | --- | --- |
| Base | React + TypeScript strict + Vite | — |
| Estado | `useState`/`useReducer`; Context; Zustand só se necessário | Redux sem necessidade |
| Testes | Vitest + Testing Library + Playwright | — |
| Segurança/atualização | `npm audit` + `npm outdated` + lockfile versionado | ignorar avisos sem triagem documentada |
| A11y automatizada | `@axe-core/playwright` | — |
| Renderização | DOM/SVG/CSS sempre que possível | motor especializado (ex.: 3D) só quando necessário |
| 3D/física | R3F + Three + Rapier (`99`) | — |
| Persistência | Wrapper próprio sobre localStorage/IndexedDB | lib só se precisar de sync/criptografia |
| i18n | Solução própria mínima | lib pesada sem necessidade |
| UI kit | CSS Modules/tokens próprios | Framework UI pesado |
| Offline | Service Worker próprio | — |

Regra geral: **cada dependência nova precisa de justificativa**. Se a solução caseira for ~50–100 linhas e coberta por teste, geralmente é melhor (i18n, storage, formatação).

---

## 5. Checklist mínimo para qualquer aplicação nova

- [ ] TypeScript strict + ESLint + Prettier configurados antes do código
- [ ] Domínio puro separado de UI/storage
- [ ] Estado gerenciado com a menor solução que funciona
- [ ] i18n com chaves tipadas, teste de paridade e formatos `Intl` (data/moeda)
- [ ] Persistência com schema versionado + migração + fallback
- [ ] Acessibilidade: semântica, teclado, foco, contraste, reduced-motion
- [ ] TDD: testes antes da lógica (RED → GREEN → REFACTOR)
- [ ] Testes: unitários da lógica + integração do fluxo + E2E do golden path
- [ ] Playwright E2E contra o build de produção (desktop + mobile), com axe nos fluxos principais
- [ ] CI: lint → typecheck → test → build (+ `audit` e `e2e` quando viável)
- [ ] `package-lock.json` versionado e instalação com `npm ci`
- [ ] `npm audit` sem vulnerabilidades conhecidas (ou triagem documentada)
- [ ] `npm outdated` verificado com política de atualização
- [ ] ESLint sem warnings e `format:check` no CI
- [ ] Código limpo: nomes expressivos, funções pequenas, sem código morto
- [ ] Código em inglês (identificadores, comentários, commits); textos de UI via i18n
- [ ] Streaming com estados de carregamento/progresso (quando houver IA)
- [ ] Human-in-the-Loop: confirmação explícita em ações críticas
- [ ] Feedback construtivo: erro ajuda, nunca pune
- [ ] Performance: nada contínuo passando por estado React
- [ ] Screenshots nos E2E para inspeção visual de regressões
- [ ] Docs: README com stack, arquitetura, comandos e decisões

---

## 6. Referências no repositório

| Documento | Conteúdo |
| --- | --- |
| [AUDITORIA.md](AUDITORIA.md) | Comparativo de boas práticas nos 4 projetos e lacunas |
| `99/docs/decisoes.md` | Registro de decisões técnicas do 99 |
| `st/docs/ARCHITECTURE.md` | Arquitetura do st |
| `st/docs/ACCESSIBILITY.md` | Cobertura de acessibilidade do st |
| `st/docs/ADAPTIVE-MATH.md` | Motor matemático adaptativo do st |
| `ds/IMPLEMENTATION_PLAN.md` | Contrato técnico e quality gates do ds |
