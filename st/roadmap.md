# Roadmap — Lojinha Maluca

## Objetivo

Construir o MVP jogável da **Lojinha Maluca**, uma SPA web offline-first para crianças de 9 a 10 anos praticarem multiplicação dentro do contexto de uma loja. O loop principal deve ser:

```text
atender → multiplicar → receber feedback → faturar → fechar o dia → melhorar a loja → jogar novamente
```

Este roadmap segue a ordem recomendada na seção 109 de `specification.md` e transforma cada milestone em uma entrega verificável. A acessibilidade deve ser considerada em todas as etapas; o Milestone 9 é uma rodada de revisão e cobertura completa, não o início desse trabalho.

## Princípios que valem para todo o roadmap

- A multiplicação deve aparecer em situações concretas de quantidade × preço unitário.
- O fluxo deve ser acolhedor: erros geram pistas progressivas, sem perda de dinheiro, XP ou progresso.
- O modo normal não usa cronômetro, streak, ranking ou comparação entre crianças.
- O estado do jogo deve ser determinístico nos testes, com randomização controlável por seed.
- O domínio matemático e a interface devem permanecer separados e testáveis.
- O MVP não terá backend, login, sincronização em nuvem, analytics externo ou coleta de dados pessoais.
- A interface será em português do Brasil, com HTML semântico e alternativa equivalente para clique, toque e teclado.
- A estética deve ser voxel/blocos original, construída com DOM, CSS e SVG, sem assets protegidos.
- Toda compra ou avanço relevante deve produzir uma mudança perceptível na loja.

## Sequência de entregas

### Milestone 1 — Fundação

**Status:** Concluído em 16/08/2026.

**Entrega:** criar a base executável do projeto com React, TypeScript e Vite, incluindo tokens visuais, shell da aplicação, reducer ou máquina de estados explícita, infraestrutura de testes e domínio inicial.

**Inclui:**

- configuração de desenvolvimento, build, lint, typecheck e testes;
- separação inicial entre `app`, `domain`, `content`, `infrastructure`, `components` e `screens`;
- tipos de perfil, loja, cliente, produto, sessão e estado persistido;
- repositório IndexedDB independente da UI;
- `schemaVersion`, migrações e autosave preparado para eventos significativos;
- RNG determinístico e conteúdo centralizado;
- primeira camada semântica, foco visível e suporte inicial a `prefers-reduced-motion`.

**Saída verificável:** o projeto abre, renderiza um shell navegável, executa os testes de base e possui um caminho claro para persistir e recuperar um perfil.

### Milestone 2 — Perfil

**Status:** Concluído em 16/08/2026. Dependeu do Milestone 1.

**Entrega:** fluxo completo de entrada no jogo.

**Inclui:**

- seleção entre múltiplos perfis locais;
- criação de perfil com apelido livre, sugestões e opção “Surpreenda-me”;
- avatar voxel cosmético com aparência, cabelo, roupa, acessório e avental/uniforme;
- escolha livre entre Livraria, Loja de Arte, Loja de Esportes e Tecnologia & Robótica;
- escolha de estilo-base;
- configurações rápidas de acessibilidade;
- persistência do perfil e retorno à seleção após recarregar.

**Saída verificável:** uma criança fictícia consegue criar um perfil sem informar dados pessoais, personalizar o avatar, escolher uma loja e iniciar a experiência.

### Milestone 3 — Primeiro atendimento completo

**Status:** Concluído em 16/08/2026. Dependeu do Milestone 2.

**Entrega:** primeira fatia vertical jogável, do cliente até o feedback.

**Inclui:**

- entrada de um cliente recorrente no diorama;
- pedido contextualizado com quantidade e preço inteiro de R$ 1 a R$ 10;
- atendimento por cálculo direto;
- atendimento por seleção visual de produtos, sem exigir drag-and-drop;
- pergunta com exatamente três alternativas;
- posição variável da resposta correta;
- registro da venda quando a resposta é concluída;
- feedback curto de acerto e feedback respeitoso de erro;
- interface de atendimento com prioridade para legibilidade matemática.

**Saída verificável:** o primeiro cliente pode ser atendido do começo ao fim por mouse, toque e teclado. Ao terminar, a venda é registrada e o fluxo não fica preso em uma tela intermediária.

### Milestone 4 — Sistema pedagógico adaptativo

**Status:** Concluído em 16/08/2026. As regras estão implementadas, testadas e conectadas à seleção contextual das visitas usando o histórico de fatos do perfil.

**Entrega:** transformar o atendimento em um sistema de aprendizagem adaptativo, determinístico e invisível para a criança.

**Inclui:**

- `MultiplicationFact` para fatos de `1 × 1` a `10 × 10`;
- bandas internas de introdução, sem apresentar “tabuada do N” à criança;
- `DistractorStrategy` com categorias pedagógicas como `near_fact`, `square_fact`, `adjacent_multiplier`, `addition_like`, `quantity_price_confusion` e `fallback`;
- exatamente uma resposta correta, sem duplicatas e sem alternativas absurdas;
- quatro níveis de ajuda progressiva: mensagem contextual, representação concreta, soma repetida e relação completa;
- conclusão assistida após dificuldade persistente;
- atualização de domínio com ganhos diferentes conforme o suporte utilizado, clamp entre 0 e 1 e estados `new`, `learning`, `consolidating` e `mastered`;
- transferência comutativa entre `a × b` e `b × a`;
- scheduler e revisão espaçada sem depender de velocidade;
- registro do distrator escolhido apenas para adaptação pedagógica.

**Saída verificável:** testes unitários cobrem fatos, limites, distratores, pistas, clamp, comutatividade, scheduler e domínio. Os fluxos de erro mostram ajuda progressiva e sempre permitem concluir o atendimento.

### Milestone 5 — Dia completo

**Status:** Concluído em 16/08/2026. O fechamento, faturamento, caixa e seleção adaptativa estão conectados ao loop diário.

**Entrega:** completar o loop de uma sessão normal.

**Inclui:**

- sessão com 5 ou 6 clientes;
- mistura de cálculo direto e separação de produtos;
- no máximo uma atividade concreta curta adicional por dia quando necessária para cobrir fatos difíceis de contextualizar;
- faturamento por venda;
- fechamento automático do dia;
- entrada do saldo no caixa;
- resumo claro, sem expor notas, percentuais ou ranking matemático;
- autosave após atendimento e encerramento do dia;
- testes do fluxo de cinco clientes, saldo e persistência.

**Saída verificável:** é possível jogar um dia de aproximadamente 3–6 minutos, receber o saldo correto e iniciar o próximo dia sem perder progresso.

### Milestone 6 — Progressão da loja

**Status:** Parcialmente concluído em 16/08/2026. Capítulos, economia, produtos desbloqueáveis e tela de catálogo existem; as mudanças visuais específicas de cada compra ainda precisam ser ampliadas.

**Entrega:** fazer a loja crescer de modo visual e funcional.

**Inclui:**

- capítulos e transições de capítulo;
- catálogo com seis produtos por loja, três iniciais e três adquiríveis;
- desbloqueio de disponibilidade sem compra automática;
- custos de referência de R$ 80, R$ 110 e R$ 150;
- economia simples com saldo, compras e bloqueio quando não houver caixa;
- melhorias funcionais e cosméticas sem facilitar a matemática nem multiplicar dinheiro;
- expansão visual da loja após compras;
- produtos antigos permanecendo no catálogo;
- testes de capítulos, desbloqueios, compras e impossibilidade de saldo negativo.

**Saída verificável:** depois de fechar um dia, a criança consegue comprar uma melhoria ou produto disponível e vê a mudança refletida visualmente na loja.

### Milestone 7 — Personalização

**Status:** Parcialmente concluído em 16/08/2026. Avatar customizável, três estilos, três decorações compráveis, expansão visual básica e animações com redução de movimento existem; comemorações específicas para compras e uma coleção visual mais ampla ainda faltam.

**Entrega:** ampliar a expressão visual sem alterar vantagens de jogo.

**Inclui:**

- estilos visuais próprios da loja;
- cosméticos compráveis;
- avatar melhorado em aparência e pequenas animações automáticas;
- comemorações breves para compras e expansões;
- respeito à redução de movimento;
- nenhuma animação bloqueando controles, informação ou compreensão do resultado;
- persistência de avatar, estilo e cosméticos.

**Saída verificável:** uma compra cosmética ou alteração do avatar é salva, reaparece após recarregar e não altera o domínio ou a economia.

### Milestone 8 — Metagame leve

**Status:** Concluído em 16/08/2026 como baseline. Objetivos, regras de conquistas, histórico visual dedicado e camadas opcionais estão conectados ao crescimento da loja.

**Entrega:** adicionar objetivos opcionais e conquistas que reforcem o crescimento da loja.

**Inclui:**

- objetivos diários ou de loja opcionais;
- conquistas por marcos de exploração, atendimento, produtos e expansão;
- feedback visual para desbloqueios;
- histórico persistido;
- nenhuma conquista por perfeição, sequência perfeita ou desempenho em velocidade;
- nenhuma recompensa aleatória monetizada.

**Saída verificável:** objetivos e conquistas aparecem como camadas opcionais, não bloqueiam o loop principal e não expõem uma nota de desempenho matemático.

### Milestone 9 — Revisão completa de acessibilidade

**Status:** Parcialmente concluído em 16/08/2026. Teclado, foco, texto grande, contraste, redução de movimento, áudio/narração configuráveis e axe inicial existem; a cobertura automatizada de axe ainda precisa incluir as demais telas e falta avaliação manual completa.

**Entrega:** validar e corrigir as principais telas contra WCAG 2.2 AA como baseline.

**Inclui:**

- passagem completa de teclado e foco;
- semântica de leitor de tela para cliente, pedido, pergunta, alternativas, pista, resultado, saldo e mudanças relevantes;
- `aria-live="polite"` sem anúncios decorativos excessivos;
- contraste, alvos de toque e zoom de 200%;
- texto grande e layout em tablet/telas menores;
- redução de movimento;
- narração opcional e áudio configurável;
- equivalentes acessíveis para qualquer interação visual;
- verificação automatizada com axe nas telas principais e avaliação manual documentada.

**Saída verificável:** os fluxos essenciais funcionam com teclado, zoom, movimento reduzido e sem depender exclusivamente de som, cor, arrastar ou elementos decorativos.

### Milestone 10 — Offline e hardening

**Status:** Parcialmente concluído em 16/08/2026. Service worker, cache versionado, migração, aviso de atualização e teste offline após refresh existem; hardening de performance e cenários extremos de storage continuam.

**Entrega:** preparar a versão do MVP para uso confiável sem rede e para evolução segura.

**Inclui:**

- service worker para HTML, JS, CSS, SVG, fontes locais e conteúdo necessário;
- teste de funcionamento após o primeiro carregamento completo e rede desligada;
- atualização do service worker sem apagar IndexedDB nem interromper uma atividade;
- aviso discreto de nova versão em momento seguro;
- tratamento de IndexedDB indisponível, quota excedida, dado inválido e falha de migração;
- explicação clara antes de qualquer recuperação ou reset necessário;
- revisão de performance, bundle e renderizações desnecessárias;
- comandos `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:e2e` e `verify`.

**Saída verificável:** o jogo continua jogável offline após o cache inicial, mantém o progresso após refresh e os comandos de verificação disponíveis passam ou reportam claramente limitações reais do ambiente.

## Critérios de aceite do MVP

O MVP somente deve ser considerado concluído quando, no mínimo:

- abre no navegador sem backend;
- permite múltiplos perfis locais e escolha entre as quatro lojas;
- permite personalizar avatar e loja;
- executa um dia inteiro com 5–6 clientes;
- contextualiza multiplicação, oferece seleção de produtos, cálculo direto e três alternativas;
- usa distratores pedagógicos, pistas progressivas e comutatividade;
- não pune erros nem exige velocidade;
- calcula faturamento, fecha o dia e atualiza o caixa;
- permite comprar melhoria com mudança visual;
- possui capítulos, produtos desbloqueáveis, cosméticos, objetivos e conquistas;
- persiste o progresso em IndexedDB com versionamento e migração;
- funciona com teclado, foco visível, movimento reduzido e layout desktop/tablet;
- continua funcionando offline após o cache inicial;
- passa lint, typecheck, testes, build e os testes E2E disponíveis.

## Ordem de verificação por marco

Cada milestone deve terminar com uma verificação proporcional ao que foi entregue:

1. testes unitários do domínio alterado;
2. testes de componente para a tela ou interação criada;
3. teste manual de teclado, foco, toque e layout relevante;
4. build e typecheck quando a configuração estiver disponível;
5. teste E2E do fluxo vertical assim que o primeiro atendimento existir;
6. revisão de persistência depois de cada evento de autosave;
7. verificação offline e de migração no hardening final.

## Próximo passo imediato

Próximo passo: ampliar a apresentação de progressão e conquistas, incluir axe nas telas de loja, catálogo e atendimento e revisar performance/storage antes do fechamento do MVP.
