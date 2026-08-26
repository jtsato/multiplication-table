# Numi 99

**A ilha da tabuada.**

POC 3D de um jogo educacional que roda no navegador. A criança explora uma ilha
low poly, resolve multiplicações **contextualizadas no objeto que está colhendo**
para obter recursos, monta o acampamento e acende uma lanterna para aproveitar a
noite curta.

A matemática é a ferramenta de progresso, não uma prova: sem responder, não há
madeira; sem madeira, não há fogueira; sem a conta na fogueira, não há luz para
levar consigo.

**Não há como perder.** Não existem inimigos, dano nem tela de derrota — o jogo é
um lugar para voltar, não uma prova para vencer.

## O que separa isto de um quiz com enfeite 3D

Três decisões, todas cobertas por teste:

1. **O enunciado descreve a cena, e a cena confere com o enunciado.** Uma árvore
   com 4 galhos de 2 gravetos pergunta "4 galhos com 2 gravetos cada — quantos
   gravetos ao todo?". A criança pode **contar na tela** e conferir a resposta.
   `itemPlacements` e `generateChallenge` derivam ambos do mesmo `node.groups`.
2. **O jogo não pausa.** O painel do desafio fica ancorado no próprio recurso, em
   3D, e o mundo continua rodando. A âncora nunca foi sobre tensão: é o que
   permite à criança conferir a resposta contando os objetos na tela.
3. **Errar nunca zera a recompensa.** 25% da colheita, no mínimo 1, e a resposta
   certa é sempre revelada. Um erro que zera ensina a evitar o desafio; um erro
   que rende menos ensina a tentar de novo.

Escopo intencionalmente restrito à **tabuada do 2** — o objetivo é validar o loop,
não cobrir currículo.

## Como jogar

Funciona no computador e no **celular**. Os controles de toque aparecem sozinhos
em aparelhos com apontador grosso (`pointer: coarse`).

### No computador

| Tecla                       | Ação                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `W` `A` `S` `D`             | Andar                                                      |
| `←` `→` ou arrastar o mouse | Girar a câmera                                             |
| `E`                         | Colher um recurso ou abastecer a fogueira (abre o desafio) |
| `1` `2` `3`                 | Responder o desafio                                        |
| `B`                         | Modo construção — fogueira (8 madeira + 4 pedra)           |
| `C`                         | Modo construção — cerca (6 madeira)                        |
| `Espaço`                    | Confirmar construção                                       |
| `Esc`                       | Cancelar construção                                        |

### No celular

| Gesto                                    | Ação                                             |
| ---------------------------------------- | ------------------------------------------------ |
| Joystick (canto inferior esquerdo)       | Andar — analógico, encostar de leve anda devagar |
| Arrastar em qualquer outro ponto da tela | Girar a câmera                                   |
| Botão **Colher** / **Acender**           | Abre o desafio (só aparece com algo ao alcance)  |
| Botões do painel                         | Responder                                        |
| Botões **Fogueira** / **Cerca**          | Entrar no modo construção (apagados sem recurso) |
| Botões **Construir** / **Cancelar**      | Confirmar ou desistir                            |

Os botões mostrados dependem do contexto: numa tela de celular não cabem oito
comandos ao mesmo tempo, então só aparece o que faz sentido naquele momento.

O ciclo dura 5 minutos, repartidos em **dia 204 s · entardecer 24 s · noite 48 s ·
amanhecer 24 s**. O dia é longo porque é nele que se resolvem contas; a noite é
curta porque é uma janela, não uma prova.

### Moedas e loja

Cada resposta certa paga **moedas** — o número da tabuada, mais um bônus a cada três
acertos seguidos e um bônus grande na primeira vez que um fato novo é resolvido. Errar
nunca tira nada: continua rendendo recurso, só não paga moeda.

A distinção que sustenta a economia:

> **O recurso é o resultado da conta. A moeda é o prêmio por ter acertado.**

Na loja (`L`) tudo custa **moedas e recursos** — é o que dá destino ao que se colhe.
São três itens: lanterna maior, botas e a dica, que apaga uma alternativa errada.
Comprar ajuda com moeda ganha em conta certa é uma troca honesta, e é o que tira o
medo de errar sem tornar o erro gratuito.

No amanhecer vem o **resumo do dia**: contas certas, moedas e o que foi aprendido.
Não é pontuação — é elogio concreto, e de quebra o relatório que o adulto quer ver.

### A casa

A casa **já existe quando o jogo começa**, e é sempre iluminada — o lampião da porta
nunca apaga. Um porto seguro que precisa ser conquistado não é seguro.

Ao entrar, o telhado fica transparente: a leitura vira a de uma casa de boneca, sem
carregar outra cena. Dentro do raio de luz dela a **lanterna não gasta e reacende de
graça**, sem conta e sem moeda.

Cinco móveis:

- **Espelho** — silhueta, 6 tons de pele, 8 cores de roupa e acessórios. A silhueta
  escolhida não tranca nada; os acessórios especiais se ganham por marco de tabuada
  (a coroa exige a do 9 inteira).
- **Mural da tabuada** — a grade de 1 a 10, preenchendo sozinha conforme a criança
  domina os fatos. **Aqui consultar é de graça**, e o resultado aparece mesmo do que
  ainda não foi dominado. No campo, a dica custa moeda; em casa, não custa nada.
- **Cama** — dormir pula para o próximo amanhecer.
- **Caderneta dos animais** — quem já foi visto, quem já virou amigo, e o amigo que
  a criança escolhe para acompanhá-la como pet.

E as **seis decorações da loja** — tapete, aquário, vaso, lustre, prateleira e
escultura — aparecem dentro da casa assim que compradas, e continuam lá depois de
recarregar a página. É o ralo permanente da economia: a criança gasta moedas e
colheitas para **ver** a casa mudar.

Moedas, fatos dominados, itens comprados, caderneta, pet e aparência ficam guardados
no navegador e sobrevivem a fechar a página.

### Animais e pet

Cada região tem seus bichos: gaivotas na Praia, cardumes no Porto, cães e gatos no
Bosque, cavalos na Cachoeira e vacas no Pomar. **Animal nunca é nó de colheita** —
ele é alvo de amizade. Chegar perto e apertar **E** abre um desafio de comida (o
pedido é uma multiplicação); acertar debita a comida da mochila e registra o bicho
como amigo na caderneta.

Na caderneta, qualquer amigo pode virar **pet** e passar a seguir o jogador. De vez
em quando o pet desenterra uma moeda — um agrado gentil, não uma mecânica de
pressão. E quando passa perto de um nó de colheita, ele vira a cabeça para o nó:
o farejo é o aviso silencioso de que há uma conta esperando ali perto.

Os **raros** aparecem em janela curta e dependem de domínio, não de sorte: o
**unicórnio** na Cachoeira à noite e o **dinossauro** no Pico de dia, ambos depois
de uma sequência de acertos.

De vez em quando a **baleia** sobe no mar aberto do Porto, solta o esguicho e
mergulha. Ela não dá moeda nem recurso — é um acontecimento para a criança parar
de fazer conta e olhar.

### NPCs e encomendas

Cada região tem um NPC de **encomendas**: o pedido é uma multiplicação, e entregar
debilta a quantidade da mochila e paga moedas. É o destino que paga em moeda sem
virar venda — o recurso continua sendo o resultado da conta.

A **comerciante** fica na Praia e abre a mesma loja do `L`. O **professor** existe
em todas as regiões e abre a tabuada de graça, em qualquer lugar — consultar não é
só um privilégio de casa.

As **pontes** agora têm guardiã: ela fica visível na margem de origem, de lanterna
na mão, e antes de comprar a travessia a criança resolve a conta dela. Acertar
libera a compra (que continua cobrando moedas, recursos e a tabuada local); errar
não custa nada. Ponte aberta, a guardiã vai embora — não há mais pedágio a cobrar.

### Horta

A loja vende **sementes** (moedas + mel). Com uma semente na mão, a criança planta
em um **canteiro**; o Pomar já começa com um, e novos canteiros podem ser plantados
em qualquer região. Cada canteiro cresce no mesmo dia e fica **pronto no dia
seguinte**, entregando a colheita local de graça — a recompensa é por voltar, não por
resolver mais uma conta. O estado dos canteiros e as sementes sobrevivem ao reload.

### A noite

À noite a criança pode resolver mais uma multiplicação na fogueira para **acender a
lanterna**, que a acompanha por onde ela for. Uma carga dura 60 s e cobre a noite
inteira com folga. Ficar sem carga não tira nada além do que só aparece no escuro:
o luar continua claro o bastante para andar e voltar para o acampamento.

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
│   ├── lantern/    # carga como prazo, luz que acompanha o jogador
│   ├── economy/    # moedas, sequência, fatos dominados e a loja
│   ├── home/       # a casa, o mural da tabuada e a cama
│   ├── avatar/     # aparência e acessórios por marco
│   ├── wildlife/   # animais, caderneta e raros
│   ├── companion/  # o pet que segue o jogador
│   ├── npc/        # encomendas e os NPCs do mundo
│   └── save/       # persistência em localStorage
└── shared/         # sem regra de negócio: paleta, PRNG, vetor, teclado
```

Dentro de cada slice: `<nome>.logic.ts` (funções puras), `<nome>.store.ts`
(slice creator do Zustand), `<Nome>View.tsx` (componente R3F), testes e um
`index.ts` de fachada. Uma slice nunca importa o store — só o tipo `GameState`.

### As duas regras que sustentam os 60 FPS

**1. Nada que mude por quadro passa pelo React.** Posição do jogador
(`playerTransform`), relógio do jogo (`dayNightClock`) e a carga da lanterna
vivem fora do React — a carga é um prazo, então ela "queima" sozinha, sem nenhuma
escrita por quadro. Dentro de `useFrame`, o estado é lido
com `useGameStore.getState()`, nunca com hook seletor.

**2. O store só recebe o que muda raramente.** Inventário, fase do dia, vida,
desfecho. Valores contínuos que o HUD precisa são publicados com _throttle_ a
4 Hz, e as ações do store devolvem o estado inalterado quando o valor não mudou —
sem isso, o realce do recurso (recalculado a cada quadro) notificaria os
assinantes 60 vezes por segundo.

## Testes

Duas camadas: **699 testes** de unidade/integração no Vitest e **39 testes ponta a
ponta** em navegador de verdade com Playwright.

### Ponta a ponta (Playwright)

```bash
npm run e2e          # desktop + celular emulado
npm run e2e:ui       # modo interativo
```

Rodam contra o **build de produção** servido pelo `vite preview` — o mesmo
artefato que vai para o Pages. Cobrem o que só o navegador prova: WebGL
inicializa, o WASM do Rapier carrega, a física move o jogador de verdade, e o
loop matemática → recurso → moeda → loja → casa → noite → lanterna funciona inteiro. O
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

## Dívidas conhecidas

As dívidas abertas ficam em [docs/divida-tecnica.md](docs/divida-tecnica.md).
