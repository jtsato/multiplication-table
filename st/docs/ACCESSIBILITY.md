# Acessibilidade

O alvo é WCAG 2.2 AA como baseline, preservando a fantasia de blocos sem tornar a decoração necessária para jogar.

## Cobertura implementada

- HTML semântico, headings e labels nativos;
- todos os fluxos essenciais funcionam com clique, toque e teclado;
- foco visível com `:focus-visible`;
- texto grande e contraste reforçado nas configurações;
- `prefers-reduced-motion` reduz transições e animações;
- alvos de resposta e controles de produto têm tamanho confortável;
- diorama e avatar são decorativos e não carregam informação exclusiva;
- feedback, pistas e resultados usam `role="status"` ou `role="alert"` quando apropriado;
- as respostas não dependem apenas de cor, som ou velocidade.

## Verificação

- testes de componente com Testing Library;
- scan automatizado axe na tela de seleção de perfil via Playwright;
- smoke E2E de criação de perfil e início do primeiro dia;
- typecheck e lint em cada verificação local.

## Limitações atuais

- a camada de narração e áudio configurável ainda precisa ser conectada aos textos e eventos;
- a avaliação manual com leitor de tela, zoom de 200% e diferentes tablets ainda deve ser feita antes de uma declaração formal de conformidade;
- o scan axe automatizado cobre a tela inicial; as demais telas precisam ser incluídas na matriz E2E.
