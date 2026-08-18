# Ícones de bioma para o mapa do arquipélago

## Objetivo

Substituir o desenho repetitivo dos cards do mapa por mini landmarks em SVG
pixel art, mantendo a identidade de ilhas construídas em blocos. Cada ilha
deve ser reconhecida pela própria silhueta, como na referência visual enviada,
sem alterar a experiência de jogo das fases.

## Escopo

Incluído:

- `WorldMapScreen` e o componente `IslandBadge` usado pelos cards do mapa.
- Passagem do `biome` da definição da ilha para o badge.
- Novas silhuetas SVG para as tabuadas de 2 a 10.
- Preservação das paletas existentes, número do card, estados, cadeado e
  textos de status.

Fora do escopo:

- Cenas e construções exibidas durante uma missão.
- Alterações de layout, tradução, regras de progressão ou persistência.
- Imagens raster, assets externos ou novas dependências.

## Direção visual

O badge continuará usando o viewBox atual e renderização em bordas nítidas,
mas não terá mais como elemento principal três faixas idênticas de terreno. O
landmark ocupará o centro do badge e usará as cores do `BiomePalette`, com
formas simples o bastante para continuar legível no tamanho atual.

| Tabuada | Bioma       | Landmark                       |
| ------: | ----------- | ------------------------------ |
|       2 | fields      | flor sobre degraus verdes      |
|       3 | forest      | pinheiro                       |
|       4 | mountains   | cristal                        |
|       5 | beach       | veleiro                        |
|       6 | magicForest | estrela e brilhos              |
|       7 | caves       | entrada de caverna com cristal |
|       8 | ice         | floco de neve                  |
|       9 | volcano     | vulcão                         |
|      10 | city        | castelo                        |

O estado do jogo continua sendo comunicado por mais de um canal:

- `locked`: aplica a sobreposição acinzentada e o cadeado existentes;
- `available` e `inProgress`: mostram o landmark colorido;
- `completed`: mostram o landmark colorido com um pequeno detalhe de
  conquista, como bandeira, brilho ou confete, sem reintroduzir uma base
  genérica compartilhada.

O número continua sendo renderizado pelo card fora do SVG, portanto a nova
arte não deve assumir responsabilidade por texto ou foco.

## Arquitetura e fluxo de dados

`WorldMapScreen` já itera sobre `ISLANDS`, que contém `biome` e `palette`. A
alteração adicionará `biome={island.biome}` à chamada de `IslandBadge`.

`IslandBadge` receberá o `BiomeId` e escolherá a silhueta correspondente por
uma tabela ou função interna. A paleta seguirá sendo a única fonte de cores,
evitando duplicação de cores por componente. O overlay de bloqueio ficará
depois da arte, mantendo a ordem de empilhamento e o comportamento visual
atual.

Não haverá mudança no domínio: `BiomeId`, `BiomePalette` e as definições das
ilhas existentes já expressam os dados necessários.

## Acessibilidade e comportamento

O SVG continuará com `aria-hidden="true"`, pois o nome da ilha, a tabuada, o
status e a dica de desbloqueio já estão disponíveis como texto no botão. O
botão, foco por teclado, estado `disabled` e semântica do mapa não serão
alterados. O status nunca dependerá somente da cor.

## Verificação

Após a implementação, executar:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`

Também será feita uma inspeção visual do mapa em desktop e em uma largura
menor, verificando que nenhum landmark encosta no número, sai do viewBox ou
fica ilegível sob o overlay de bloqueio.

## Critérios de sucesso

- Os nove biomas exibem silhuetas visualmente diferentes.
- A opção disponível da tabuada 2 continua imediatamente reconhecível.
- Ilhas bloqueadas continuam claramente bloqueadas e continuam não clicáveis.
- O restante do fluxo do jogo e todos os testes existentes permanecem intactos.
