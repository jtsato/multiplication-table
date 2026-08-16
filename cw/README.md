# Bloquilha

Jogo educacional infantil de tabuada, 2D, feito de blocos, rodando inteiramente no navegador.
A criança explora um arquipélago onde **cada ilha é uma tabuada** e cada resposta correta
coloca um bloco no mundo: reconstrói uma ponte, ergue uma torre, acende um farol.

Sem instalação, sem backend, sem login, sem banco de dados. Todo o progresso fica no
`localStorage` do próprio navegador.

---

## Índice

- [Objetivo](#objetivo)
- [Stack](#stack)
- [Instalação](#instalação)
- [Desenvolvimento](#desenvolvimento)
- [Build](#build)
- [Testes](#testes)
- [Arquitetura](#arquitetura)
- [Persistência](#persistência)
- [Estrutura de idiomas](#estrutura-de-idiomas)
- [Como adicionar uma tabuada](#como-adicionar-uma-tabuada)
- [Como adicionar um idioma](#como-adicionar-um-idioma)
- [Como adicionar uma missão](#como-adicionar-uma-missão)
- [Como trocar localStorage por uma API](#como-trocar-localstorage-por-uma-api)
- [Decisões de engenharia](#decisões-de-engenharia)
- [Acessibilidade e responsividade](#acessibilidade-e-responsividade)
- [Arte e áudio](#arte-e-áudio)
- [Fora de escopo](#fora-de-escopo)

---

## Objetivo

Ensinar as tabuadas de 2 a 10 dentro de uma motivação de jogo — "quero terminar essa ilha" —
em vez de uma sequência de cards de prova. A matemática altera o mundo: cada acerto é um
bloco colocado, cada missão concluída muda a ilha.

O jogo registra desempenho **por multiplicação** (`7x3`, não apenas "tabuada do 7") e usa
esse histórico para trazer de volta, com mais frequência, exatamente o que a criança erra.

---

## Stack

| Camada | Escolha | Motivo |
| --- | --- | --- |
| UI | React 18 + TypeScript strict | Componentes pequenos, tipos claros |
| Build | Vite 5 | Início rápido, zero configuração |
| Testes | Vitest | Mesma cadeia do Vite, sem setup extra |
| Gráficos | Canvas 2D + SVG + CSS | Ver ADR-001 abaixo |
| Áudio | Web Audio API (gerado em runtime) | Sem arquivos de áudio licenciados |
| Persistência | `localStorage` atrás de um repositório | Troca por API sem tocar no domínio |

### ADR-001 — Por que não Phaser

O briefing sugeria Phaser 3 "se fizer sentido arquiteturalmente". **Não usamos Phaser**, pela
seguinte análise:

- O loop do jogo é **por turnos**: pergunta → resposta → um bloco aparece. Não há física,
  colisão, input contínuo, tilemap grande, câmera ou pathfinding.
- A maior parte da tela é **UI declarativa** (perguntas, alternativas, dicas, menus), que é
  exatamente onde React é forte. Com Phaser haveria duas árvores de estado para sincronizar.
- Phaser adiciona ~1 MB ao bundle para desenhar retângulos coloridos, o que conflita com o
  requisito de performance e início rápido.
- O cenário é totalmente descrito por dados (`scenePlan.ts` devolve uma lista de blocos), o
  que torna o desenho testável e trivial de portar depois.

Se o jogo evoluir para movimentação livre do personagem, física ou cenários grandes com
scroll, o caminho de migração é limpo: `scenePlan.ts` (dados puros) permanece e apenas
`BlockScene.tsx` é reescrito sobre Phaser.

---

## Instalação

Requer Node.js 18+.

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173`.

## Build

```bash
npm run build     # type-check (tsc -b) + build de produção em dist/
npm run preview   # serve o build gerado
```

## Testes

```bash
npm test          # execução única
npm run test:watch
```

Também disponíveis: `npm run lint` (ESLint) e `npm run format` (Prettier).

Os testes cobrem a lógica crítica, escrita antes das telas:

| Arquivo | Cobre |
| --- | --- |
| `questions.test.ts` | geração de perguntas, distratores plausíveis, posição aleatória da resposta |
| `mastery.test.ts` | cálculo de domínio por multiplicação, sequências, imutabilidade |
| `adaptive.test.ts` | pesos de revisão, ausência de repetição imediata, injeção de revisão |
| `progression.test.ts` | desbloqueio de ilhas, estrelas, travessia completa do 2 ao 10 |
| `persistence.test.ts` | primeiro acesso, dados corrompidos, dados parciais, reset, migração |
| `i18n.test.ts` | paridade de chaves entre idiomas, interpolação, cobertura de ilhas/missões |
| `achievements.test.ts` | desbloqueio único, reconciliação com saves antigos |

---

## Arquitetura

Cinco camadas, com dependências apontando sempre para dentro:

```
src/
  domain/        lógica pura — sem React, sem DOM, sem storage
    types.ts         tipos centrais (GameState e derivados)
    world.ts         catálogo de ilhas, biomas, paletas e missões
    random.ts        RNG determinístico (torna sorteios testáveis)
    questions.ts     geração de perguntas e distratores
    mastery.ts       desempenho por multiplicação
    adaptive.ts      algoritmo de revisão por pesos
    progression.ts   estrelas, conclusão de ilha, desbloqueio
    achievements.ts  catálogo e avaliação de conquistas

  persistence/   armazenamento — único lugar que conhece localStorage
    schema.ts                      defaults, validação, migrações
    ProgressRepository.ts          interface (load/save/clear)
    storageService.ts              StorageService + LocalStorageProgressRepository
    InMemoryProgressRepository.ts  usado em testes

  i18n/          traduções
    translate.ts       lookup + interpolação (pura, testável)
    I18nProvider.tsx   contexto React
    locales/*.json     textos

  state/         cola entre domínio e UI
    GameProvider.tsx   estado global, carga, salvamento automático
    useMission.ts      motor de uma fase (fila de perguntas, feedback, dica)

  render/        desenho original em código
    scenePlan.ts       plano de blocos de cada construção (puro)
    BlockScene.tsx     canvas do cenário
    avatarSprite.ts    personagem em blocos + opções cosméticas
    AvatarPreview.tsx  retrato do personagem
    IslandArt.tsx      ilha do mapa em SVG
    Mascot.tsx         mascote

  components/    peças de UI reutilizáveis (botão-bloco, estrelas, dica, modal…)
  screens/       uma tela por arquivo
  styles/        tokens visuais e layout
```

Regras que o projeto segue:

- **Nenhum componente chama `localStorage`.** Só `storageService.ts`.
- **Nenhum componente tem texto fixo.** Tudo passa por `t()`.
- **Nenhuma função de domínio importa React.** É por isso que dá para testar tudo em Node.
- **Sorteios recebem um `Rng` injetado**, o que torna geração e adaptação determinísticas
  nos testes e aleatórias em produção.

### Fluxo de uma resposta

```
criança toca na alternativa
  └─ useMission.answer()
       ├─ registerAnswer(fact, correta?)      → GameProvider
       │    ├─ recordAnswer()                 → domain/mastery
       │    ├─ evaluateAchievements()         → domain/achievements
       │    └─ useEffect salva                → ProgressRepository
       ├─ progresso da construção avança      → BlockScene desenha o novo bloco
       └─ acerto: segue sozinho / erro: mostra a dica visual e permite nova tentativa
```

### Sistema de domínio e revisão

`masteryScore` (0 a 1) combina o histórico completo com as últimas 5 tentativas, com peso
maior para o recente, e é multiplicado por uma confiança que impede domínio alto com poucas
tentativas.

O peso de uma multiplicação na hora de sortear (`domain/adaptive.ts`):

| Situação | Efeito no peso |
| --- | --- |
| Conteúdo novo | peso base (1,6) |
| Domínio baixo | cresce até +3 |
| Último resultado incorreto | +2,2 |
| Dois erros seguidos | +1,2 adicional |
| Domínio ≥ 0,9 com 3+ tentativas | ×0,3 |
| Vista nas últimas 3 perguntas | fora do sorteio (cooldown) |

Até 25% das perguntas de uma missão podem vir de **tabuadas anteriores** que ainda estão em
dificuldade — é assim que a revisão acontece sem uma tela separada de "revisar".

### Critério de conclusão

Uma ilha tem 3 missões normais + 1 desafio final (25 perguntas no total). A ilha é concluída
quando todas as missões são concluídas, o que **sempre é alcançável**: errar não remove
progresso, apenas mostra a dica e pede nova tentativa. O desempenho define as **estrelas**
(3 ≥ 90%, 2 ≥ 75%, senão 1), não o direito de avançar. Multiplicações ainda frágeis
continuam voltando pelo sistema de revisão nas ilhas seguintes.

---

## Persistência

Todo o estado vive em uma única chave (`bloquilha.save.v1`) com este formato:

```ts
interface GameState {
  schemaVersion: number;
  player: PlayerProfile | null;
  settings: GameSettings;      // locale, música, efeitos, menos animações
  progress: GameProgress;      // ilhas, missões, tutorial, onboarding
  statistics: PlayerStatistics; // totais, sequências e stats por multiplicação
  achievements: AchievementState[];
}
```

`normalizeState()` trata, sem nunca lançar exceção:

- **primeiro acesso** — não existe save, devolve o estado inicial;
- **dados inexistentes ou parciais** — completa com os padrões;
- **dados corrompidos** — JSON inválido volta ao estado inicial;
- **valores fora do intervalo** — estrelas > 3, status desconhecido, chaves inválidas;
- **reset** — apaga a chave e recria o estado, mantendo o idioma escolhido.

### Migrações

`MIGRATIONS` é um mapa de `versão → função que devolve a versão seguinte`. Para lançar a
versão 2 do schema:

```ts
// persistence/schema.ts
export const CURRENT_SCHEMA_VERSION = 2;

export const MIGRATIONS = {
  1: (data) => ({ ...data, schemaVersion: 2, progress: { ...data.progress, novoCampo: true } }),
};
```

`migrate()` aplica os passos em sequência. Saves sem `schemaVersion` são normalizados para o
formato atual.

---

## Estrutura de idiomas

```
src/i18n/locales/
  pt-BR.json
  en-US.json
```

Nenhum texto visível fica dentro de componentes. O acesso é sempre por chave:

```tsx
const { t, tList } = useI18n();
t('play.question', { a: 4, b: 6 });   // "4 × 6 = ?"
tList('play.correct');                // lista de mensagens variadas de acerto
```

A troca de idioma acontece em **Configurações** e não perde progresso: o idioma é apenas um
campo de `settings` dentro do mesmo save. Um teste garante que os dois arquivos tenham
exatamente o mesmo conjunto de chaves.

---

## Como adicionar uma tabuada

1. Em `src/domain/world.ts`, acrescente uma entrada em `ISLANDS` com `table`, paleta do bioma,
   posição no mapa e `missionsFor(table, [cena1, cena2, cena3, cenaFinal])`.
2. Em cada `locales/*.json`, adicione `islands.<n>.name` e `islands.<n>.biome`.

Nada mais é necessário: ordem, desbloqueio, mapa, seleção de perguntas e conclusão derivam de
`ISLANDS`. O teste que percorre o arquipélago inteiro passa a cobrir a nova ilha
automaticamente.

## Como adicionar um idioma

1. Copie `src/i18n/locales/pt-BR.json` para, por exemplo, `es-ES.json` e traduza os valores.
2. Em `src/domain/types.ts`, inclua o código em `Locale`.
3. Em `src/i18n/translate.ts`, registre o arquivo em `DICTIONARIES`.
4. Em `src/persistence/schema.ts`, acrescente o código a `SUPPORTED_LOCALES` e, se quiser
   detecção automática, a `detectLocale()`.
5. Em `OnboardingScreen`/`SettingsScreen`, adicione o rótulo em `LOCALE_LABELS`.

O teste de paridade de chaves indicará qualquer tradução faltando.

## Como adicionar uma missão

1. Se for um novo tipo de construção, crie a cena em `src/render/scenePlan.ts`: um `case` que
   devolve `scenery` (blocos fixos), `build` (blocos revelados de baixo para cima) e `walk`
   (por onde o personagem anda). Adicione o nome ao tipo `SceneKind` em `world.ts`.
2. Adicione `missions.<cena>.title` e `missions.<cena>.brief` em cada arquivo de idioma.
3. Inclua a cena na lista de missões da ilha desejada em `ISLANDS`.

O número de perguntas define o ritmo; os blocos são revelados proporcionalmente, então
qualquer quantidade funciona sem ajustar a arte.

## Como trocar localStorage por uma API

A lógica do jogo conhece apenas esta interface:

```ts
interface ProgressRepository {
  load(): Promise<GameState>;
  save(state: GameState): Promise<void>;
  clear(): Promise<void>;
}
```

Para migrar, crie a implementação e injete no provider:

```ts
export class ApiProgressRepository implements ProgressRepository {
  async load() {
    const res = await fetch('/api/progress');
    return normalizeState(await res.json());   // reaproveita validação e migrações
  }
  async save(state) {
    await fetch('/api/progress', { method: 'PUT', body: JSON.stringify(state) });
  }
  async clear() {
    await fetch('/api/progress', { method: 'DELETE' });
  }
}
```

```tsx
<GameProvider repository={new ApiProgressRepository()}>
```

Nenhum arquivo de `domain/`, `screens/` ou `components/` muda. Uma estratégia híbrida
(gravar local e sincronizar) também cabe atrás da mesma interface.

---

## Decisões de engenharia

Ambiguidades pequenas foram resolvidas assim, conforme pedido no briefing:

- **Nome do produto:** *Bloquilha* (bloco + ilha), identidade totalmente original.
- **Bases de personagem** chamadas *Broto* e *Seixo* em vez de "menino/menina": as duas
  silhuetas diferem apenas no corte de cabelo, e **todas** as cores, roupas e acessórios estão
  disponíveis para as duas. Nenhuma escolha altera dificuldade ou conteúdo.
- **Alternativas:** 3 nas tabuadas 2 e 3, 4 a partir da 4 — mais discriminação conforme o
  conteúdo fica denso.
- **Acerto da missão** conta apenas quem acertou de primeira; tentativas seguintes ainda
  avançam a construção, mas não contam como acerto para as estrelas.
- **Missões por ilha:** 3 normais (5–6 perguntas) + 1 desafio final (8), mirando 2 a 5 minutos
  por sessão.
- **Sem biblioteca de rotas ou de estado:** a navegação é uma união discriminada em `App.tsx`
  e o estado global é um `useState` + contexto. Redux, event bus e router seriam
  overengineering para este tamanho.
- **Sons gerados por código** com Web Audio, evitando qualquer arquivo licenciado.

## Acessibilidade e responsividade

- Alvos de toque de no mínimo 48 px e alternativas com fonte grande.
- Status **nunca** depende só de cor: ilha bloqueada tem cadeado e rótulo textual; alternativa
  correta ganha `✓` e a incorreta `↺`; estrelas têm `aria-label`.
- Teclado: teclas `1`–`4` respondem, `Esc` fecha modais, foco visível em tudo.
- `prefers-reduced-motion` respeitado, e há um interruptor próprio de "menos animações".
- Áudio é sempre opcional e nenhuma informação existe só no som.
- Layout testado para 1920×1080, 1366×768, tablets e celular em landscape (a fase passa a duas
  colunas em telas baixas). Menus funcionam em portrait.

## Arte e áudio

Toda a arte é gerada pelo próprio projeto — Canvas 2D, SVG e CSS — a partir de retângulos.
Não há assets externos, nem dependência de arte de terceiros, nem qualquer relação com
Minecraft ou outro jogo: personagens, mascote, biomas, paletas e nomes são originais.

## Fora de escopo

Não implementados de propósito: multiplayer, ranking online, contas, login, backend, banco de
dados, chat, compras, anúncios, pagamentos e matchmaking. A arquitetura, no entanto, não os
impede — o `ProgressRepository` é o ponto de entrada natural para sincronização de contas.
