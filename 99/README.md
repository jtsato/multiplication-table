# Sobrevivência da Tabuada

POC 3D de um jogo de sobrevivência educacional que roda no navegador. A criança
explora uma ilha low poly durante o dia, resolve multiplicações **contextualizadas
no objeto que está colhendo** para obter recursos, constrói fogueira e cerca, e usa
essas construções para atravessar a noite até o amanhecer.

A matemática é a ferramenta de progresso, não uma prova: sem responder, não há
madeira; sem madeira, não há fogo; sem fogo, a noite vence.

## O que separa isto de um quiz com enfeite 3D

Três decisões, todas cobertas por teste:

1. **O enunciado descreve a cena, e a cena confere com o enunciado.** Uma árvore
   com 4 galhos de 2 gravetos pergunta "4 galhos com 2 gravetos cada — quantos
   gravetos ao todo?". A criança pode **contar na tela** e conferir a resposta.
   `itemPlacements` e `generateChallenge` derivam ambos do mesmo `node.groups`.
2. **O jogo não pausa.** O painel do desafio fica ancorado no próprio recurso, em
   3D, e o mundo continua rodando. Errar uma conta com um inimigo se aproximando
   tem consequência real.
3. **Errar nunca zera a recompensa.** 25% da colheita, no mínimo 1, e a resposta
   certa é sempre revelada. Um erro que zera ensina a evitar o desafio; um erro
   que rende menos ensina a tentar de novo.

Escopo intencionalmente restrito à **tabuada do 2** — o objetivo é validar o loop,
não cobrir currículo.

## Como jogar

Funciona no computador e no **celular**. Os controles de toque aparecem sozinhos
em aparelhos com apontador grosso (`pointer: coarse`).

### No computador

| Tecla | Ação |
| --- | --- |
| `W` `A` `S` `D` | Andar |
| `←` `→` ou arrastar o mouse | Girar a câmera |
| `E` | Colher um recurso ou abastecer a fogueira (abre o desafio) |
| `1` `2` `3` | Responder o desafio |
| `B` | Modo construção — fogueira (8 madeira + 4 pedra) |
| `C` | Modo construção — cerca (6 madeira) |
| `Espaço` | Confirmar construção |
| `Esc` | Cancelar construção |

### No celular

| Gesto | Ação |
| --- | --- |
| Joystick (canto inferior esquerdo) | Andar — analógico, encostar de leve anda devagar |
| Arrastar em qualquer outro ponto da tela | Girar a câmera |
| Botão **Colher** / **Lenha** | Abre o desafio (só aparece com algo ao alcance) |
| Botões do painel | Responder |
| Botões **Fogueira** / **Cerca** | Entrar no modo construção (apagados sem recurso) |
| Botões **Construir** / **Cancelar** | Confirmar ou desistir |

Os botões mostrados dependem do contexto: numa tela de celular não cabem oito
comandos ao mesmo tempo, então só aparece o que faz sentido naquele momento.

O ciclo dura 3 minutos. Colha e construa de dia; à noite surgem cinco vultos que
perseguem o jogador. A fogueira os afugenta dentro do seu raio e a cerca bloqueia
o caminho — mas a fogueira queima e, para reabastecê-la, é preciso resolver mais
uma multiplicação. Sobreviver até o amanhecer com vida é a vitória.

## Stack

- **React 19 + TypeScript (strict)**, **Vite** para build e dev server.
- **React Three Fiber + Three.js** para a cena, **React Three Rapier** para a física.
- **Zustand** para o estado, composto por slice creators.
- **Vitest** + `@react-three/test-renderer` + Testing Library para os testes.
- **ESLint + Prettier**.

Toda a arte é gerada em código a partir de primitivas do Three com `flatShading`.
Não há nenhum asset externo.

> **React fixado em `~19.2.8`**, e não `^19.2.8`: `@react-three/fiber@9` declara
> peer `react: ">=19 <19.3"`, e o `^` permitiria resolver para 19.3 e quebrar.

## Arquitetura — Vertical Slice

Organização **por funcionalidade**, não por camada. Não existem pastas
`components/`, `hooks/` ou `services/` globais. Cada slice é dona do seu estado,
da sua renderização 3D, da sua UI e dos seus testes.

```
src/
├── app/            # único lugar que conhece todas as slices
│   ├── App.tsx     #   canvas (importação tardia) + HUD + desfecho
│   ├── GameCanvas.tsx
│   └── store.ts    #   compõe os slice creators
├── slices/
│   ├── world/      # terreno, cenário instanciado, limites da ilha
│   ├── player/     # corpo Rapier, input, câmera seguidora
│   ├── resources/  # nós coletáveis, alcance, inventário
│   ├── math/       # desafio contextualizado (o núcleo)
│   ├── building/   # fogueira, cerca, combustível
│   ├── daynight/   # relógio, fases, céu e luzes
│   └── enemies/    # spawn, perseguição, dano, desfecho
└── shared/         # sem regra de negócio: paleta, PRNG, vetor, teclado
```

Dentro de cada slice: `<nome>.logic.ts` (funções puras), `<nome>.store.ts`
(slice creator do Zustand), `<Nome>View.tsx` (componente R3F), testes e um
`index.ts` de fachada. Uma slice nunca importa o store — só o tipo `GameState`.

### As duas regras que sustentam os 60 FPS

**1. Nada que mude por quadro passa pelo React.** Posição do jogador
(`playerTransform`), relógio do jogo (`dayNightClock`) e posições dos inimigos
vivem em objetos mutáveis fora do React. Dentro de `useFrame`, o estado é lido
com `useGameStore.getState()`, nunca com hook seletor.

**2. O store só recebe o que muda raramente.** Inventário, fase do dia, vida,
desfecho. Valores contínuos que o HUD precisa são publicados com *throttle* a
4 Hz, e as ações do store devolvem o estado inalterado quando o valor não mudou —
sem isso, o realce do recurso (recalculado a cada quadro) notificaria os
assinantes 60 vezes por segundo.

## Testes

Duas camadas: **282 testes** de unidade/integração no Vitest e **16 testes ponta a
ponta** em navegador de verdade com Playwright.

### Ponta a ponta (Playwright)

```bash
npm run e2e          # desktop + celular emulado
npm run e2e:ui       # modo interativo
```

Rodam contra o **build de produção** servido pelo `vite preview` — o mesmo
artefato que vai para o Pages. Cobrem o que só o navegador prova: WebGL
inicializa, o WASM do Rapier carrega, a física move o jogador de verdade, e o
loop matemática → recurso → construção → noite → vitória funciona inteiro. O
projeto `celular` emula um Pixel 5 e emite eventos de toque nativos via CDP, de
modo que o joystick é arrastado por um dedo real, não por eventos sintéticos.

Os testes gravam telas em `e2e/telas/`, o que torna possível **olhar** o jogo —
foi assim que apareceram bugs que nenhum teste unitário pegaria: a ilha inteira
cor de areia, o personagem sem cabeça e a noite escura demais para jogar.

### Unidade e integração (Vitest)

A cena R3F não renderiza em jsdom, então a arquitetura empurra a lógica para fora
dos componentes:

- **Funções puras e slices do store** → Vitest em ambiente `node`. É onde fica a
  maior parte da cobertura.
- **HUD e painel do desafio** → jsdom + Testing Library, com
  `// @vitest-environment jsdom` por arquivo.
- **Cena 3D** → `@react-three/test-renderer` através do helper
  `src/test/sceneHarness.tsx`, que monta a árvore com física real e **aguarda o
  WASM do Rapier inicializar** — sem essa espera, as asserções passariam contra
  uma cena vazia.
- **O solver do Rapier não é testado**: testa-se a intenção (input → velocidade
  desejada), não a física.

## Instalação e desenvolvimento

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build       # build de produção em dist/
npm run preview     # serve o build de produção
npm run test        # roda a suíte uma vez
npm run test:watch  # modo watch
npm run typecheck   # TypeScript sem emitir
npm run lint        # ESLint
npm run format      # Prettier
npm run e2e         # testes de navegador (exige `npx playwright install chromium`)
```

## Decisões técnicas

Registro por fatia, com o porquê de cada escolha não óbvia e os bugs que os
testes pegaram, em [docs/decisoes.md](docs/decisoes.md).
