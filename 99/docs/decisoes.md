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

---

## Fatia 8 — Ajustes de jogabilidade

Dois problemas relatados por quem jogou: *"fica noite muito rapidamente, não dá
tempo para montar o acampamento"* e *"os monstros passam por dentro da cerca"*.

### A cerca não barrava nada — e o comentário mentia

O segundo é o mais sério, e a causa é constrangedora. O comentário em
`EnemiesView` dizia:

> *"Sao cinematicos por posicao: a cerca os bloqueia por teste de segmento, nao
> por colisao."*

**Esse teste de segmento nunca foi escrito.** Os inimigos andam por posição e não
são corpos do Rapier, então o colisor da cerca — que barra o jogador — não tinha
nenhum efeito sobre eles. A construção prometia uma defesa que não existia, e
nenhum teste cobria isso porque eu havia descrito o comportamento em prosa em vez
de codificá-lo.

A correção é `stepAvoidingFences`: teste de **segmento contra segmento** entre o
passo do inimigo e a barra da cerca. Segmento, e não ponto-dentro-de-área, porque
com passos de até 22 cm por quadro um teste pontual deixaria o inimigo "pular"
para o outro lado sem nunca ter estado dentro da cerca. Quando o caminho direto
cruza, o inimigo tenta deslizar só em X, depois só em Z — assim contorna a ponta
da cerca em vez de tremer contra ela, e fica realmente barrado quando não há
desvio.

Mais um caso de ponto flutuante: `cos(π/2)` vale 6e-17, não zero, e esse resíduo
fazia um movimento *rente* à cerca contar como travessia — o inimigo que só
deslizava ao lado dela ficava congelado. Resolvido com tolerância no sinal da
orientação.

**Cobertura:** 14 testes de unidade para geometria e desvio, um teste de
integração que cerca o jogador com um anel de 12 cercas e verifica que ninguém
entra — **com contraprova**: o mesmo cenário sem cerca afirma que os inimigos
*chegam*. Sem essa contraprova, o teste passaria mesmo se os inimigos ficassem
parados por outro motivo qualquer. E um teste ponta a ponta em navegador.

### O dia era curto demais

O ciclo foi de 180 s para **300 s**, e o dia de 50% para **60%** — de 90 s para
180 s. Montar uma fogueira exige colher madeira e pedra, e cada colheita passa
por caminhar até o recurso, contar os grupos e responder. Para uma criança isso
não é questão de segundos: é o tempo de ler e pensar.

Distribuição nova: dia 180 s · entardecer 30 s · noite 66 s · amanhecer 24 s. A
fogueira queima 50 s, então uma noite de 66 s exige exatamente um reabastecimento
— que é onde a matemática volta a decidir a sobrevivência.

**Aviso explícito no entardecer:** *"A noite está chegando — acenda uma fogueira!"*
com contagem regressiva. Saber que o tempo está acabando não deveria depender de
a criança interpretar a cor do céu.

### Testes que deixaram de usar números mágicos

Os testes usavam posições literais do ciclo (`phaseFor(0.55)`) e quebraram em
massa com a mudança de ritmo. Passaram a derivar das constantes
(`meio('entardecer')`), inclusive no E2E via `irParaOMeioDe`. Ritmo de jogo é
número de ajuste — vai mudar de novo, e mudá-lo não deveria quebrar dezenas de
testes que não têm nada a ver com isso.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run test` | 303 testes, 18 arquivos, verde |
| `npm run e2e` | 18 testes, desktop + celular, verde |
| `npm run build` | ok |

---

## Fatia 9 — Legibilidade e ritmo no celular

### O painel do desafio estava pequeno demais

Relato: *"no celular fica difícil de ler"*. Medido na captura: numa tela de ~390 px
o painel saía com cerca de 176 px de largura, e o enunciado ficava com fonte
minúscula — justamente o texto que a criança precisa ler com calma para contar os
grupos.

A correção levou **três iterações, cada uma verificada por captura de tela** —
não dava para acertar isso no escuro:

1. Baixei `distanceFactor` de 11 para 6.5 e o painel **encolheu**. Eu tinha a
   direção invertida: o valor é diretamente proporcional ao tamanho na tela.
2. Subi para 22 e ficou legível, mas vazava da tela e **tapava a árvore** cujos
   galhos a criança precisa contar — o enunciado anulava a própria cena que
   descreve.
3. Fechou em 15, com a âncora subindo de `+3.1` para `+4.6` no toque. Legível,
   dentro da tela, com o objeto contável visível abaixo.

O passo 2 é o mais interessante: uma correção de legibilidade quebrou a mecânica
central. Sem olhar, teria passado como "resolvido".

### Câmera lenta enquanto a criança responde

Pedido: os monstros deveriam andar mais devagar com o painel aberto, *"assim não
gera uma ansiedade na criança para responder rápido"*.

É o ajuste mais fino do projeto até aqui, porque mexe na tensão entre duas
decisões que já estavam certas. O jogo **não pausa** — isso é o que faz a conta
ser ferramenta e não prova. Mas correr o tempo cheio enquanto a criança conta os
grupos transforma tensão em pressa, e **pressa é inimiga de aprender: quem tem
medo de demorar chuta em vez de contar**.

A solução preserva as duas coisas: os inimigos correm a **25%** da velocidade com
o desafio aberto. O mundo segue visivelmente vivo — os vultos continuam se
aproximando — sem cobrar rapidez de cálculo. O intervalo entre danos é esticado na
mesma proporção, para um inimigo já encostado não continuar mordendo no ritmo
normal enquanto a criança lê.

**A câmera lenta vale só para os inimigos.** O relógio do dia e o combustível da
fogueira continuam correndo: se a noite também desacelerasse, abrir um desafio
viraria um jeito de esticar a noite. Há teste afirmando exatamente isso.

E o painel avisa — *"Os monstros ficam lentos. Conte com calma."* — só quando há
monstros na ilha. Dizer isso de dia, sem nenhum monstro por perto, plantaria um
medo que não estava lá.

### Um bug que eu mesmo introduzi

Adicionar `useIsTouchDevice` ao painel quebrou os 7 testes do `ChallengePanel`:
o **jsdom não implementa `window.matchMedia`**. Agora a consulta é opcional e o
padrão é "não é toque" — o comportamento certo tanto no jsdom quanto num
navegador antigo.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run test` | 309 testes, 18 arquivos, verde |
| `npm run e2e` | 18 testes, desktop + celular, verde |
| `npm run build` | ok |

---

## Fechamento da dívida DIV-001 — Decorações visíveis na casa

**O que foi criado:** as seis decorações da loja — tapete, aquário, vaso, lustre,
prateleira e escultura — passam a aparecer dentro da casa assim que compradas, e
continuam lá depois de recarregar a página.

### Decisões

**O catálogo visual mora em `home/`, não em `economy/`.** A casa sabe o que ela
exibe; a loja sabe o que ela vende. `HOME_DECORATION_KINDS` e
`HOME_DECORATION_OFFSETS` ficam em `home.logic.ts`, e o componente
`HomeDecorations` lê `owned` do store composto — a slice de economia não é
importada por `home/`, como manda a regra vertical. Um teste cruza as duas
listas para que ninguém acrescente uma peça à loja sem desenhar na casa.

**As posições são dados testados, não números soltos na cena.** Cada offset é
verificado contra as paredes e contra os móveis interativos. O lustre pendura do
teto e a prateleira fica na parede, em altura diferente — por isso só as peças
de piso disputam o chão com espelho, mural e cama.

**Cada peça é primitiva low poly, como todo o jogo.** Nenhum asset externo. A
escultura usa o mesmo octaedro dos cristais da cachoeira; o aquário tem dois
peixes, porque a loja promete "os peixes ficam nadando"; o vaso tem cogumelos,
porque promete "brilha um pouquinho à noite". O efeito descrito no catálogo vira
coisa visível.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 560 testes, 38 arquivos, verde |
| `npm run e2e` | verde, incluindo o novo caso de decoração |
| `npm run build` | ok |

---

## Fase 5 — Animais, pet e caderneta

**O que foi criado:** animais de ambiente por região, alimentar → amigo, caderneta
na casa, pet que segue o jogador, raros com janela atrelada a sequência de
acertos e a baleia do Porto como acontecimento visual.

### Decisões

**Animal nunca é nó de colheita.** A regra tonal da spec virou código: não existe
colher bicho. O animal é alvo de um desafio de `alimentar` — o pedido é uma
multiplicação, e o acerto debita a comida e registra amizade. Errar não debita
nada: a criança vê a resposta certa e pode tentar de novo.

**A conta de alimentar reusa o `ChallengePanel` inteiro.** A slice de matemática
só ganhou um propósito novo; o alvo é `{ id, kind, groups, perGroup }` como
sempre. `kind` é a comida do animal, então o enunciado sai natural: "3 cachos com
4 frutas cada" para o cachorro que come fruta.

**Caderneta mora na casa, mas os dados moram em `wildlife/`.** `AnimalBookPanel`
lê o store composto; `home/` só ganhou um móvel novo (`caderneta`). O save guarda
apenas os animais que já apareceram — os ausentes são tratados como "ainda não
visto" pela interface, o que mantém saves antigos compatíveis sem subir a versão.

**Raro é janela, não sorte.** `animalIsVisible` exige sequência mínima de acertos
(`WILDLIFE.rareStreak`) e fase certa: unicórnio na Cachoeira à noite, dinossauro
no Pico de dia. O raro existe no estado sempre; a view decide se a janela está
aberta. Assim a caderneta conhece a espécie antes de ela aparecer.

**O pet é posição, não física.** `petTransform` vive fora do React, como
`playerTransform`, e `petFollow` é uma função pura com teste de não-ultrapasse —
o mesmo cuidado do `stepToward` dos inimigos removidos. O pet desenterra uma moeda
a cada 30 s, sem nenhuma escrita por quadro no store. E fareja o nó mais próximo:
a cabeça vira para ele dentro do `useFrame`, outro gesto que não passa pelo React.

**A baleia é janela pura, não estado.** `whaleState(clock)` decide se o corpo
está visível e `whaleHeight` o faz subir na primeira metade da janela e mergulhar
na segunda. O `WhaleView` só move um grupo no `useFrame`; o acontecimento não
escreve no store, não dá moeda e não abre desafio — é exatamente o contrário de
uma mecânica.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 593 testes, 43 arquivos, verde |
| `npm run e2e` | verde, incluindo pet, caderneta e baleia |
| `npm run build` | ok |

---

## Fase 6 — NPCs e encomendas

**O que foi criado:** um NPC de encomendas por região, com pedido diário
determinístico; a guardiã da ponte agora cobra uma conta antes de liberar a
compra da travessia; a comerciante abre a loja no mundo; o professor mostra a
tabuada de graça em qualquer lugar; e a casa ganhou o quadro de encomendas para
consultar os pedidos do dia sem sair do porto seguro.

### Decisões

**Encomenda é a conta, e o pagamento é moeda.** O pedido usa o recurso da região
e a tabuada da região — "3 feixes de 4 frutas" —, a criança resolve, a mochila
debilta a quantidade e o NPC paga moedas. Não é venda: o recurso continua sendo o
resultado da conta; o que mudou é que ele ganhou mais um destino.

**A guardiã veio antes da compra, não no lugar dela.** A ponte continua exigindo
moedas, recursos e tabuada local; o que mudou é que o `E` na ponte agora abre um
desafio de `pedagio` e só o acerto chama `buyBridge`. Errar não custa nada — é a
mesma gentileza de alimentar.

**NPC é só uma forma de abrir o que já existe.** A comerciante chama o mesmo
`toggleShop` do `L`; o professor chama o mesmo mural da casa. Nenhum painel novo,
nenhuma física nova — o mundo ganha gente sem o jogo ganhar uma mecânica
duplicada.

**O quadro de encomendas é consulta, não entrega.** Ele usa os mesmos `orders` e o
mesmo `challengeText` dos NPCs; a entrega continua acontecendo na região, com o
painel ancorado no mundo. A casa mostra o destino — o trabalho é lá fora.

**Encomenda e pedágio são só mais dois propósitos no `ChallengePanel`.** A slice
de matemática não conhece NPC nem ponte: `encomenda` chama `completeOrder` e
`pedagio` chama `buyBridge` no acerto. O resto do painel, da dica e das moedas
continua igual.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 608 testes, 44 arquivos, verde |
| `npm run e2e` | verde, incluindo encomenda, pedágio, NPCs e quadro |
| `npm run build` | ok |

---

## Fase 7 — Horta

**O que foi criado:** sementes na loja, canteiro no Pomar, plantio no mesmo dia e
colheita de graça no dia seguinte.

### Decisões

**Semente é consumível, não melhoria.** A loja trata `sementes` como a dica:
compra acumula em `seeds`, plantar debita uma. O catálogo ganhou a categoria
`horta`, sem painel novo — a loja continua uma lista única.

**A horta paga por voltar, não por acertar.** O ciclo plantio → dia seguinte →
colheita usa o dia derivado do relógio vivo (`dayNumber`), e colher entrega frutas
sem desafio. É o destino de recurso que recompensa o retorno ao Pomar, em vez de
mais uma conta no campo.

**Horta e sementes são duráveis.** `GameSave` ganhou `seeds` e `garden`; saves
antigos seguem válidos porque os campos ausentes recebem os padrões.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 617 testes, 45 arquivos, verde |
| `npm run e2e` | verde, incluindo plantio e colheita |
| `npm run build` | ok |

---

## Fase 8 — Guardiã visível nas pontes

**O que foi criado:** a guardiã da ponte deixou de ser só lógica e texto de HUD.
Cada ponte fechada agora tem uma guardiã em pé na margem de origem, de lanterna na
mão, pronta para cobrar a conta do pedágio.

### Decisões

**A guardiã fica na margem de origem, não no tabuleiro.** A posição vem de
`bridgeGuardPosition`, função pura derivada das âncoras da ponte: um passo para
dentro da região e outro para o lado. Ficar no meio do tabuleiro bloquearia a
passagem depois que a ponte abrisse — e a guardiã cobra a tabuada de onde se sai,
então o lugar dela é a margem de saída.

**A guardiã some quando a ponte abre.** Enquanto há pedágio a cobrar, ela é a cara
da compra; ponte aberta, o trabalho dela acabou e o tabuleiro fica livre. A
`RegionsView` só desenha a guardiã para pontes fechadas.

**A guardiã é visual, não um NPC novo.** Ela reaproveita as primitivas dos outros
NPCs (corpo, cabeça, placa) e ganha uma lanterna para se distinguir de longe. A
interação continua a mesma — chegar perto e apertar `E` — porque a guardiã é a
tradução visual de um pedágio que já existia.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 623 testes, 47 arquivos, verde |
| `npm run e2e` | verde, incluindo travessia de ponte com guardiã |
| `npm run build` | ok |

---

## Fase 9 — Cozy e juice

**O que foi criado:** quatro levas de acabamento para o jogo não parecer um quiz
com enfeite 3D — feedback sensorial (juice), mundo vivo, eventos diários e
progresso visível na ilha.

### Decisões

**Áudio é dado puro, não asset.** `src/shared/audio.ts` descreve cada efeito
como `SOUND_PRESETS` (notas e ruído filtrado) e toca com Web Audio na hora.
Mantém a regra de zero asset externo, permite testar a partitura sem navegador e
dá volume/silêncio sem trocar arquivos.

**Partículas e tremor vivem fora do React.** O `JuiceView` usa um `Points`
reutilizado e arrays mutáveis de módulo, no mesmo padrão do `playerTransform`: o
que muda por quadro não passa por re-render. O tremor do erro decai sozinho e
some em ~0,5 s — o suficiente para dizer "não bateu" sem virar punição.

**O mundo vivo é barato e determinístico.** Borboletas/pássaros (`ambient`) e
tufos de vento (`wind`) são poucos, com posições derivadas da semente do mundo.
A borboleta foge do jogador com uma função pura; a vegetação dobra para o lado
oposto; o pet descansa quando o jogador para — tudo sem física nova.

**Eventos diários são derivados do dia, não estado salvo.** `eventForDay(day)`
é determinístico: chuva, fartura, visitante e baleia-na-praia mudam o sabor do
dia sem exigir persistência. Fartura dobra a colheita; chuva faz a horta render
no mesmo dia; visitante ganha um barco no Porto; baleia-na-praia move a baleia.

**Progresso aparece no mundo.** Pontes abertas ganham luzes nas pontas e o
quintal da casa floresce com pontes abertas e decorações compradas. É o "poder
mostrar" da economia agora visível também do lado de fora.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 666 testes, 55 arquivos, verde |
| `npm run e2e` | verde |
| `npm run build` | ok |

---

## Fase 9E — Persistência

**O que foi criado:** o save passou a guardar também as **construções** (fogueira
e cercas) e o **relógio do jogo** — até aqui, fechar a página apagava o que a
criança construiu e zerava o dia, o que deixava a horta plantada no dia 3 abrindo
como pronta no dia 1.

### Decisões

**Construção é progresso, não acidente de sessão.** `structures` entrou no
`GameSave` e é restaurada por `loadStructures`, que também ajusta o contador de
ids — sem isso, construir depois de um reload geraria `fogueira-1` de novo e as
duas brigariam no mesmo array.

**Relógio salvo para o combustível continuar sendo prazo.** A fogueira guarda
`fuelUntil` como instante do relógio do jogo. Persistir só o dia não bastaria:
salvar `clockSeconds` faz `fuelRemaining` continuar correto depois do reload, e o
dia exibido no HUD é derivado do mesmo número.

**Versão 1 migra em silêncio.** `SAVE_VERSION` subiu para 2; um save da versão 1
ganha `structures: []` e `clockSeconds: 0` e segue jogável. Dado malformado
continua derrubando o save de propósito — bug de programa não pode virar
progresso corrompido.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 669 testes, 55 arquivos, verde |
| `npm run build` | ok |

---

## Fase 9F — Menu de configurações

**O que foi criado:** um painel de configurações acessível por um botão fixo no
canto superior direito, com **volume de áudio**, **sensibilidade da câmera**,
**idioma** e **tela cheia**. Volume e sensibilidade entram no save (versão 3) e
sobrevivem ao reload.

### Decisões

**Volume mestre é um valor do motor, não um toggle de sessão.** `setAudioVolume`
escreve no `GainNode` do Web Audio e guarda o valor desejado mesmo antes de o
`AudioContext` existir — quando o primeiro gesto libera o áudio, ele já nasce no
volume escolhido.

**Sensibilidade multiplica o comportamento existente.** Em vez de duplicar as
constantes de mouse/toque/teclado, a preferência é um multiplicador aplicado no
mesmo lugar onde o yaw é calculado. Mouse e toque continuam com proporções
diferentes; o jogador só ajusta o "quão rápido" ambos giram.

**Idioma continua no save, agora também no painel.** O `LanguagePicker` da tela
principal permanece (criança vê o que existe); o painel adiciona o mesmo
controle em um lugar de ajustes, sem criar um segundo estado de idioma.

**Tela cheia não é persistida.** É um estado do navegador, não do jogo — o
painel apenas espelha `fullscreenchange` para o rótulo ficar correto.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 681 testes, 58 arquivos, verde |
| `npm run build` | ok |

---

## Fase 9G — Construção com vínculo pedagógico

**O que foi criado:** construir uma fogueira ou cerca agora **exige uma conta de
tabuada** — o jogador posiciona, aperta Espaço (ou toca em Construir) e resolve o
desafio. Acertou, a construção ergue; errou, nada é gasto e dá para tentar de
novo. Pontes continuam com o pedágio de sempre.

### Decisões

**A receita vira a tabuada.** A fogueira pede 8 grupos de 4 (8×4 — os 8 madeiras
e 4 pedras da receita); a cerca vira 3 grupos de 2 (3×2 — as 6 madeiras). O
desafio nunca é arbitrário: a criança está contando o material que vai gastar.

**Errar não cobra material.** `requestBuild` valida a posição e guarda a
construção como `pendingBuild`; só `completePendingBuild` debita os recursos e
ergue a estrutura. Assim o erro mantém o acolhimento do resto do jogo — a conta
certa é a moeda de progresso, não o castigo.

**O fluxo antigo continua no store.** `placeStructure` segue existindo para a
finalização interna e para testes; a view e o desafio usam o novo caminho
`requestBuild → completePendingBuild`. Isso manteve o modo fantasma, o encaixe de
cercas e o custo de recursos intactos.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 685 testes, 58 arquivos, verde |
| `npm run build` | ok |

---

## Fase 9H — Coerência física

**O que foi criado:** conchas e pedras deixaram de flutuar na altura do peito.
Agora elas são **itens de chão**: ficam espalhadas rentes ao chão em volta da
base do nó, continuam perfeitamente contáveis para a tabuada e não quebram a
física do mundo.

### Decisões

**O tipo do recurso decide o chão ou o galho.** `GROUND_ITEMS` (`concha`,
`pedra`) usa altura `0.08` e cada volta extra de grupos vira um **anel mais
largo** no chão. Madeira, fruta, cristal e os demais continuam em galhos
(altura 1.15+), porque pendurar concha no ar é que era o problema.

**Contar continua sendo a regra.** O layout preserva a separação entre itens e a
distância fora da base — a mudança é só no eixo Y. Os testes de contrato visual
continuam passando e ganharam dois novos: “concha/pedra ficam rentes ao chão” e
“itens de galho continuam acima do chão”.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 687 testes, 58 arquivos, verde |
| `npm run build` | ok |

---

## Fase 9I — Elementos lúdicos/fantasia

**O que foi criado:** unicórnio e dinossauro ganharam **presença de ambiente**.
Antes eles existiam só como raros — apareciam em janela curta e exigiam
sequência de acertos, então a criança podia jogar muito tempo sem nunca ver um.
Agora o unicórnio pasta na Cachoeira e o dinossauro vive no Pico **sempre**, e a
janela rara da mesma espécie virou um segundo encontro premiado.

### Decisões

**Fantasia não é sorte, é lugar.** Em vez de criar um modo novo, colocamos as
duas espécies no `AMBIENT_BY_REGION` das suas regiões. Elas já tinham visual
próprio (chifre dourado, cauda, cor verde) e já entravam na caderneta/loja de
pet — faltava a criança vê-las de verdade.

**O raro continua raro, agora como bônus.** A janela rara (noite para o
unicórnio, dia para o dinossauro, com sequência de acertos) continua existindo.
Ela não é mais a única chance de encontrar a criatura: é a chance de encontrar
**outra** dela, premiando quem já está treinando a tabuada.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 688 testes, 58 arquivos, verde |
| `npm run build` | ok |

---

## Fase 9J — UI mobile

**O que foi corrigido:** o seletor de idioma e o joystick ficavam **ambos no
canto inferior esquerdo** — no celular, as opções de idioma cobriam a área de
movimento. O idioma subiu para o **canto superior esquerdo**, longe do polegar,
dos botões de ação e do botão de configurações.

### Decisões

**O idioma é descoberta, não HUD de movimento.** No computador ele ficava no
rodapé sem atrapalhar; no celular disputava o mesmo canto do joystick. Mover para
o topo esquerdo mantém a descoberta (continua visível, sem menu) e libera o
polegar esquerdo inteiro para andar.

**O teste E2E agora prova a separação.** O primeiro teste do celular mede os
`boundingBox` do `.language` e do `.touch__joystick` e exige que o idioma termine
antes de o joystick começar — se alguém mover um deles de volta para o mesmo
canto, a suíte falha.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 688 testes, 58 arquivos, verde |
| `npm run build` | ok |

---

## Fase 9K — Identidade visual

**O que foi criado:** personagens deixaram de ser manequins geométricos.

- **Jogador**: ganhou **rosto low-poly** (dois olhos e um sorriso) — continua
  personalizável por silhueta, pele, roupa, cabelo e acessórios, mas agora
  expressa uma pessoa, não uma capsula vestida.
- **NPCs**: ganharam rosto e **acessórios por papel** — o professor tem óculos, o
  comerciante tem chapéu de feira e o entregador de encomendas tem boné. Cada um
  se lê de longe pelo ofício, não só pela placa.

### Decisões

**Identidade é função, não decoração.** Em vez de aleatorizar cores, cada
acessório conta quem é aquele personagem: óculos = quem ensina, chapéu = quem
vende, boné = quem entrega. A criança reconhece o NPC pelo papel antes de chegar
perto.

**Tudo continua primitiva e flat.** Olhos, sorrisos e acessórios são caixas,
cilindros e meias-esferas com as cores da paleta existente — zero asset externo,
zero textura, mesma regra do projeto.

### Portões

| Portão | Resultado |
| --- | --- |
| `npm run lint` | limpo |
| `npm run typecheck` | limpo |
| `npm run test` | 688 testes, 58 arquivos, verde |
| `npm run build` | ok |
