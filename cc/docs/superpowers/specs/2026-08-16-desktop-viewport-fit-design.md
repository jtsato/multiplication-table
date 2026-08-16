# Design: Ajuste inicial da missão no desktop

## Objetivo

Fazer a tela de missão se ajustar imediatamente ao tamanho atual da janela do
navegador no desktop. Ao abrir o jogo, o cenário, o cabeçalho e o painel da
missão devem começar em uma composição utilizável, sem depender de o usuário
redimensionar a janela para disparar uma nova medição do layout.

## Escopo

A mudança fica restrita ao layout da tela de gameplay:

- cabeçalho da missão e barra de progresso;
- área do cenário SVG;
- painel de briefing/perguntas;
- regras de altura e rolagem da tela de missão.

As telas de início, mapa, configurações, conquistas e resultado não mudam. O
comportamento responsivo existente em celulares deve permanecer compatível.

## Comportamento esperado

- A tela usa a altura real disponível do viewport, com fallback para navegadores
  que não suportam `dvh`.
- O cenário mantém a proporção `5:3` do `viewBox` (`360 × 216`) e é
  centralizado.
- A largura do cenário é limitada pela largura disponível e pelo espaço vertical
  da janela, evitando que uma janela desktop larga e baixa produza um cenário
  excessivamente alto ou recorte o painel abaixo.
- O painel da missão continua abaixo do cenário. Quando a altura disponível não
  comportar todo o conteúdo, somente o painel poderá rolar internamente.
- O cabeçalho permanece visível e não é comprimido pelo painel.
- A abertura inicial e o redimensionamento posterior usam as mesmas regras CSS;
  nenhuma medição manual com JavaScript é necessária.

## Implementação

Atualizar `src/styles/global.css` para estabelecer um contrato explícito de
layout na tela `.level`:

1. usar `min-height: 100vh` seguido de `min-height: 100dvh` como fallback e
   valor moderno;
2. permitir que a área de conteúdo tenha `min-height: 0`, evitando que o
   tamanho intrínseco do SVG impeça o flex layout de se ajustar;
3. transformar `.level__stage` em uma área flexível e centralizada;
4. dimensionar `.scene` com sua proporção natural de 5:3, limitando sua largura
   pela altura disponível do viewport em telas desktop;
5. remover a dependência de uma combinação de `width: 100%` com `max-height` que
   pode deixar o SVG com dimensões incompatíveis e recortar seu conteúdo;
6. aplicar `overflow-y: auto` e `min-height: 0` ao painel quando o viewport for
   baixo;
7. manter os breakpoints mobile e o espaçamento de toque existentes, alterando
   apenas as regras necessárias para o ajuste de viewport.

O `SceneView` não precisa receber estado novo nem medir a janela. O atributo
`preserveAspectRatio` será mantido compatível com a composição atual; a caixa
CSS do SVG será dimensionada na mesma proporção 5:3 do `viewBox` para que o
cenário inteiro permaneça visível.

## Validação

- adicionar um teste de contrato para as regras CSS de viewport da tela de
  missão, protegendo a presença do fallback `vh`, do valor `dvh`, do limite
  proporcional do cenário e da rolagem interna do painel;
- executar o teste novo e a suíte completa;
- executar typecheck, lint e build;
- fazer inspeção visual no navegador em pelo menos uma janela desktop alta e
  uma janela desktop larga/baixa, confirmando que a abertura inicial não exige
  redimensionamento e que o painel não fica cortado.

## Fora de escopo

- maximizar ou redimensionar a janela do sistema operacional;
- alterar a escala dos desenhos, a arte dos cenários ou a lógica da missão;
- introduzir dependência de medição via JavaScript ou biblioteca de layout;
- redesenhar as telas que não são de gameplay.
