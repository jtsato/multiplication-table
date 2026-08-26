# Ilha cozy: exploração, moedas e porto seguro

## Objetivo

Trocar o motor emocional do jogo. Hoje ele é movido por ameaça — a noite cobra, os
vultos perseguem, perder é possível. A criança joga para **não morrer**.

O jogo passa a ser movido por pertencimento: um lugar que recompensa quem volta. A
criança joga para **descobrir, colecionar e cuidar**. A matemática continua sendo a
única moeda de progresso — o que muda é o que ela compra.

Nada aqui afrouxa a exigência pedagógica. O princípio que separa este jogo de um
quiz com enfeite 3D continua valendo: o enunciado descreve a cena, e a criança pode
conferir a resposta **contando na tela**.

## Desenho aprovado

### O loop novo

```text
explorar → encontrar um nó → resolver a multiplicação → recurso + moedas
        → vender / cumprir encomendas → comprar na loja
        → abrir uma nova região → tabuada nova → explorar
```

Não existe derrota. Não existe tela de vitória. O jogo termina quando a criança
fecha, e o progresso é retomado no dia seguinte.

### Ciclo dia/noite e a lanterna

A noite deixa de ser perigo e vira **prêmio curto**. Com o ciclo de 300 s, as
fronteiras de fase passam a ser:

| Fase | Fração | Segundos |
| --- | --- | --- |
| dia | 0 → 0.68 | 204 |
| entardecer | 0.68 → 0.76 | 24 |
| noite | 0.76 → 0.92 | 48 |
| amanhecer | 0.92 → 1 | 24 |

O luar sobe de `sunIntensity 0.62 / ambient 0.5` para valores em que dá para andar
sem esforço: a escuridão nunca é obstáculo de navegação.

A **lanterna** é o que dá acesso ao que só existe no escuro — vaga-lumes, cogumelos
que brilham, peixes prateados, o unicórnio na cachoeira. Ela guarda carga como
*prazo* (`chargedUntil`), no mesmo modelo do combustível da fogueira: queima
continuamente sem nenhuma escrita por quadro no store, e quem precisa do valor atual
chama uma função pura.

Ficar sem carga nunca é punição — a tela volta ao luar e a criança perde apenas a
coleta noturna daquele momento.

Onde se recarrega, por fase de entrega:

1. **Fase 1** — na fogueira, resolvendo uma multiplicação. Reaproveita inteiro o
   caminho de `purpose: 'abastecer'` que já existe.
2. **Fase 3** — de graça, dentro do raio de luz da casa.
3. **Fase 4** — em enxames de vaga-lumes no campo, que são visíveis no escuro por
   definição e por isso não criam dependência circular.

`isDangerous()` deixa de existir.

### A casa — porto seguro

A casa **já existe quando o jogo começa**, na Praia. Não é construção: um porto
seguro que precisa ser conquistado não é seguro.

Ela fica no mesmo terreno, sem carregar outra cena. Ao entrar, o telhado fica
transparente e a câmera baixa — leitura de casa de boneca, barata em low poly e
coerente com a regra de que toda a arte é gerada em código.

Janelas acesas à noite e um lampião na porta que nunca apaga. Como nada persegue
ninguém, a função da casa não é proteger: é acolher.

Dentro dela:

- **Espelho / guarda-roupa** — personalização do personagem.
- **Baú** — guarda recursos além da capacidade da mochila.
- **Cama** — dormir pula para o amanhecer e mostra o resumo do dia. Existe mesmo com
  a noite sendo desejável: a escolha é da criança.
- **Caderneta dos animais** — quem já foi visto, quem já virou amigo.
- **Mural da tabuada** — preenche sozinho conforme os fatos são dominados.

O mural é uma decisão pedagógica, não decoração: **dentro de casa, consultar é de
graça e sem penalidade**; no campo, a dica custa moeda. A casa é porto seguro da
matemática também, não só do escuro.

A casa evolui com moedas (mais um cômodo, lampião maior, vagas de decoração). É um
ralo de moedas que não se consome — o oposto de item descartável, que é o que o
gênero pede.

### Mundo: regiões, pontes e cachoeiras

O mundo hoje é um disco de raio 30 com parede invisível. Aumentar o raio produz
vazio, não descoberta. Ele vira um **arquipélago de 6 regiões menores ligadas por
pontes**: `ISLAND` vira `REGIONS`, e `isWithinIsland` vira `regionAt(position)`.

Isso resolve três coisas de uma vez: dá as pontes, dá o portão de progressão (a
ponte é comprada e só abre com a tabuada local dominada) e mantém cada região
pequena o bastante para a criança não se perder.

As cachoeiras ficam nos desníveis entre regiões — caixas low poly descendo em laço,
sem nenhum asset externo.

### Tabuadas por região

A ordem segue a didática real (2 → 5, 10 → 3, 4 → 6 → 7, 8 → 9), não a ordem
numérica. **Explorar é progredir no currículo**, e isso fica legível para a criança e
para o adulto sem nenhum menu de nível.

| Região | Tabuada | Colheita | O que vive lá |
| --- | --- | --- | --- |
| Praia (a casa) | 2 | conchas | gaivotas, o pet |
| Porto / Farol | 5 e 10 | peixes | a baleia, cardumes de 10, caixas empilhadas |
| Bosque | 3 e 4 | cogumelos, madeira | cães, gatos |
| Cachoeira | 6 | cristais d'água, pedra | cavalos bebendo, o unicórnio à noite |
| Pomar / Fazenda | 7 e 8 | frutas, mel | vacas, a horta, o NPC fazendeiro |
| Pico | 9 | gelo, pedra | neve, o dinossauro |

A tabuada do 10 entra **cedo**, logo depois do 2 e do 5: é a mais fácil (a vírgula
andando) e serve como injeção de confiança, não como prêmio de dificuldade. Ela ainda
ganha reforço passivo na economia — **as moedas se empilham de 10 em 10 no HUD**, e a
criança conta dezenas por sessão sem nenhuma pergunta ser feita.

Isso exige a única mudança estrutural real do projeto: `itemsPerGroup` deixa de ser
uma constante global de `RESOURCES` e passa a ser `node.perGroup`, derivada da região.
`itemPlacements` e `generateChallenge` continuam lendo do mesmo lugar, de modo que o
contrato visual permanece: `groups × perGroup` itens desenhados são exatamente os que
o enunciado pergunta.

### Economia: recursos e moedas

O jogo tem duas moedas, e a divisão entre elas é a regra que sustenta a seção inteira:

> **O recurso é o resultado da conta. A moeda é o prêmio por ter acertado.**

O recurso é concreto, específico da região e vem em **quantidade calculada**: a criança
conta 4 galhos de 2 gravetos, responde 8, e passa a ter 8 gravetos na mão. O número que
ela calculou continua existindo como coisa no mundo. A moeda é fungível, abstrata, e
diz apenas *se* ela acertou.

As duas saem da mesma ação sem serem redundantes, porque respondem perguntas
diferentes: **quanto** foi colhido e **se** a resposta estava certa.

- **Recurso** mantém a regra atual — 100% no acerto, 25% (mínimo 1) no erro. Errar
  nunca sai de mãos vazias.
- **Moeda** só sai do acerto. É a recompensa do domínio, não da presença.
- **Sequência** de 3 acertos seguidos paga bônus.
- **Primeira vez** que um fato novo é resolvido (7×8) paga bônus grande, uma vez só —
  incentiva variar em vez de moer o mesmo nó.

#### Os recursos precisam de destino

Hoje o jogo tem um defeito silencioso que a reforma não pode repetir: **a fruta não é
consumida por nada**. Nenhuma receita a usa — a fogueira pede 8 madeira + 4 pedra, a
cerca pede 6 madeira, e acabou. A criança colhe fruta, vê o número subir no HUD e nunca
gasta. Recurso sem destino é contador, não recompensa.

Os recursos passam a ter dois papéis:

- **Materiais** — madeira e pedra sobrevivem, com outra função: constroem e decoram a
  casa. Aparecem em mais de uma região.
- **Colheita da região** — conchas, peixes, cogumelos, cristais, mel, frutas, gelo. Cada
  região produz algo que só ela tem, o que faz o inventário virar **registro de onde a
  criança esteve**. Hoje, atravessar a ilha inteira rende os mesmos três montinhos.

Cada tipo novo obriga uma entrada em `CHALLENGE_CONTEXTS`, com o gênero do substantivo
— "Quantas conchas" mas "Quantos cogumelos". Isso não é detalhe de estilo: sem o
gênero, o enunciado sai errado em português, que é a razão de o campo já existir hoje.

E quatro destinos, nenhum deles punitivo:

- **Encomendas dos NPCs** — o pedido é uma conta, e o pagamento vem em moeda.
- **A casa** — cômodos, móveis, decoração. Ralo permanente, não consumível.
- **Alimentar animais** — o que transforma um bicho em amigo. É aqui que a fruta
  finalmente ganha emprego.
- **Horta** — sementes viram colheita até o dia seguinte.

Regra de projeto que sai daí: **nenhum recurso novo entra no jogo antes do destino
dele**. Seis itens sem uso seriam seis vezes o defeito atual.

#### A loja

Vende por moeda:

- **Ferramentas** — lanterna melhor (raio e duração), botas, mochila maior, vara de
  pesca (abre nós de rio), mapa que marca nós no minimapa.
- **Passagem** — a ponte para a próxima região.
- **Cozy puro** — cadeira, tapete, lampião, placa, cerca decorativa, sementes para a
  horta, que rende sozinha até o dia seguinte.
- **Dica** — uso único, apaga uma alternativa errada. Comprar ajuda com moeda ganha em
  conta certa é uma troca honesta e tira o medo de errar.

### Avatar e personalização

Tudo é cor de material e primitiva do Three sobre o boneco que já existe. Nenhum asset
novo.

- **Menino / menina** — duas silhuetas base. Todo o resto se mistura livremente com
  qualquer uma das duas; nenhum item fica trancado por essa escolha.
- **Cor da pele** — 6 tons. **Cor da roupa** — 8 cores.
- **Dois espaços de acessório**: cabeça (boné, chapéu, coroa) e rosto (óculos),
  usáveis ao mesmo tempo.
- Escolha inicial na primeira partida, trocável no espelho para sempre.

Acessórios especiais **se ganham por marco de tabuada**, não só se compram: dominou a
do 9, ganha a coroa; fez amizade com o unicórnio, ganha o chifrinho. A roupa vira o
boletim que a criança quer exibir — o mecanismo do troféu, sem parecer prova.

### Pet e animais

O **pet** segue o jogador por interpolação suave até um ponto atrás dele: sem corpo
físico e sem pathfinding, bem mais simples que os inimigos removidos. Tem uma função
gentil — fareja o nó mais próximo e desenterra uma moeda de vez em quando.

Os animais têm três papéis:

- **Ambiente** — vacas, cavalos, gaivotas, peixes. Não interagem; fazem o mundo
  respirar. Instanciados, como a grama já é.
- **Acontecimento** — a baleia sobe no mar aberto, solta o esguicho e mergulha. Não dá
  moeda nem recurso. Serve para a criança parar de fazer conta e olhar.
- **Amizade** — qualquer animal vira amigo ao ser alimentado, e o pedido *é* a conta
  ("5 punhados de 4 frutas"). Amigo entra na caderneta e pode virar pet.

Os **raros** aparecem em janela curta, em lugar e hora específicos: o unicórnio na
cachoeira à noite (o que dá à lanterna um motivo emocional, não só funcional), o
dinossauro no pico. A chance sobe com a sequência de acertos — **raridade amarrada a
domínio, não a sorte**.

Regra tonal firme: **animal nunca é nó de colheita**. Não se colhe uma vaca. Ele é
alvo de encomenda (alimentar) e de contagem ("quantas vacas no pasto?" — 4 grupos de
5, e o fazendeiro paga para saber). Contar bicho vivo prende mais que contar graveto.

### NPCs

Parados ou em passeio lento por rota fixa — nada de pathfinding. Todos reaproveitam o
`ChallengePanel`, somando valores a `ChallengePurpose`:

- **Comerciante** — a loja.
- **Encomendas** — "preciso de 12 gravetos", enunciado como pedido: "3 feixes de 4".
- **Guardiã da ponte** — cobra pedágio em moedas e uma conta para liberar a travessia.
- **Quem ensina** — mostra a tabelinha da região, de graça, sempre.

### Persistência

Novidade para este projeto, mas há prova de conceito no repositório: o projeto irmão
`ds` já tem `save-game/repository.ts` com `SAVE_VERSION`, migração de schema e uma
slice `avatar/` com `AvatarSelection`. O padrão será espelhado, não reinventado.

O save guarda: avatar, pet, moedas, inventário, regiões abertas, itens comprados,
decoração da casa, caderneta de animais e domínio por fato da tabuada.

### Fatias criadas e removidas

Mantendo a arquitetura vertical:

| Fatia | Situação |
| --- | --- |
| `enemies/` | **removida por inteiro**, com vida, dano e desfecho |
| `lantern/` | nova — carga como prazo, luz que acompanha o jogador |
| `economy/` | nova — moedas, loja, sequência de acertos |
| `home/` | nova — casa, baú, cama, mural da tabuada |
| `avatar/` | nova — aparência e acessórios |
| `companion/` | nova — pet |
| `wildlife/` | nova — animais, raros, caderneta |
| `npc/` | nova — diálogo, encomendas, pedágio |
| `save/` | nova — espelha o padrão do projeto `ds` |
| `world/` | reescrita — regiões, pontes, cachoeiras |
| `resources/` | alterada — `perGroup` por nó, e tipos de recurso por região |
| `building/` | reduzida — cerca vira decoração, fogueira vira ponto de recarga |

## Alternativas rejeitadas

- **Só aumentar o raio da ilha.** Mais espaço vazio não é mais exploração; sem
  fronteiras nomeadas, um disco de raio 70 é o mesmo lugar repetido.
- **Manter os inimigos, porém fracos.** Ameaça fraca é pior que nenhuma: mantém o
  custo de código e de atenção da criança sem entregar nem tensão nem aconchego.
- **Casa desbloqueável por construção.** Contradiz "porto seguro" — o abrigo não pode
  ser prêmio.
- **Colher animais como recurso.** Resolveria a contagem de forma barata e destruiria
  o tom do jogo inteiro.
- **Pagar tudo em moeda e apagar o inventário.** É a saída óbvia depois que a fogueira
  e a cerca deixam de cobrar recurso, e custaria caro: a quantidade colhida **é** a
  resposta da conta, e transformá-la direto em moeda faz o número que a criança
  calculou evaporar num contador abstrato no instante seguinte. O elo mais forte entre
  a conta e o mundo é justamente esse.
- **Deixar a tabuada do 10 por último.** Seguiria a ordem numérica e desperdiçaria a
  tabuada mais fácil justamente quando a confiança da criança mais precisa dela.
- **Pausar o mundo durante o desafio.** Sem perigo, a razão original caiu — mas o
  painel continua ancorado ao recurso, porque isso nunca foi sobre tensão, e sim sobre
  a criança poder conferir contando na tela.

## Fases de entrega

Cada fase termina jogável.

1. **Noite curta e lanterna** — remove o perigo, encurta a noite, acende a lanterna.
   Muda o clima do jogo inteiro com pouco código. *Plano detalhado em
   `plans/2026-08-18-fase-1-noite-curta-e-lanterna.md`.*
2. **Moedas e loja** — fecha o loop econômico com três itens e o resumo do dia, antes
   de gastar esforço em mundo. Entrega obrigatoriamente **pelo menos um destino de
   recurso** junto — decoração da casa serve. Sem isso a fase reintroduz o defeito da
   fruta, agora com a cerca e a fogueira também sem cobrar nada.
3. **A casa** — baú, cama, mural, e a personalização do personagem no espelho.
4. **Regiões, pontes e cachoeiras** — `perGroup` por nó e as tabuadas por região. A
   fase mais cara; só depois que o loop já é bom.
5. **Animais, pet e caderneta** — incluindo a baleia e os raros.
6. **NPCs e encomendas** — os pedidos do dia e o pedágio das pontes.

## Testes

Cada fase segue o padrão do projeto: lógica pura e slices em Vitest `node`, HUD e
painéis em jsdom, cena em `@react-three/test-renderer`, e o fluxo completo em
Playwright contra o build de produção.

Números atuais da suíte (19/08/2026): **552 testes** de unidade/integração em
37 arquivos no Vitest e **29 testes ponta a ponta** no Playwright (20 desktop +
9 celular emulado).

Casos que cada fase deve provar:

- **Fase 1** — a noite dura menos que a metade do dia; a carga da lanterna decresce com
  o relógio e é renovada pelo acerto; o acerto parcial renova menos; sem carga o jogo
  continua jogável. Nenhum resquício de vida, dano ou desfecho no store.
- **Fase 2** — acerto paga moeda e erro não paga; erro continua rendendo recurso;
  sequência de 3 paga bônus; fato novo paga bônus uma única vez; a loja debita e
  entrega; a loja recusa sem saldo. Mais um teste que vale por si: **todo tipo de
  recurso do jogo é consumido por alguma coisa** — uma varredura que falha se alguém
  acrescentar um recurso sem destino, que é exatamente como a fruta chegou aqui.
- **Fase 3** — a casa recarrega a lanterna sem conta; o mural só mostra fatos já
  dominados; o avatar sobrevive a recarregar a página.
- **Fase 4** — `itemPlacements` desenha `groups × node.perGroup` itens para todo
  `perGroup`, e o enunciado pergunta exatamente esse número; a ponte fechada barra a
  travessia; a região dita a tabuada do nó.
- **Fase 5** — o pet alcança o jogador e não o ultrapassa; o raro só aparece na janela
  dele; alimentar registra na caderneta.
- **Fase 6** — a encomenda gera um enunciado consistente com o pedido; o pedágio debita
  e abre.

Os testes ponta a ponta continuam gravando telas em `e2e/telas/`. Isso importa mais
nesta reforma do que na anterior: "cozy" é um julgamento visual, e foi olhando as telas
que apareceram a ilha cor de areia e a noite escura demais para jogar.

## Não objetivos

- Não adicionar nenhum asset externo — toda arte continua gerada em código.
- Não introduzir combate, morte, fome, ou qualquer recurso que decaia e puna.
- Não pausar o mundo durante o desafio.
- Não tirar o painel de desafio da âncora no recurso.
- Não zerar a recompensa de recurso no erro.
- Não trancar personalização por gênero escolhido.
- Não colocar compra com dinheiro real, propaganda, nem ranking competitivo.
- Não exigir leitura fluente: todo texto de NPC cabe em uma frase curta.
