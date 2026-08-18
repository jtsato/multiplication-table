# Fase 4 — Regiões, pontes e cachoeiras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o jogo sair da tabuada do 2. O mundo vira um arquipélago de seis
regiões, cada uma com a sua tabuada, e explorar passa a ser progredir no currículo. É a
fase que liga o que as Fases 2 e 3 já construíram: hoje o chapéu, a coroa e os óculos
são inalcançáveis, o mural trava em 19 de 100 e toda conta paga 2 moedas.

**Design:** `docs/superpowers/specs/2026-08-18-ilha-cozy-design.md`

**Architecture:** Uma slice nova, `regions/`, que é dona da geografia e das pontes.
`world/` deixa de ser dono do formato do mundo e passa a ser dono do *terreno*.
`ISLAND` vira `REGIONS`; `isWithinIsland` vira `regionAt(position)`. Nenhuma slice nova
conhece as outras: quem compõe é `app/store.ts`, como sempre.

## Por que a ordem das tarefas é esta

A Task 1 sozinha — `perGroup` por nó — já destrava acessórios, mural e escala de
moedas. Ela não depende do arquipélago. Por isso vem primeiro e vai para a `main`
sozinha: se a fase inteira empacar no meio, o valor pedagógico maior já está no ar.

A geografia vem depois, e a arte por último. Um mundo bonito com a tabuada do 2 não vale
nada; a tabuada do 9 num mundo feio vale muito.

### Reordenação, decidida ao terminar a Task 3

Terminada a Task 3, medi quanto do arquipélago cai fora do terreno que existe de fato —
o disco de raio 30 que a Task 7 só iria substituir lá na frente:

| Região | Área fora do chão físico |
| --- | --- |
| Praia | 0% |
| Porto | 86% |
| Bosque, Cachoeira, Pomar, Pico | 100% |
| **Total** | **81%** |

Ou seja: os nós passaram a nascer nas seis regiões, mas quatro delas e meia ficam sobre
o nada, atrás de uma parede invisível em raio 30. A criança continua presa na tabuada do
2, agora com 30 dos 36 nós inalcançáveis.

E os 25 testes ponta a ponta passam assim mesmo, porque todos jogam perto do spawn —
dentro da Praia, a única região inteiramente em terra. Foi preciso medir para ver.

A spec exige que **cada fase termine jogável**. Um mundo cujos dados dizem uma coisa e
cujo chão diz outra não termina jogável. Por isso o terreno (antiga Task 7) e as pontes
(antiga Task 6) sobem para logo depois da Task 3: sem os dois, nada do que vier depois
pode ser exercitado de verdade. Colheitas regionais, destinos e arte descem na fila.

## Global Constraints

- **O contrato visual não pode quebrar.** `itemPlacements` desenha `groups × perGroup`
  itens e o enunciado pergunta exatamente esse número. Vale para todo `perGroup` de 2 a
  10, não só para 2. É o que separa este jogo de um quiz com enfeite 3D.
- **Nenhum recurso novo entra antes do destino existir.** Regra da spec, e já existe um
  teste que varre isso. A fruta chegou ao jogo sem destino e virou contador; não repetir.
- **Água não pune.** Cair no rio não tira nada e não reinicia nada — simplesmente não se
  entra na água. O limite é parede invisível, como a borda da ilha é hoje.
- **Nenhum asset externo.** Cachoeiras são caixas low poly descendo em laço.
- Nada que muda por quadro passa por React. As duas regras de performance do projeto
  continuam valendo, e a região do jogador é um valor publicado com throttle, não um
  seletor de hook.

## Uma preocupação que registro aqui, e não resolvo sozinho

A spec diz que a ponte "só abre com a tabuada local dominada", e `tableIsMastered`
exige os **dez** fatos. Como troféu de guarda-roupa isso é ótimo. Como portão de
progressão é pesado: uma criança que empaca em `7×8` fica trancada fora do resto do
mundo, e num jogo cujo não-objetivo declarado é não punir, esse é o tipo de atrito que
aparece disfarçado de dificuldade.

Implemento o que a spec aprovou, mas com o limiar num **único constante nomeada**
(`BRIDGE_MASTERY`), para que afrouxar seja uma linha. Minha recomendação, para o autor
decidir: exigir 7 dos 10 fatos, e não os 10.

## Fora do escopo, e por quê

**Os animais e o pet não entram** — são a Fase 5, mesmo aparecendo na tabela de regiões
da spec. A tabela descreve o destino final de cada região, não o conteúdo desta fase.

**Os NPCs e as encomendas não entram** — Fase 6. Isso importa para os recursos: dos
quatro destinos que a spec lista, encomendas, animais e horta são das fases seguintes.
Sobra **a casa**. Por isso esta fase entrega decoração da casa como ralo dos recursos
novos (Task 5) — sem ela, seis colheitas novas entrariam sem destino e a fase
reintroduziria exatamente o defeito da fruta, agora seis vezes.

**O baú continua fora**, pelo mesmo motivo da Fase 3: não existe limite de mochila, e a
decisão de criar um é do autor.

---

### Task 1: `perGroup` sai da constante global e vai para o nó

**Files:** `src/slices/resources/resources.logic.ts`, `resources.test.ts`;
`src/slices/math/math.logic.ts`, `math.test.ts`; `src/slices/math/math.store.ts`

**Interfaces:** `ResourceNode` ganha `perGroup: number`. `RESOURCES.itemsPerGroup` morre.
`itemPlacements(node)` e `generateChallenge(target, …)` leem `target.perGroup`.

- [x] **Step 1: Testes que provam o contrato para todo `perGroup`**

Casos: para cada `perGroup` de 2 a 10, `itemPlacements` devolve `groups × perGroup`
posições; o enunciado gerado pergunta exatamente `groups × perGroup`; dois itens do
mesmo grupo não nascem na mesma posição; a constante global não existe mais em lugar
nenhum (varredura por `itemsPerGroup`).

O teste de hoje fixa `perGroup` em 2 e por isso nunca provou nada — é o buraco que
deixou o defeito passar.

- [x] **Step 2 a 5:** falha, implementação, verificação, commit.

`ChallengeTarget` já é estrutural, então a fogueira continua satisfazendo a forma sem
saber o que é região. `TABLE` é apagada: hoje ela só é consumida pelos testes, porque
`generateChallenge` já lia `RESOURCES.itemsPerGroup` — o número 2 mora em dois lugares
e essa duplicação é o que esta task elimina.

---

### Task 2: A geografia — `REGIONS` e `regionAt`

**Files:** `src/slices/regions/regions.logic.ts`, `regions.test.ts`, `index.ts`

**Interfaces:** `REGIONS: Region[]` com `id`, `nome`, `center`, `radius`, `groundY` e
`tables: number[]`; `regionAt(position): Region | null`; `isOnLand(position)`;
`randomGroundPositionIn(region, rng)`.

**Correção de ordem, feita ao executar:** a versão original desta task também dava
`harvest: ResourceKind[]` à região, e a Task 3 fazia o nó herdar tabuada **e** tipo de
recurso. Isso é circular: as colheitas regionais só existem como tipo na Task 4, e criá-las
antes da Task 5 quebraria a regra de não entrar recurso sem destino. A colheita passa para
a Task 4, junto com os tipos. A Task 3 fica só com a tabuada — que é a parte que destrava
o conteúdo trancado, e agora não depende de mais nada.

Seis discos numa curva aberta, na ordem didática — Praia (2), Porto (5 e 10), Bosque
(3 e 4), Cachoeira (6), Pomar (7 e 8), Pico (9). Vizinhas se tocam só onde vai a ponte;
o resto é água.

- [x] **Step 1: Testes da geografia**

Casos: a Praia contém a casa e a origem, porque é onde o jogo começa; `regionAt` devolve
`null` na água; nenhuma região se sobrepõe a outra; toda região tem pelo menos uma
tabuada; as tabuadas cobrem 2 a 10 sem repetir e sem buraco; a ordem das regiões é a
ordem didática, não a numérica; regiões vizinhas ficam perto o bastante para uma ponte
e as não vizinhas, longe demais para atravessar sem uma.

- [x] **Step 2 a 5:** falha, implementação, verificação, commit.

---

### Task 3: A região manda na tabuada do nó

**Files:** `src/slices/resources/resources.logic.ts`, `resources.test.ts`

`createNodes` passa a espalhar por região: cada nó nasce dentro de uma região e recebe
`perGroup` sorteado entre as tabuadas dela. O `kind` continua como está até a Task 4,
que é quando as colheitas regionais passam a existir.

- [x] **Step 1: Testes**

Casos: todo nó cai dentro de alguma região e nenhum na água; o `perGroup` de um nó é uma
das tabuadas da região onde ele está; toda região recebe pelo menos um nó; nenhuma
tabuada fica sem nó no mundo inteiro — senão um acessório vira inalcançável de novo, que
é o defeito que esta fase existe para consertar; a casa continua sem nó dentro.

- [x] **Step 2 a 5:** falha, implementação, verificação, commit.

**É aqui que a fase paga o ingresso.** Terminada esta task, `knownFacts` passa a receber
fatos de todas as tabuadas: chapéu, coroa e óculos ficam alcançáveis, o mural pode
passar de 19, e a moeda escala com a dificuldade sem nenhuma regra nova.

---

### Task 4: Os recursos novos e seus enunciados

**Files:** `src/slices/resources/resources.logic.ts`; `src/slices/math/math.logic.ts`,
`math.test.ts`

Entram conchas, peixes, cogumelos, cristais, mel e gelo, e a região ganha `harvest`.
Madeira, fruta e pedra sobrevivem, com região definida. O nó passa a sortear o `kind`
entre as colheitas da região onde nasceu.

- [x] **Step 1: Testes**

Casos: todo `ResourceKind` tem entrada em `CHALLENGE_CONTEXTS`, em `RESOURCE_LABELS` e
em alguma `harvest` de região — três varreduras que falham se alguém acrescentar um tipo
pela metade. E a concordância: "Quantas conchas" mas "Quantos cogumelos", provada tipo a
tipo, porque sem o gênero o enunciado sai errado em português.

- [x] **Step 2 a 5:** falha, implementação, verificação, commit.

---

### Task 5: O destino dos recursos novos — a casa que evolui

**Files:** `src/slices/economy/economy.logic.ts`, `economy.test.ts`;
`src/app/ShopPanel.tsx`

Itens de decoração da casa, cada um custando moedas **e** uma colheita regional. Ralo
permanente, não consumível — o oposto de item descartável.

- [x] **Step 1: Testes**

O caso que vale por si: a varredura "todo recurso do jogo é consumido por alguma coisa"
passa a cobrir os seis tipos novos. Ela já existe e é ela que impede esta fase de repetir
o defeito da fruta. Mais: decoração comprada não some, e não dá para comprar duas vezes.

- [x] **Step 2 a 5:** falha, implementação, verificação, commit.

---

### Task 6: As pontes

**Files:** `src/slices/regions/bridges.logic.ts`, `bridges.test.ts`,
`regions.store.ts`; modificar `src/app/store.ts`

**Interfaces:** `BRIDGES` ligando regiões vizinhas, com `coins`, `recipe` e a tabuada
exigida. `bridgeIsOpen(bridge, owned)`; `checkBridge(bridge, coins, inventory,
knownFacts)`; `BRIDGE_MASTERY` como o limiar de domínio.

- [x] **Step 1: Testes**

Casos: ponte fechada barra a travessia; comprada e com a tabuada dominada, abre; com
moedas mas sem domínio, recusa, e a recusa diz **qual** das duas coisas falta; a Praia
nunca é trancada; o grafo das pontes alcança todas as seis regiões a partir da Praia —
sem esse teste um erro de dados isola uma região para sempre.

- [ ] **Step 2 a 5:** falha, implementação, verificação, commit.

---

### Task 7: O mundo em cena

**Files:** `src/slices/world/WorldView.tsx`, `WorldView.test.tsx`;
`src/slices/regions/BridgeView.tsx`; `src/slices/daynight/DayNightView.tsx`

Seis discos de terreno, água entre eles, colisores nas bordas com vão aberto onde a
ponte está aberta. A câmera de sombra do sol passa a enquadrar o arquipélago inteiro, e
não mais `ISLAND.radius`.

- [x] **Step 1: Testes de cena**

Casos: existe terreno para cada região; a ponte fechada tem colisor e a aberta não; o
jogador não atravessa a água nadando.

- [ ] **Step 2 a 5:** falha, implementação, verificação, commit.

---

### Task 8: Cachoeiras e vaga-lumes

**Files:** `src/slices/regions/WaterfallView.tsx`; `src/slices/lantern/FirefliesView.tsx`,
testes

Cachoeiras nos desníveis, em laço. E os enxames de vaga-lumes, que a spec atribui a esta
fase: recarregam a lanterna no campo e são visíveis no escuro por definição, então não
criam dependência circular.

- [x] **Step 1: Testes**

Casos: o laço da cachoeira não acumula deriva ao longo do tempo; o vaga-lume só recarrega
de noite; encostar recarrega sem pedir conta; a recarga respeita o teto de carga.

- [x] **Step 2 a 5:** falha, implementação, verificação, commit.

**Dois defeitos que só o navegador mostrou.** A cachoeira instanciada punha cinco malhas na
cena em vez de cinquenta e seis — lia como duas lajotas boiando. E o vaga-lume recarregava
com `1 / 60` cravado no lugar do delta do quadro: com WebGL por software o quadro dura mais
que isso, a lanterna expirava antes do quadro seguinte e a carga travava em 0,03 s. Os dois
agora têm teste — de cena e ponta a ponta.

---

### Task 9: O HUD conta de dez em dez

**Files:** `src/app/Hud.tsx`, `Hud.test.tsx`

As moedas se empilham em dezenas no HUD — reforço passivo da tabuada do 10, sem nenhuma
pergunta ser feita. **Isso já existia**, com teste próprio (`hud-dezenas`); foi entregue
antes desta fase e não precisou ser refeito. O que entrou aqui foi o **nome da região**
no HUD, para o mundo ficar legível: "estou no Pico" e "aqui é a do 9" têm que ser a mesma
informação.

- [ ] **Step 1: Testes**

Casos: 34 moedas mostram três pilhas de dez e quatro soltas; zero não mostra pilha
nenhuma; o nome da região acompanha a travessia.

- [ ] **Step 2 a 5:** falha, implementação, verificação, commit.

---

### Task 10: Olhar a tela

- [ ] **Step 1:** rodar a suíte e2e e **abrir as capturas em `e2e/telas/`**.

Não é formalidade. Foi olhando as telas que apareceram a noite preta, o jogador em
silhueta e os móveis fora da casa — três defeitos que passaram por baixo de testes
verdes. Uma fase que muda o mundo inteiro não termina sem isso.

- [ ] **Step 2:** capturas novas por região, e uma da travessia de ponte.


---

## Dívida visual registrada, para a Task 10 — resolvida antes da hora

Com a tabuada grande, o anel de grupos de um nó crescia até 2,6 de raio: os itens ficavam
contáveis, mas a planta no meio continuava do mesmo tamanho e o nó lia como uma paliçada
de quatro metros em volta de uma árvore pequena. Apareceu numa captura do Porto.

Resolvido sem passe de arte: os grupos passaram a se distribuir em **voltas de cinco**,
subindo em andares como galhos, em vez de disputarem um anel só. O raio caiu de 2,6 para
1,63 e o nó voltou a ler como planta. O `minSpacing` acompanhou.
