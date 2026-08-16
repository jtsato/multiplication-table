# Paleta Overworld para Ilhas da Tabuada

## Contexto

A experiência `cc` atualmente combina uma interface azul-marinho com grade, botões em amarelo/azul/vermelho e paletas de bioma muito saturadas, incluindo roxos e cianos neon. A solicitação é redefinir todas as cores da experiência para uma atmosfera mais próxima de jogos de blocos de exploração, mantendo a identidade própria do produto e sem alterar os fluxos do jogo.

## Objetivo

Aplicar uma linguagem cromática única, inspirada no overworld de jogos voxel: floresta, grama, terra, pedra, madeira, céu, água, ouro e minérios. A mudança deve atingir a interface, os biomas, os elementos SVG, os mascotes, a personalização, a tela inicial e os efeitos de celebração.

## Fora do escopo

- Alterar telas, textos, regras, progressão ou navegação.
- Redesenhar a geometria dos cenários ou dos personagens.
- Adicionar texturas, logos, personagens ou assets de Minecraft.
- Remover diferenças visuais entre os biomas.
- Alterar o significado de sucesso, erro, foco ou estados desabilitados.

## Direção visual

### Interface

- Fundo global em verde-floresta escuro, com grade discreta em tom de folhagem.
- Superfícies e cartões em pedra clara/creme, com bordas quentes e sombras em terra escura.
- Ação primária em verde de grama, com estados mais claros/escuros para hover e active.
- Ação secundária e foco em dourado de minério.
- Botões neutros em pedra azul-esverdeada clara.
- Ação destrutiva em vermelho telha, com texto escuro de alto contraste.
- Texto principal escuro em superfícies claras e texto creme nas áreas escuras.
- Manter raios, áreas de toque e transições existentes.

Os tokens CSS em `src/styles/global.css` continuam sendo a fonte de verdade da interface. Os contratos de teste que verificam valores hexadecimais devem ser atualizados para os novos tokens, sem remover os testes dos estados de interação.

### Mundo e biomas

As `BiomePalette` de `src/domain/islands.ts` serão recalibradas sem mudar a estrutura do tipo:

- campos e floresta: grama, terra, madeira e água em verdes e marrons naturais;
- montanhas e cavernas: pedra, ardósia, carvão e ouro;
- praia e gelo: areia, neve, água e madeira clara;
- floresta mágica: verdes e roxos mais profundos, com acento de esmeralda/ouro;
- vulcão: basalto, lava e brasa, evitando neon excessivo;
- cidade: pedra, madeira, cobre e ouro, mantendo leitura distinta do restante.

Cada bioma preservará `skyTop`, `skyBottom`, `groundTop`, `groundMid`, `groundDeep`, `water`, `waterDeep`, `block`, `blockLight`, `blockDark`, `accent` e `accentSoft`, mas com relações de luz e sombra mais próximas de blocos materiais.

### Arte, mascotes e personalização

As cores fixas nos SVGs de `src/art/` e as cores de `src/domain/mascots.ts` serão alinhadas à nova direção. Tons de pele, cabelo, olhos, branco funcional e detalhes de legibilidade permanecem naturais quando não forem parte da paleta temática. As opções de roupas continuarão distintas entre si, agora usando variações de grama, água, terracota, ouro, ametista e rosa queimado.

As listas de cores em `SplashScreen`, `LevelScreen` e `IslandCompleteScreen` também serão atualizadas para evitar que a celebração reintroduza a paleta antiga.

## Arquivos envolvidos

- `src/styles/global.css`: tokens da interface e estados dos botões.
- `src/domain/islands.ts`: paletas dos nove biomas.
- `src/domain/mascots.ts`: cores dos mascotes.
- `src/domain/avatar.ts`: cores das roupas e detalhes de personalização.
- `src/art/Avatar.tsx`, `src/art/Decor.tsx`, `src/art/IslandBadge.tsx`, `src/art/Mascot.tsx` e `src/art/SceneView.tsx`: cores fixas de SVG e detalhes de iluminação.
- `src/screens/SplashScreen.tsx`, `src/screens/LevelScreen.tsx` e `src/screens/IslandCompleteScreen.tsx`: cores de celebração e estados visuais.
- Testes de estilos e arte que documentam valores cromáticos específicos.

Nenhum arquivo fora de `cc/` será alterado.

## Verificação e critérios de aceite

1. A interface da `cc` usa a nova família de verdes, terras, pedras e dourados, sem depender dos tokens azul/roxo antigos.
2. Todas as nove ilhas continuam visualmente distinguíveis, com céu, solo, água, blocos e acentos coerentes.
3. Avatar, mascotes, splash, confetes e SVGs não reintroduzem a paleta anterior por meio de cores fixas.
4. Contraste e foco continuam legíveis; as cores de sucesso, erro e foco continuam semanticamente distintas.
5. `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` passam dentro de `cc`.
6. Não há mudanças em lógica de jogo, textos, dimensões ou navegação.
