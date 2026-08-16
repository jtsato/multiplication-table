# Registro de decisões técnicas

Uma entrada por fatia. Cada entrada descreve o que foi construído, as decisões
não óbvias e o resultado dos portões de qualidade (lint, testes, build).

---

## Fatia 0 — Andaime

**O que foi criado:** projeto Vite + React 19 + TypeScript strict, com ESLint flat
config, Prettier, Vitest e a paleta/PRNG compartilhados.

### Decisões

**React fixado em `~19.2.8`, não `^19.2.8`.** `@react-three/fiber@9.7.0` declara peer
`react: ">=19 <19.3"`. O projeto irmão `cc` usa `^19.1.1`, que resolveria para 19.3
assim que essa versão sair e quebraria o peer do R3F. O `~` prende em 19.2.x. Resolvido
e verificado: `react@19.2.8`, sem avisos de peer na instalação.

**Vitest com `environment: 'node'` global.** Cena R3F não renderiza em jsdom, e a maior
parte da lógica do jogo é função pura. O default node é mais rápido; arquivos de UI
optam por jsdom com `// @vitest-environment jsdom` no topo. Mesmo padrão do `cc`.

**`src/vite-env.d.ts` com a referência a `vite/client`.** O `tsconfig.app.json` liga
`noUncheckedSideEffectImports`, que rejeita `import './app/global.css'` sem declaração.
O build falhou exatamente nisso (TS2882) antes da correção.

**`chunkSizeWarningLimit: 1500`.** `three` + `rapier` passam de 500 kB por natureza;
manter o limite padrão só geraria ruído em todo build.

**PRNG semeado (`shared/rng.ts`) em vez de `Math.random`.** Todo sorteio do jogo —
posição de recurso, desafio, distrator, spawn de inimigo — passa por ele, o que torna
o mundo reproduzível e os testes determinísticos.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run test` | 9 testes, 1 arquivo, verde |
| `npm run build` | ok — 190,58 kB (60,01 kB gzip) |

---

## Fatia 1 — Cena e movimento

**O que foi criado:** ilha low poly com física, jogador controlável em 3ª pessoa e
câmera seguidora. Primeira fatia jogável: dá para andar pela ilha.

### Decisões

**Posição do jogador vive fora do React (`playerTransform`).** É o ponto central de
performance do projeto. A posição muda todo quadro; escrevê-la no store Zustand a 60 Hz
re-renderizaria toda a árvore assinante. As slices seguintes (recursos, construção,
inimigos) precisam da posição *dentro* do próprio `useFrame` — mesmo quadro, sem passar
pelo React. O HUD recebe uma cópia amostrada a 4 Hz, publicada pelo store.

**Contenção por anel de colisores, não por clamp de posição.** Corrigir a posição do
corpo todo quadro para mantê-lo dentro do raio briga com o solver do Rapier e produz
tremor na borda. 24 caixas invisíveis tangentes ao círculo deixam a contenção a cargo
da física, que é para o que ela existe.

**Suavização exponencial `1 - e^(-k·dt)` na câmera.** Um `lerp` de fator fixo por quadro
deixa a câmera mais rápida a 144 Hz do que a 60 Hz. Há teste garantindo que dois passos
de meio delta equivalem a um passo inteiro.

**`delta` limitado a 50 ms.** Voltar de uma aba em segundo plano entrega um delta enorme,
que teleportaria o jogador através das paredes.

**Vetores `Vector3` reaproveitados em escopo de módulo.** Alocar dentro de `useFrame` gera
lixo 60 vezes por segundo e vira engasgo na coleta. As funções puras ainda devolvem um
objeto `Vec3` simples por quadro — trade-off aceito em favor da testabilidade, já que
objetos pequenos e efêmeros são baratos.

**`event.code` em vez de `event.key`.** WASD continua no mesmo lugar físico em teclados
AZERTY ou Dvorak. O `blur` da janela limpa as teclas presas, senão trocar de aba com W
pressionado deixaria o jogador andando sozinho.

### Estratégia de teste — o que mudou em relação ao plano

O plano previa o `@react-three/test-renderer` como "se a compatibilidade se confirmar".
Confirmou-se, com dois ajustes descobertos na prática:

1. **A `<Physics>` do Rapier inicializa o WASM de forma assíncrona.** `create()` devolve
   uma cena ainda vazia; o helper `src/test/sceneHarness.tsx` aguarda a árvore aparecer
   antes de devolver o renderer. Sem isso, todas as asserções passavam contra uma cena
   vazia — falso verde.
2. **Componentes que escutam `window` precisam de jsdom por arquivo**, mesmo usando o
   test-renderer (que não precisa de DOM em si).

Com isso, `PlayerView.test.tsx` verifica o laço de quadro de ponta a ponta: avança 180
quadros e confirma que a câmera convergiu para `followCameraTarget`. É a verificação que
substitui o screenshot — não há automação de navegador neste ambiente.

### Pendência conhecida

**Bundle de 3,19 MB (1,15 MB gzip).** Medido: 2,00 MB é um único blob base64 — o WASM do
Rapier, que o `@dimforge/rapier3d-compat` inlina no JS. São 63% do bundle. Não bloqueia a
POC, mas prejudica o primeiro carregamento. A tratar no fechamento, com carregamento
tardio do canvas e tela de carregamento.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo (corrigido: escrita de ref durante render, `react-hooks/refs`) |
| `npm run test` | 47 testes, 5 arquivos, verde |
| `npm run build` | ok — 3.346,65 kB (1.149,31 kB gzip) |
| Navegador | dev server responde e transforma os módulos; verificação visual pendente de execução manual |

---

## Fatia 2 — Recursos e interação

**O que foi criado:** 21 nós coletáveis (árvore, moita, rocha), realce do nó mais próximo,
coleta com **E**, inventário no HUD e recuperação automática do nó após 12 s.

### Decisões

**`itemPlacements` é o contrato visual do jogo, e por isso é função pura testada.**
Cada nó exibe `groups` grupos de 2 itens — gravetos no galho, frutas no cacho, pedrinhas
na rocha. A Fatia 3 vai perguntar "N grupos × 2, quantos ao todo?", e a criança precisa
poder **contar na tela** e chegar na resposta. Se o layout mostrasse um número diferente
de itens, o enunciado viraria mentira e o jogo voltaria a ser um quiz com enfeite 3D.
Há teste garantindo `itemPlacements(node).length === fullYield(node)` para todos os
grupos de 1 a 10.

**Esgotamento como booleano, não como `readyAt` comparado ao relógio.** Foi uma correção
de rota durante a implementação: prontidão baseada em tempo obrigaria recalcular quem
está disponível **durante o render**, 60 vezes por segundo — exatamente o que a regra de
performance proíbe. Como booleano, a árvore só re-renderiza nos dois eventos reais
(colher e voltar), e a recuperação vira um `setTimeout` com limpeza no desmonte.

**`setHighlightedNodeId` devolve o mesmo estado quando o valor não muda.** O realce é
recalculado todo quadro dentro do `useFrame`; sem essa guarda, o store notificaria os
assinantes 60 vezes por segundo e o HUD re-renderizaria à toa. Há teste verificando a
identidade preservada do estado.

**Itens instanciados por tipo, bases como malhas normais.** São até 21 nós × 20 itens =
420 objetos; como malhas separadas seriam centenas de draw calls. Como `InstancedMesh`,
são três. As bases (21) ficam como malhas comuns porque cada uma tem forma e destaque
próprios.

**Conflito de teclas corrigido:** **E** estava mapeado para girar a câmera na Fatia 1 e
o plano reserva **E** para interagir. A rotação passou a ser só setas ← → e arrasto do
mouse; Q/E ficaram livres para interagir (E) e construir (B, Fatia 4).

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run test` | 90 testes, 8 arquivos, verde |
| `npm run build` | ok — 3.351,93 kB (1.150,80 kB gzip) |

O teste de integração `ResourcesView.test.tsx` percorre o caminho real — aproximar,
destacar, disparar `keydown` de **E**, creditar inventário — pelos mesmos componentes e
eventos que o navegador usa, incluindo o caso de apertar E duas vezes sem render em dobro.

---

## Fatia 3 — Desafio de tabuada contextualizado

**O que foi criado:** o núcleo da POC. **E** não coleta mais direto — abre um desafio
ancorado no próprio recurso, com o mundo continuando a rodar. Acerto rende a colheita
cheia, erro rende parcial e revela a resposta.

### Decisões

**O enunciado descreve a cena, e a cena confere com o enunciado.** O multiplicando vem de
`node.groups`, o mesmo número que `itemPlacements` usa para desenhar os grupos. "4 galhos
com 2 gravetos cada" aparece sobre uma árvore que tem, de fato, 4 galhos de 2 gravetos.
A criança pode conferir contando na tela. É isso que separa a POC de um quiz com enfeite
3D, e é por isso que ambos os lados são funções puras com teste.

**O jogo não pausa.** Decisão central da fatia: com o mundo rodando, a conta é ferramenta
usada sob pressão, não prova com o tempo parado. Consequência de design: afastar-se
cancela o desafio — sair de perto é a forma natural de desistir.

**Distratores são erros reais, não números aleatórios.** `groups + perGroup` (somou em vez
de multiplicar — o erro mais comum), `answer ± perGroup` (contou um grupo a mais ou a
menos), `answer ± 1` (escorregou na contagem). Um distrator absurdo tornaria a resposta
adivinhável sem fazer a conta. Testado que todos são positivos, distintos e diferentes da
resposta, para todos os nós possíveis (1 a 10 grupos × 3 tipos × 25 sementes).

**Errar nunca zera a recompensa.** 25% da colheita, no mínimo 1. Um erro que zera ensina a
evitar o desafio; um erro que rende menos ensina a tentar de novo. A resposta certa é
sempre mostrada — errar tem que ensinar.

**Um único gerador aleatório para a sessão inteira.** Recriar o gerador por desafio a
partir de uma semente derivada do nó faria o mesmo nó repetir sempre as mesmas
alternativas na mesma ordem. Há teste verificando que 30 aberturas do mesmo nó produzem
mais de uma ordem, e outro verificando que a resposta certa não cai sempre na mesma
posição.

**`occlude` do drei foi descartado.** O plano previa `transform` + `occlude`. A oclusão
por raycast se comporta de forma instável com painéis interativos e não havia navegador
neste ambiente para validar visualmente. Um painel que some atrás de uma árvore seria pior
que um painel sempre visível. Ficou `Html center distanceFactor={11}`: encolhe com a
distância (pertence à cena) e sempre encara a câmera.

### Dois bugs que os testes pegaram

**Concordância de gênero.** A primeira versão gerava "Quantos frutas ao todo?" — *fruta* e
*pedra* são femininos, *graveto* é masculino. O gênero virou parte de `ChallengeContext`.

**Nome acessível concatenado.** O badge da tecla de atalho colava no número da alternativa,
e o nome acessível do botão saía como `"320"` em vez de `"20"` — um leitor de tela
anunciaria um número que não existe na tela. Corrigido com `aria-label` explícito e
`aria-hidden` no badge.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo (corrigido: `react-hooks/immutability` por função usada antes da definição) |
| `npm run test` | 136 testes, 11 arquivos, verde |
| `npm run build` | ok — 3.362,58 kB (1.154,57 kB gzip) |

Os testes da Fatia 2 que afirmavam coleta direta por **E** foram reescritos: agora afirmam
que **E** abre o desafio e que a colheita só acontece ao responder. A mudança de
comportamento é intencional e está coberta.

---

## Fatia 4 — Construção: fogueira e cerca

**O que foi criado:** modo construção com fantasma translúcido preso à frente do jogador,
verde/vermelho conforme viabilidade. Fogueira (8 madeira + 4 pedra) acende e ilumina;
cerca (6 madeira) gera colisor que barra o caminho de verdade.

### Decisões

**Uma tecla por estrutura, não um modo com submenu.** **B** para fogueira, **C** para
cerca, Espaço confirma, Esc cancela. As teclas 1-2-3 já respondem o desafio; reaproveitá-las
para escolher a construção criaria um conflito silencioso justamente quando os dois
estivessem abertos ao mesmo tempo. É o mesmo tipo de conflito que já tinha aparecido na
Fatia 2 com o **E**.

**A ordem de validação é escolhida pelo feedback, não pela lógica.** `checkPlacement`
testa recursos → limites da ilha → sobreposição → folga de recurso. Quando dois problemas
existem ao mesmo tempo, "recursos insuficientes" é mais útil que "sobreposta" — diz o que
fazer a seguir. A ordem está fixada em teste.

**A construção inteira precisa caber na ilha, não só o centro.** `isWithinIsland(position,
spec.footprint)` usa o footprint como margem. Sem isso, uma fogueira colocada bem na borda
ficaria com metade boiando no mar.

**`payCost` devolve o inventário intacto quando não dá para pagar.** Cobrar parcialmente
deixaria a criança sem recurso e sem construção — o pior resultado possível. Testado que o
inventário nunca fica negativo para nenhuma receita.

**O fantasma escreve direto nos objetos do Three.** Posição e cor são atualizadas dentro do
`useFrame`, sem passar por estado do React: a validade da posição muda a cada passo, e
levar isso ao React re-renderizaria a árvore 60 vezes por segundo.

**Sair do modo após construir.** Continuar no modo levaria a construir várias por engano
com a mesma tecla — e cada erro custa recursos que exigiram resolver contas.

**A luz da fogueira tem `distance` limitado** a `fireSafeRadius * 2`. Uma `pointLight` sem
alcance definido é avaliada contra a cena inteira; com várias fogueiras isso apareceria
direto no custo de quadro.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run test` | 170 testes, 13 arquivos, verde |
| `npm run build` | ok — 3.368,49 kB (1.156,16 kB gzip) |

`BuildingView.test.tsx` cobre o caminho real pelo teclado: entrar no modo, construir,
debitar, e as três recusas (sem recursos, sobreposta, fora da ilha) verificando que
nenhuma delas debita recurso.

---

## Fatia 5 — Ciclo dia e noite

**O que foi criado:** ciclo de 3 minutos em quatro fases (dia → entardecer → noite →
amanhecer), com céu, neblina, cor e ângulo do sol interpolados, e HUD mostrando fase, dia
e contagem regressiva.

### Decisões

**As luzes mudaram de slice.** Saíram de `WorldView` e foram para `DayNightView`. Quem
manda na iluminação é o ciclo, não a geometria — `WorldView` ficou responsável apenas pelo
que compõe fisicamente a ilha. A separação segue a funcionalidade, não o tipo de objeto,
que é o ponto da vertical slice. O teste do `WorldView` foi invertido: agora afirma que
ele **não** traz luz nenhuma.

**Relógio vivo fora do React (`dayNightClock`), igual a `playerTransform`.** O relógio
avança todo quadro; o store recebe amostra a 4 Hz. Há teste medindo isso: 40 quadros de
simulação geram no máximo 8 notificações do store.

**Publicação imediata na virada de fase, não só no throttle.** O HUD e o spawn de inimigos
(Fatia 6) não podem esperar até um quarto de segundo para saber que a noite chegou.

**A noite escurece com curva ao quadrado.** A percepção de brilho não é linear; uma
interpolação reta faria o entardecer parecer travado e a noite cair de repente.

**A luz nunca chega a zero** (`sunIntensity` mínima de 0,22). No escuro absoluto o jogo
fica injogável fora do raio da fogueira, o que puniria quem ainda não conseguiu construir
uma. Há teste percorrendo o ciclo inteiro verificando que intensidade e ambiente sempre
ficam acima de zero.

**`mixHex` interpola cores na mão, sobre inteiros,** em vez de usar `THREE.Color`. Mantém
a lógica do ciclo pura e testável em ambiente node, sem importar o motor gráfico.

### O bug de ponto flutuante

`phaseFor(0.88)` — a fronteira exata entre noite e amanhecer — devolvia `'noite'`. A causa
era a normalização `((t % 1) + 1) % 1`, forma comum mas que faz duas operações de ponto
flutuante a mais: `1.88 % 1` dá `0.8799999999999999`, e a comparação `< 0.88` passava a
ser verdadeira. Trocado por um `normalizePosition` que só soma 1 quando o valor é
negativo. Sem o teste de fronteira exata, esse erro passaria despercebido e a noite
duraria um quadro a mais do que o previsto.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run test` | 205 testes, 15 arquivos, verde |
| `npm run build` | ok — 3.371,90 kB (1.157,24 kB gzip) |

`DayNightView.test.tsx` simula o ciclo inteiro avançando quadros e verifica a sequência
das quatro fases, a virada do dia, o escurecer e o clarear medidos na intensidade real da
luz direcional, e a taxa de publicação no store.

---

## Fatia 6 — Primeiro inimigo e vitória

**O que foi criado:** cinco vultos que surgem ao anoitecer e perseguem o jogador, dano por
contato com cooldown, fogueira com combustível que se esgota, vitória ao amanhecer,
derrota com vida zerada e reinício sem recarregar a página.

### Decisões

**O combustível da fogueira é um prazo, não uma quantidade que decresce.** `fuelUntil`
guarda o instante em que o fogo apaga; `fuelRemaining(structure, now)` é pura. Assim o
combustível "queima" continuamente **sem nenhuma escrita por quadro no store** — a chama
encolhe e a luz cai por mutação direta nos objetos do Three, e o React só re-renderiza
quando alguém abastece.

**Abastecer também cobra uma multiplicação.** É o fecho do loop da POC: de dia a conta
rende recurso, de noite rende tempo de fogo — e o fogo é o que segura os inimigos. Para
isso o desafio foi generalizado: `generateChallenge` passou a receber um `ChallengeTarget`
mínimo (`id`, `kind`, `groups`) em vez de um `ResourceNode`, e ganhou um `purpose`. A slice
de matemática não precisa conhecer nem recurso nem construção.

**Inimigos não são corpos do Rapier.** São cinemáticos por posição. Para cinco vultos que
andam em linha reta, o solver não acrescentaria nada e cobraria caro. A fogueira os afasta
por distância, e a cerca — essa sim um colisor — barra o jogador de verdade.

**`stepToward` nunca ultrapassa o alvo.** Sem essa checagem, um `delta` grande faria o
inimigo saltar por cima do jogador e ficar oscilando de um lado para o outro.

**O cooldown de dano é o que torna a derrota justa.** Sem ele, encostar num inimigo
drenaria a vida inteira em poucos quadros — 60 contatos por segundo. Há teste simulando 12
segundos de contato contínuo e verificando que saem no máximo 12 golpes, não 720.

**A derrota tem prioridade sobre a vitória** em `evaluateOutcome`: com vida zerada não há
amanhecer que valha.

**`restartGame` vive em `app/store.ts`, não numa slice.** É a única operação que atravessa
todas elas — cada slice sabe se limpar, mas nenhuma manda nas outras. Reiniciar sem
recarregar a página evita pagar de novo a inicialização inteira do WASM do Rapier.

### Dois problemas encontrados

**Ponto flutuante no cooldown.** `10 + 1.2 - 10` dá `1.1999999999999993`, então o teste da
fronteira exata falhava. O instante exato do limite é ambíguo por natureza com floats; o
teste passou a verificar um quadro antes e um quadro depois, que é o contrato que importa.

**Mutação de resultado de `useMemo`.** As posições vivas dos inimigos estavam num `useMemo`
sendo mutado a cada quadro — o `react-hooks/immutability` apontou corretamente. Mutar um
memo quebra as garantias do React, que pode descartá-lo e recalcular a qualquer momento.
Passou para um ref ressincronizado dentro do próprio laço.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run test` | 255 testes, 17 arquivos, verde |
| `npm run build` | ok — ver fechamento abaixo |

---

## Fechamento

### Bundle: pendência da Fatia 1 resolvida

O bundle único de 3,38 MB foi separado por importação tardia do canvas
(`React.lazy` + `Suspense` com tela de carregamento):

| Antes | Depois |
| --- | --- |
| um chunk de 3.377 kB (1.159 kB gzip) | inicial **4,8 kB JS + 4,4 kB CSS** (~2,4 kB gzip) |
| tela branca até baixar tudo | tela de carregamento pinta na hora |
| | `three` 1.120 kB + `rapier` 2.237 kB carregam depois |

O total não diminuiu — 2 MB continuam sendo o WASM do Rapier embutido como base64 pelo
`@dimforge/rapier3d-compat`, e não há como evitar isso sem trocar de pacote. O que mudou é
que a criança vê a ilha carregando em vez de uma tela branca.

### Deploy

`99` entrou em [.github/workflows/pages.yml](../../.github/workflows/pages.yml) espelhando
o passo do `cc`, com `npm run lint` a mais, e um link em `pages/index.html`. O comando
exato do CI (`npm ci --prefix 99`) foi verificado localmente.

### Números finais

- **255 testes** em 17 arquivos, todos verdes.
- **7 slices verticais**, nenhuma pasta por camada.
- Lint e typecheck limpos, sem `any` e sem `eslint-disable` em código de produção.
- Toda a arte gerada em código; **zero assets externos**.

---

## Fatia 7 — Celular e testes em navegador

**O que foi criado:** controles de toque (joystick analógico + botões por contexto),
layout responsivo, ajuste de qualidade por aparelho, e uma suíte Playwright que
abre o jogo num navegador real — desktop e celular emulado.

### A refatoração que veio antes dos botões

Cada slice escutava uma tecla física (`useKeyPress('KeyE')`). Adicionar toque desse
jeito criaria dois caminhos paralelos que divergiriam com o tempo. Antes de
desenhar qualquer botão, a entrada foi separada em duas camadas:

- **`shared/input.ts`** define **ações semânticas** (`interagir`, `confirmar`,
  `responder-1`…). As slices escutam a ação, nunca a tecla.
- Um único mapa `KEY_BINDINGS` traduz `event.code` → ação, montado uma vez na raiz.
- O toque chama `emitAction` diretamente.

Resultado: teclado e dedo entram exatamente pelo mesmo caminho. Um botão da tela
não pode se comportar diferente da tecla equivalente, porque é literalmente o
mesmo handler.

O movimento seguiu o mesmo princípio: `axesToDirection` passou a ser o caminho
comum, com o teclado entregando eixos de -1/0/1 e o joystick entregando qualquer
valor entre -1 e 1. O joystick é analógico — encostar de leve anda devagar, o que
ajuda a manobrar perto de um recurso.

### Decisões de toque

**Botões por contexto, não um teclado virtual fixo.** Não cabem oito comandos numa
tela de celular. "Colher" só aparece com algo ao alcance; "Construir"/"Cancelar"
só no modo construção; as respostas ficam no painel ancorado no recurso.

**`pointerdown`, não `click`.** O clique espera ~300 ms para decidir se foi toque
duplo; num jogo isso é atraso perceptível.

**Captura de ponteiro no joystick e rastreio de `pointerId` na câmera.** Sem o
`pointerId`, o polegar do joystick e o dedo da câmera se atropelavam: os dois
emitem `pointermove` na janela e o segundo sobrescrevia a referência do primeiro,
fazendo a câmera saltar.

**Qualidade por aparelho:** `dpr` limitado a 1.5, antialias desligado e mapa de
sombra de 512 no toque — o custo de pixel cresce com o quadrado do `dpr`, e é a
pior combinação possível num celular de tela densa e GPU fraca. E `fov` 70 em vez
de 55, porque `fov` no Three é vertical e uma tela em retrato deixaria o campo
horizontal estreito demais.

### O que os testes de navegador encontraram

Esta é a parte que justifica o Playwright. Nenhum destes seria pego pela suíte do
Vitest — todos apareceram ao **olhar** as telas capturadas:

| Bug | Causa |
| --- | --- |
| A ilha inteira cor de areia, sem sombra | O anel de areia terminava em `y = +0.05`, acima do gramado em `y = 0`, cobrindo tudo — e as sombras caíam nele, que não tinha `receiveShadow` |
| Personagem sem cabeça | A esfera da cabeça estava em `y = 0.72`, dentro da cápsula que vai até `0.8` |
| HUD anunciando "Noite" com o céu laranja | A curva `raw²` deixava quase toda a noite clara e escurecia só no fim |
| Noite escura a ponto de ser injogável | `sunIntensity 0.22` **passava** no teste (a asserção só exige "maior que zero") e mesmo assim a tela ficava preta |
| Receitas colidindo com os botões no celular | A media query estava no topo do CSS, antes das regras base, e perdia por ordem de cascata |

O quarto caso é o mais instrutivo: **número que passa em teste não é o mesmo que
número que funciona.** A asserção estava certa e insuficiente.

Além disso, o E2E expôs um problema de arquitetura real: `PlayerView` era montado
**por último** no canvas, e como o R3F executa os `useFrame` na ordem de montagem,
todos os consumidores de `playerTransform` (recursos, fantasma de construção,
inimigos) trabalhavam com a posição do quadro anterior — a 7 m/s, quase 12 cm de
erro em cada decisão de alcance. A ordem no `GameCanvas` agora é explícita e
comentada.

### Decisões do próprio E2E

**Roda contra o build de produção** (`vite preview`), não contra o dev server: é o
artefato que vai para o Pages, com o mesmo empacotamento.

**`--use-gl=swiftshader`** para WebGL por software; sem isso o canvas não
inicializa em ambiente sem GPU e o teste falharia por um motivo alheio ao jogo.

**Uma ponte de depuração (`window.__tabuada`)** expõe store, relógio e um
teleporte. Sem ela o teste só conseguiria apertar teclas no escuro. O teleporte
monta a cena ("de pé ao lado de uma árvore") em vez de atravessar a ilha correndo
— o piloto automático que fazia isso levava 4 minutos e falhava de forma
intermitente. Andar de verdade continua com teste próprio.

**A resposta certa é calculada a partir do enunciado exibido na tela**, e não do
estado interno. É assim que se prova que o texto que a criança lê corresponde à
conta que o jogo espera.

**Toque nativo via CDP**, porque `page.touchscreen` só faz toque simples e o
joystick precisa de arrasto. Uma única sessão CDP por gesto — criar uma sessão
nova só para soltar o dedo faz o Chromium responder *"Must send a TouchStart
first"*.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo (corrigidos: `set-state-in-effect` e `only-export-components`, movendo `useIsTouchDevice` para `shared/input.ts` com `useSyncExternalStore`) |
| `npm run test` | 282 testes, 18 arquivos, verde |
| `npm run e2e` | 16 testes, desktop + celular, verde |
| `npm run build` | ok |
