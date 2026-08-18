# Acessibilidade

O alvo é WCAG 2.2 AA como baseline, preservando a fantasia de blocos sem tornar a decoração necessária para jogar.

## Cobertura implementada

- HTML semântico, headings e labels nativos;
- todos os fluxos essenciais funcionam com clique, toque e teclado;
- foco visível com `:focus-visible`;
- texto grande e contraste reforçado nas configurações;
- `prefers-reduced-motion` reduz transições e animações;
- avatar tem estados de repouso e comemoração, com classe neutra quando movimento reduzido está ativo;
- alvos de resposta e controles de produto têm tamanho confortável;
- diorama e avatar são decorativos e não carregam informação exclusiva;
- feedback, pistas e resultados usam `role="status"` ou `role="alert"` quando apropriado;
- as respostas não dependem apenas de cor, som ou velocidade;
- narração em pt-BR e sons de feedback são opcionais e configuráveis.

## Verificação

- testes de componente com Testing Library;
- scan automatizado axe via Playwright nas telas principais (criação, loja, catálogo, conquistas, configurações, gameplay e resumo);
- E2E de criação, início do dia, pistas, compra, refresh e carregamento offline;
- typecheck e lint em cada verificação local.

## Limitações atuais

- a avaliação manual com leitor de tela, zoom de 200% e diferentes tablets ainda deve ser feita antes de uma declaração formal de conformidade;
- o scan axe automatizado cobre as telas principais; cenários extremos (quota/storage, combinações de texto grande em telas estreitas) ainda dependem de revisão manual.
