# Arquitetura

## Limites principais

```text
content → domain → app/screens → UI
             ↓
       infrastructure
```

- `content/` contém lojas, produtos e clientes, sem estado de sessão.
- `domain/` contém regras puras de matemática, economia, sessão, progresso e perfil.
- `infrastructure/` contém IndexedDB e service worker.
- `app/` compõe as telas e coordena persistência, navegação e eventos.
- `styles/` concentra a identidade visual de blocos, tokens implícitos e estados de acessibilidade.

## Estado de jogo

`DaySession` é uma máquina de estados pequena e explícita:

```text
customer → product-select → question → feedback → próximo cliente
                                             ↘ summary
```

O atendimento direto começa em `customer`; o atendimento de separação começa em `product-select`. Alternativas, feedback e pistas são calculados a partir do mesmo `CustomerVisit`, que guarda quantidade, produto, preço e fato matemático.

## Persistência

`ProfileRepository` é a única camada que conhece IndexedDB. O object store `profiles` usa `id` como chave. Cada perfil contém `schemaVersion`, dados de avatar, loja, capítulo, caixa, progresso matemático, objetivos, conquistas e preferências.

Eventos de autosave já conectados:

- criação e atualização de perfil;
- resposta de atendimento;
- fechamento do dia;
- compra de produto;
- configuração de acessibilidade.

O repositório migra o formato atual para a versão 1 e expõe `close()` para liberar a conexão em testes e encerramentos controlados.

## Determinismo

`seededRandom` e `seededShuffle` controlam a ordem de clientes, produtos, modo de atendimento e alternativas. A seed não aparece para a criança.

## Dependências

React + TypeScript + Vite formam a aplicação; `idb` encapsula IndexedDB; Vitest e Testing Library cobrem domínio e componentes; Playwright + axe cobrem o smoke E2E e a tela inicial.
