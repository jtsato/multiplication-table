# Ilhas da Tabuada

Um jogo educacional infantil para aprender a tabuada (2 a 10) explorando e
construindo um arquipélago de ilhas feitas de blocos. Roda inteiramente no
navegador, sem backend, sem login e sem banco de dados remoto.

## Objetivo

Cada ilha representa uma tabuada. A criança resolve multiplicações para
construir pontes, torres, faróis, casas e outras estruturas de blocos —
a matemática muda o mundo em vez de aparecer como uma prova escolar. Ao
concluir as missões de uma ilha, a próxima tabuada é liberada.

## Stack

- **React 19 + TypeScript (strict)** para a UI.
- **Vite** para build e dev server.
- **SVG + CSS, sem Phaser.** O jogo não tem física, colisão nem sprites
  animados quadro a quadro — é pergunta → construção reage. Um motor de jogo
  full-blown adicionaria complexidade (ciclo de vida imperativo, canvas
  separado da árvore do React, perda de foco/teclado nativo) sem trazer nada
  que o React declarativo + SVG não resolva melhor para este caso. Toda a
  arte é gerada em código (`src/art`, `src/domain/islands.ts`), sem imagens
  externas.
- **Vitest + Testing Library** para testes unitários e de integração.
- **Playwright** para E2E contra o build de produção (desktop + celular).
- **Stryker** para mutation testing da lógica crítica (agendado semanalmente no CI).
- **ESLint + Prettier** para qualidade e formatação de código.

## Instalação e desenvolvimento

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # build de produção em dist/
npm run preview    # serve o build de produção localmente
npm run test        # roda a suíte de testes uma vez
npm run test:watch  # roda os testes em modo watch
npm run e2e         # testes ponta a ponta (Playwright)
npm run test:mutation # mutation testing (Stryker)
npm run typecheck   # apenas checagem de tipos
npm run lint         # ESLint
npm run format       # Prettier (escreve)
npm run format:check # Prettier (só verifica)
```

## Arquitetura

```
src/
  domain/        # regras de jogo puras — sem React, sem DOM, sem storage
  game/           # máquina de estados de UMA missão (levelSession)
  art/            # componentes SVG: avatar, cenários, mascote, decoração
  audio/          # efeitos sonoros sintetizados (Web Audio API)
  i18n/           # tradução, detecção de idioma, arquivos de locale
  persistence/    # storageService, schema, migrações, repositório
  state/          # GameProvider — dono do GameState em memória
  screens/        # uma tela por arquivo, monta as peças de domain/art/ui
  ui/             # componentes de interface genéricos (Button, Stars, ...)
  styles/         # CSS global
```

A regra principal: **domínio não conhece UI, UI não conhece storage.**
`src/domain` só teria que mudar se as regras do jogo mudassem — trocar o
motor de renderização, o framework, ou o backend de persistência não toca
nele. Esse é o motivo de haver ~274 testes cobrindo `domain/`, `game/`,
`art/scenes` e `persistence/` isoladamente antes de qualquer tela existir.

### Fluxo de uma missão

```
LevelScreen (React)
  └─ chama funções puras de src/game/levelSession.ts
       └─ createQuestion (src/domain/questions.ts)
            └─ selectNextFact (src/domain/review.ts) — revisão adaptativa
       └─ SceneView (src/art/SceneView.tsx) desenha os blocos já revelados
```

`LevelScreen` não sabe nada de regra de jogo: ela renderiza um `LevelState`
e chama `submitAnswer`/`advance`/`retryQuestion`, que são funções puras
100% testadas em `src/game/levelSession.test.ts`.

## Persistência

Tudo fica em `localStorage`, atrás de duas camadas:

- **`storageService`** (`src/persistence/storageService.ts`) — o único
  lugar do projeto que toca em `localStorage` de verdade. Detecta se o
  storage está disponível (modo anônimo, cookies bloqueados, quota
  zerada) e cai para um storage em memória sem quebrar o jogo.
- **`ProgressRepository`** (`src/persistence/ProgressRepository.ts`) — a
  interface que as telas e o `GameProvider` conhecem. A implementação do
  MVP é `LocalStorageProgressRepository`; para trocar por uma API no
  futuro, basta escrever um `ApiProgressRepository` com o mesmo contrato
  (`load`/`save`/`clear`, ambos assíncronos desde já) e injetá-lo em
  `<GameProvider repository={...}>` — nenhuma tela muda.

O estado salvo é versionado:

```ts
{
  schemaVersion: (1, player, settings, progress, statistics, achievements);
}
```

Ao carregar, o save passa por três etapas, cada uma tolerante a falha:
`JSON.parse` → `migrate` (`src/persistence/migrations.ts`, leva o schema de
qualquer versão antiga até a atual) → `normalizeState`
(`src/persistence/schema.ts`, repara campos corrompidos ou ausentes campo a
campo, sem nunca lançar exceção). No pior caso o jogo volta para o estado
padrão; no caso comum, ele aproveita o máximo possível do save.

### Adicionando uma migração de schema

1. Suba `CURRENT_SCHEMA_VERSION` em `src/domain/defaultState.ts`.
2. Adicione a entrada correspondente em `MIGRATIONS` em
   `src/persistence/migrations.ts` (recebe e devolve JSON cru).
3. `normalizeState` já valida o resultado — normalmente não precisa mudar.

## Internacionalização

Oito idiomas hoje: `pt-BR`, `en-US`, `de-DE`, `es-ES`, `fr-FR`, `ja-JP`,
`ko-KR` e `zh-CN`, em `src/i18n/locales/*.json`. Nenhum
texto fica hardcoded em componente — tudo passa por `t('chave.aninhada')`
via `useTranslation()`. Um teste (`translate.test.ts`) garante que todos os
arquivos têm exatamente as mesmas chaves e que todo conteúdo do jogo
(ilhas, missões, conquistas, opções de personagem) tem tradução em todos os
idiomas.

### Adicionando um idioma

1. Crie `src/i18n/locales/<tag>.json` copiando `en-US.json` como molde.
2. Registre a tag em `SUPPORTED_LOCALES` (`src/domain/types.ts`) e no mapa
   `DICTIONARIES` (`src/i18n/translate.ts`).
3. Rode `npm test` — a checagem de cobertura de chaves aponta o que faltou.

Trocar de idioma nas configurações não afeta progresso, personagem nem
estatísticas — é só a camada de apresentação.

## Adicionando uma tabuada nova

O jogo cobre 2–10 por padrão (`TABLES` em `src/domain/facts.ts`). Para uma
tabuada extra (ex: o 11):

1. Adicione o número a `TABLES`.
2. Defina o bioma em `BIOME_BY_TABLE`, a paleta em `PALETTES` e a posição no
   mapa em `MAP_POSITIONS`, todos em `src/domain/islands.ts`.
3. Defina as missões da ilha em `MISSION_LAYOUT`, em `src/domain/missions.ts`
   (3 missões regulares + 1 desafio final, por convenção).
4. Adicione as chaves de tradução `islands.<n>.name` / `.biome` em todos os locales.
5. `createInitialProgress` e a checagem de cobertura de testes já cobrem
   qualquer tabuada nova automaticamente — não é preciso editar mais nada.

## Adicionando uma missão (construção) nova

1. Adicione o tipo em `SceneType` (`src/domain/missions.ts`).
2. Implemente o desenho dos blocos em `src/art/scenes.ts`: uma função que
   devolve uma lista ordenada de blocos numa grade (veja `bridgeBlocks` como
   referência simples). A ordem da lista é a ordem em que os blocos aparecem
   conforme a criança acerta perguntas.
3. Adicione as chaves `missions.<scene>.title` / `.brief` / `.done` em todos os locales.
4. Use o novo tipo em `MISSION_LAYOUT`.

## Testes

```bash
npm test
```

- `src/domain/**/*.test.ts` — geração de perguntas e distratores, cálculo de
  domínio (mastery), algoritmo de revisão adaptativa, progressão e
  desbloqueio de ilhas.
- `src/game/levelSession.test.ts` — a máquina de estados de uma missão
  completa, incluindo o caso de erro repetido revelando a resposta.
- `src/art/scenes.test.ts` — toda cena tem blocos suficientes para o número
  de perguntas da missão e nenhum bloco fica fora do quadro.
- `src/persistence/persistence.test.ts` — storage indisponível, JSON
  corrompido, migração de schema antigo, reparo de campos inválidos, ciclo
  completo de salvar/recarregar.
- `src/i18n/translate.test.ts` — paridade de chaves entre os dois idiomas e
  cobertura de todo o conteúdo do jogo.
- `src/App.test.tsx` — teste de integração que monta o `<App/>` de verdade
  (sem mocks de estado) e simula o fluxo de uma criança: escolher idioma,
  criar personagem, jogar uma missão inteira (acerto e erro), ver as
  conquistas desbloqueadas e confirmar que fechar e reabrir o jogo continua
  de onde parou.

## Notas de implementação

- **Sem Phaser**: ver justificativa na seção Stack.
- **Sem assets externos**: personagem, cenário, mascote e ícone de ilha são
  todos SVG gerado por código (`src/art/`), com cores vindas da paleta de
  cada bioma (`src/domain/islands.ts`). Nenhuma referência visual, nome ou
  som de outros jogos.
- **Áudio**: efeitos e a trilha de fundo são sintetizados em tempo real com
  a Web Audio API (`src/audio/audioService.ts`) — não há arquivos de áudio
  no projeto. Música e efeitos podem ser desligados separadamente nas
  configurações; nenhuma informação do jogo depende de som para ser
  entendida.
- **Revisão adaptativa**: `src/domain/review.ts` combina peso (contas com
  domínio baixo ou erradas recentemente aparecem mais) com um cooldown que
  proíbe repetir as últimas 3 perguntas — sem isso, a criança veria a mesma
  conta repetida seguidas vezes.
