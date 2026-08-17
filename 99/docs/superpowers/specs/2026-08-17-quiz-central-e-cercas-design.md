# Quiz centralizado e encaixe de cercas

## Objetivo

Corrigir dois problemas de usabilidade do jogo:

- o quiz não deve ser cortado quando o recurso que o abriu está perto de uma borda da viewport;
- cercas devem poder ser montadas lado a lado com pouco esforço, sem aceitar um trecho que atravesse árvores ou pedras.

## Desenho aprovado

### Quiz

`ChallengePanel` deixará de ser renderizado como `Html` ancorado em coordenadas 3D. Ele será montado como uma camada DOM fixa sobre o canvas, centralizada na viewport. A camada inteira continuará ignorando ponteiros para não bloquear o giro da câmera; apenas o cartão e seus botões capturarão interação.

O painel continuará observando o mesmo estado (`activeChallenge` e `feedback`), respondendo às mesmas ações de teclado/toque e exibindo o mesmo conteúdo. A posição do recurso não será mais necessária para renderização do painel, mas o alvo continuará no estado para a lógica de coleta/abastecimento.

O CSS limitará a largura do cartão à largura disponível da tela, preservando margens mínimas em telas estreitas. O cartão de feedback usará a mesma camada centralizada.

### Cercas

O ponto livre calculado à frente do jogador continuará sendo o posicionamento manual padrão. Quando o modo for `cerca`, o posicionamento será ajustado para o candidato de encaixe mais próximo dentro de uma tolerância:

- uma extremidade de uma cerca existente será usada como ponto de conexão;
- serão considerados alinhamento reto e giros de 90 graus para permitir linhas e cantos;
- a orientação e a posição escolhidas serão usadas tanto pelo fantasma quanto pela confirmação da construção;
- se nenhum candidato estiver próximo, o posicionamento manual original será preservado.

O encaixe só será aplicado quando o candidato continuar válido. Assim, uma cerca não será encaixada sobre uma construção, fora da ilha ou próxima demais de um recurso.

### Espaço livre para recursos

A validação de cerca será baseada no segmento ocupado pela peça, não somente no centro. O trecho horizontal entre as duas extremidades será comparado com a distância dos nós de recurso, evitando que uma ponta da cerca fique atravessando ou colada a uma árvore/pedra mesmo quando o centro estiver livre.

As demais regras atuais — custo, limite da ilha, sobreposição com construções e recursos já coletados — serão preservadas.

## Alternativas rejeitadas

- **Grade mundial fixa:** seria previsível, mas restringiria construções que não estivessem alinhadas à grade.
- **Somente aumentar a tolerância de sobreposição:** reduziria algumas recusas, mas não criaria encaixe visual nem resolveria a mira manual.

## Testes

Serão adicionados testes unitários para:

- encontrar o encaixe reto mais próximo;
- encontrar encaixe de canto em 90 graus;
- não encaixar quando a distância exceder a tolerância;
- manter o candidato inválido quando uma árvore/pedra ocupar o trecho;
- preservar o posicionamento manual sem cercas existentes.

O teste do painel será ajustado para verificar a camada centralizada e continuará cobrindo enunciado, respostas, feedback, teclado e expiração. A suíte existente de construção, tipo e build será executada ao final.

## Não objetivos

- não alterar a regra de custo da cerca;
- não pausar o jogo enquanto o quiz estiver aberto;
- não alterar a geração geral do cenário além da validação de espaço da construção;
- não adicionar controles novos para girar manualmente a cerca.
