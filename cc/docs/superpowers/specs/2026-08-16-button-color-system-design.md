# Design: Sistema de cores dos botões

## Objetivo

Melhorar a hierarquia visual dos botões do jogo sem abandonar o amarelo como
cor de ação principal. Cada variante deve comunicar sua intenção por cor,
contraste, sombra e estado de interação, funcionando bem em telas infantis e
em toque.

## Escopo

A mudança fica restrita aos componentes que usam a classe reutilizável `.btn`:

- `primary`: iniciar, avançar, jogar e confirmar ações comuns;
- `secondary`: ações alternativas e configurações;
- `ghost`: voltar, cancelar e navegação de baixo destaque;
- `danger`: apagar/resetar dados.

Botões de respostas da missão e cards de ilhas permanecem fora deste ajuste,
pois têm semântica visual própria.

## Direção visual escolhida

Usar uma paleta ensolarada com azul-marinho como âncora de leitura:

| Variante | Fundo base | Texto | Intenção |
| --- | --- | --- | --- |
| Primário | `#f5b82e` | `#172b4d` | Ação principal, energética e positiva |
| Secundário | `#fff4c2` | `#3d2b00` | Alternativa clara, ainda relacionada ao amarelo |
| Ghost | `#e8f3ff` | `#174a78` | Navegação e ações de menor destaque |
| Perigo | `#e9665a` | `#431a1e` | Ação destrutiva, com linguagem coral |

Estados:

- hover eleva suavemente o botão e clareia o fundo;
- active desloca o botão 3 px para baixo e reduz a sombra;
- primary active usa `#d99a17`, preservando pelo menos 4,5:1 com o texto;
- danger active usa `#c94b42` com texto branco, preservando pelo menos 4,5:1;
- disabled reduz a intensidade sem remover a legibilidade nem o foco da ordem;
- `:focus-visible` continua usando o indicador global escuro de alto contraste.

## Implementação

Centralizar os valores em tokens CSS no `:root` e fazer as quatro variantes
consumirem esses tokens. A estrutura React de `Button` não precisa mudar. As
sombras permanecem como parte da linguagem de jogo, mas cada variante terá uma
sombra/borda coerente com sua cor, evitando que o estado pressionado dependa
somente de cor.

Manter a área mínima de toque existente (`48px` para os tamanhos médios e
grandes) e as regras existentes de movimento reduzido.

## Acessibilidade e validação

- Medir contraste de texto em fundo base, hover e active; alvo mínimo de 4,5:1
  para texto normal e 3:1 para elementos gráficos relevantes.
- Confirmar que o foco continua visível em todas as variantes.
- Adicionar testes de contrato dos tokens/classes, sem acoplar testes a detalhes
  de renderização.
- Executar suíte completa, typecheck, build e lint direcionado aos arquivos
  alterados.

## Fora de escopo

- alterar a paleta das ilhas, personagens ou telas inteiras;
- trocar a tipografia, o formato dos botões ou a interação sonora;
- introduzir dependências de design system.
