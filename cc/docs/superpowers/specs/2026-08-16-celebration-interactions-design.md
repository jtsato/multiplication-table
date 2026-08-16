# Especificação: comemoração e interações do avatar

## Objetivo

Deixar a experiência mais acolhedora e expressiva para crianças, usando o toque no avatar como uma interação imediata, um mascote mais vivo e uma comemoração mais festiva ao concluir uma ilha.

## Escopo

- Tornar os botões de ação visualmente amarelos, mantendo hierarquia por tonalidade:
  - `primary`: amarelo forte para a ação principal;
  - `secondary`: amarelo claro para ações alternativas;
  - `ghost`: amarelo suave, ainda claramente acionável;
  - `danger`: dourado de alerta, preservando a distinção sem introduzir vermelho;
  - controle de som: mesma família amarela.
- Manter estados próprios dos cards de seleção e das ilhas; a regra de amarelar se aplica aos botões de ação.
- Na tela inicial, fazer o avatar acenar ao clique/toque e manter a ação de editar personagem em um botão separado.
- Durante a missão, manter o avatar clicável/tocável, com aceno curto e resposta do mascote.
- Dar ao mascote três estados visuais:
  - `happy`: sorriso visível, bochechas e flutuação suave no estado normal;
  - `waving`: aceno curto e piscada quando o avatar é tocado;
  - `cheering`: braços erguidos, sorriso aberto, salto e brilhos na comemoração.
- Na conclusão da ilha, substituir o confete discreto por papel picado colorido, com tiras, retângulos e círculos em posições, rotações, atrasos e velocidades variadas. As cores devem combinar com a ilha e incluir amarelo, rosa, azul e branco.
- Construir as variações em SVG/CSS e dados determinísticos, sem depender de imagens externas ou de um novo pacote.

## Fluxos e estados

### Tela inicial

O avatar continua sendo um controle acessível. Ao ativá-lo com clique, toque, Enter ou Espaço, ele executa a animação de aceno e dispara a resposta curta do mascote. A animação é temporária, reiniciável e não altera a navegação.

A edição do personagem deixa de depender do mesmo clique no avatar e passa para um botão visível de “Mudar personagem”, usando a tradução já existente. Assim, as duas intenções ficam disponíveis sem ambiguidade.

### Missão

O comportamento de aceno já existente no herói é preservado e refinado visualmente. Enquanto o aceno estiver ativo, o mascote usa `mood="waving"`; no estado normal usa `mood="happy"`. Durante a comemoração, `mood="cheering"` continua tendo prioridade sobre o aceno.

### Conclusão da ilha

O estado de conclusão usa o mascote em `cheering`, o badge concluído e uma camada de confetes coloridos. Os itens de confete são renderizados com dados estáveis para evitar uma mudança visual desnecessária a cada renderização, mas cada item tem variação de forma, cor, atraso, rotação e queda.

## Acessibilidade e comportamento

- O avatar deve continuar tendo nome acessível por meio da chave existente `a11y.heroWave`.
- O botão “Mudar personagem” deve continuar usando `home.changeCharacter`.
- A interação deve funcionar igualmente por mouse, toque e teclado.
- A regra `prefers-reduced-motion: reduce` deve desativar ou reduzir saltos, acenos, flutuação e queda do confete, mantendo o feedback visual essencial.
- As cores amarelas devem preservar contraste suficiente com os textos escuros já usados na interface.
- O confete é decorativo e deve permanecer oculto para tecnologias assistivas.

## Limites da mudança

Esta especificação não altera regras de progressão, pontuação, persistência, conteúdo das tabuadas, ícones das ilhas ou os arquivos de trabalho não relacionados que já estejam modificados no repositório.

## Verificação

- Testes unitários devem cobrir o estado de interação do avatar/mascote e a preservação do fluxo de edição do personagem.
- A checagem visual deve confirmar os quatro estilos de botão, a interação na tela inicial, o aceno durante a missão, o mascote nos três humores e a comemoração com confete.
- Executar typecheck, testes e build; registrar qualquer aviso de lint que já exista fora do escopo desta mudança.
