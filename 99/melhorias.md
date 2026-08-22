Sim. Reestruturei o material para reduzir o efeito de “especificação que já decidiu a implementação”. Mantive como invariantes os pontos realmente essenciais — matemática integrada ao mundo, aprendizagem por fato, erro com revisão espaçada, 2–4 NPCs funcionais por região, compatibilidade de save, Vertical Slice, TDD, Playwright, Stryker, i18n e WCAG 2.2.  

Também transformei a forma de trabalho em **gates baseados em evidência**: o Codex primeiro investiga, depois decide a arquitetura e só então implementa incrementalmente. Isso preserva a intenção original de investigar antes de editar, mas evita obrigá-lo a parar esperando aprovação humana a cada fase. 

# Numi 99 — Evolução do Produto Infantil/Educacional

Você está trabalhando no projeto existente **Numi 99**.

Sua missão é evoluir o produto, não recriá-lo.

Preserve tudo que já funciona bem — arquitetura, identidade visual, exploração 3D, mecânicas, progressão e conteúdo — e modifique apenas o que for necessário para atingir os objetivos abaixo.

---

# 1. Objetivo

Evoluir o Numi 99 para que seja um jogo infantil educacional no qual:

* a matemática se adapte ao desempenho individual da criança;
* erros se transformem em oportunidades de aprendizagem;
* fatos difíceis reapareçam de forma inteligente;
* cada região tenha NPCs com função real;
* progressão não dependa de grinding;
* a criança saiba claramente o que pode fazer;
* mobile tenha menor carga cognitiva;
* acessibilidade seja tratada como requisito;
* exploração continue sendo o centro da experiência.

## Princípio de produto

> A criança entra no Numi 99 para explorar, descobrir, construir, ajudar personagens e transformar o mundo. A matemática é uma ferramenta para interagir com esse mundo.

Nunca converta o jogo em:

`andar → responder conta → receber recompensa → repetir`

A matemática não deve ser um pedágio para toda interação.

Deve continuar existindo espaço para:

* exploração;
* descoberta;
* animais;
* conversa;
* construção;
* decoração;
* observação;
* coleta;
* acontecimentos ambientais;
* recompensas previamente conquistadas;
* uso livre do mundo.

---

# 2. Regra de trabalho: evidência antes de decisão

Não assuma que a descrição deste prompt representa perfeitamente a implementação atual.

**O código é a fonte de verdade sobre o estado atual.
Este prompt é a fonte de verdade sobre o comportamento desejado.**

Antes de criar uma solução:

1. investigue o projeto;
2. encontre o comportamento atual;
3. localize testes que o protegem;
4. identifique código que pode ser evoluído;
5. identifique impactos e dependências;
6. somente então escolha a implementação.

Não implemente uma abstração sugerida neste prompt apenas porque ela foi mencionada.

Se o projeto já possuir uma solução equivalente, **evolua-a**.

Não duplique domínio, estado ou regras existentes.

---

# 3. Escopo inicial de investigação

Comece principalmente por:

* `src/app/`
* `src/slices/math/`
* `src/slices/economy/`
* `src/slices/npc/`
* `src/slices/regions/`
* `src/slices/navigation/`
* `src/slices/resources/`
* `src/slices/save/`
* `src/slices/settings/`
* `src/slices/home/`
* `src/slices/wildlife/`
* `src/slices/daily/`
* testes Vitest;
* testes Playwright;
* configuração Stryker;
* i18n;
* documentação relevante.

Procure especialmente por:

* geração atual dos desafios matemáticos;
* `knownFacts`;
* `factCounts`;
* regra de progressão das pontes;
* persistência;
* economia;
* NPCs existentes;
* professor;
* comerciante;
* encomendas;
* distratores das questões;
* HUD;
* minimapa;
* comportamento mobile;
* acessibilidade existente.

---

# 4. GATE 0 — Auditoria

Antes de alterar funcionalidade, produza internamente uma visão objetiva do estado atual.

Determine:

### Matemática

* como fatos são escolhidos;
* o que representa aprendizado atualmente;
* como acertos são armazenados;
* como erros são tratados;
* como distratores são produzidos;
* como domínio influencia progressão hoje.

### NPCs

Para cada região:

* NPCs existentes;
* papel atual;
* interação;
* mecânica associada;
* utilidade real;
* redundâncias.

### Progressão

Identifique:

* regras de desbloqueio;
* pontes;
* dependências matemáticas;
* bloqueios;
* possíveis fontes de grinding.

### Economia

Estime para as recompensas relevantes:

`recompensa → recursos → desafios matemáticos necessários`

### UX

Identifique no mobile:

* elementos permanentemente visíveis;
* sobreposição;
* informação redundante;
* ações fora de contexto;
* dificuldade para identificar o objetivo atual.

### Engenharia

Identifique:

* slices afetadas;
* contratos existentes;
* persistência;
* migrações necessárias;
* testes relevantes;
* riscos de regressão.

## Gate de decisão

Nenhuma arquitetura nova deve ser escolhida antes desta auditoria.

Quando houver mais de uma solução plausível, escolha a que:

1. reutiliza mais do sistema existente;
2. cria menos estado;
3. possui regras mais determinísticas;
4. é mais simples de testar;
5. preserva Vertical Slice;
6. possui menor risco de regressão.

Não faça refatorações sem relação direta com a missão.

---

# 5. PRIORIDADE 1 — Aprendizagem adaptativa

Esta é a mudança estrutural mais importante.

O sistema deve evoluir conceitualmente de:

> Quantas vezes a criança acertou este fato?

para:

> Qual é o domínio atual desta criança sobre este fato?

Cada fato matemático deve poder evoluir independentemente.

Exemplo:

* `2 × 1` pode estar dominado;
* `2 × 4` pode estar em revisão;
* `2 × 8` pode estar sendo aprendido.

Não trate todos os multiplicadores como igualmente difíceis.

Considere duas fontes de dificuldade:

### Prior inicial

Pode existir uma dificuldade conceitual inicial.

Por exemplo:

* mais simples: ×1, ×2, ×5, ×10;
* intermediários: ×3, ×4;
* mais difíceis inicialmente: ×6, ×7, ×8, ×9.

Isso é apenas um **prior**.

### Evidência individual

O comportamento real da criança deve progressivamente ter mais peso.

Se ela:

* domina ×8 rapidamente, reduza sua prioridade;
* erra ×4 repetidamente, aumente sua prioridade.

O sistema deve adaptar-se à criança, e não obrigá-la a seguir uma dificuldade teórica fixa.

---

# 6. Requisitos comportamentais do domínio matemático

Não existe obrigatoriedade de usar determinados nomes de classes, interfaces ou campos.

Escolha o modelo mínimo capaz de representar corretamente:

* fato matemático;
* histórico de acertos;
* histórico de erros;
* estado de aprendizagem;
* domínio;
* sequência recente;
* última exposição relevante;
* revisão futura;
* dificuldade individual.

Evite armazenar dados que possam ser derivados com segurança.

Evite dezenas de métricas.

O algoritmo deve permanecer:

* pequeno;
* determinístico;
* explicável;
* persistível;
* testável.

Deve ser possível responder:

> Por que `2 × 8` apareceu agora?

com uma explicação simples, como:

> Porque houve dificuldade recente, outros exercícios já ocorreram desde então e chegou o momento de revisar.

Não use machine learning.

Não crie backend para isso.

Não transforme o jogo em um LMS.

---

# 7. Regra central de erro

Quando a criança errar um fato:

**esse fato deve voltar.**

Mas não necessariamente no próximo desafio.

Evite:

`2×8 → erro → 2×8 → erro → 2×8`

Prefira algo equivalente a:

`2×8 → erro → outros fatos → 2×8 → revisão`

Quando a criança recuperar corretamente esse fato, aumente gradualmente a distância até a próxima revisão.

O comportamento esperado é uma forma simples de:

**adaptive spaced retrieval**

Não é necessário implementar um algoritmo acadêmico sofisticado.

O requisito é o comportamento.

---

# 8. Tratamento pedagógico do erro

Erro não deve significar apenas:

> Errado. A resposta é 16.

Quando a mecânica e o contexto permitirem, forneça uma explicação curta utilizando o próprio mundo ou representação concreta.

Exemplo conceitual:

`2 grupos de 8 → 8 + 8 → 2 × 8 = 16`

A intervenção deve:

1. mostrar o conceito;
2. esclarecer a resposta;
3. durar pouco;
4. devolver rapidamente o controle;
5. agendar nova oportunidade de recuperação.

Não transforme cada erro em uma aula.

## Erro nunca deve causar

* perda de moedas;
* perda de inventário;
* dano;
* game over;
* humilhação;
* linguagem negativa;
* cronômetro de pressão;
* perda total do progresso daquele fato.

Erro significa:

> ainda estamos aprendendo.

---

# 9. Política de seleção dos desafios

A escolha de questões deve deixar de ser puramente aleatória.

Considere prioritariamente:

* fatos com dificuldade recente;
* revisões vencidas;
* fatos em aprendizagem;
* fronteira atual de novos conteúdos;
* domínio individual;
* dificuldade inicial;
* revisões ocasionais de fatos dominados.

Não fixe percentuais arbitrários sem necessidade.

Uma distribuição como:

* maior peso para dificuldade/revisão;
* peso intermediário para aprendizagem atual;
* peso menor para manutenção de fatos dominados;

pode ser usada como ponto de partida, não como requisito arquitetural.

## Invariantes

O seletor deve garantir que:

* erros aumentem a chance futura de revisão;
* o mesmo erro não seja mecanicamente repetido de imediato;
* o fato retorne posteriormente;
* recuperações sucessivas aumentem o intervalo;
* fatos dominados ainda apareçam ocasionalmente;
* dificuldade individual possa superar a dificuldade teórica;
* a seleção seja determinística/testável quando RNG/clock forem controlados.

---

# 10. Fonte única de verdade

O progresso pedagógico deve existir em um único domínio.

Professor, desafios, pontes, resumo de progresso e demais sistemas devem **consultar essa mesma fonte**.

Nunca crie:

`mathErrors`

e depois:

`teacherErrors`

ou estruturas equivalentes independentes representando a mesma informação.

Um fato matemático possui um único estado pedagógico autoritativo.

---

# 11. NPCs — invariantes

Cada região jogável deve possuir:

**mínimo: 2 NPCs
máximo: 4 NPCs**

Não maximize a quantidade.

Prefira:

> 2 NPCs excelentes

a:

> 4 NPCs redundantes.

Cada NPC deve possuir função sistêmica concreta.

Use este teste mental:

> Se este NPC desaparecer, alguma mecânica, progressão, ajuda pedagógica, atividade contextual ou função narrativa do mundo desaparece junto?

Se não, ele provavelmente não precisa existir.

---

# 12. Estrutura funcional mínima por região

Cada região deve possuir pelo menos:

## A. Mentor / Professor

Função pedagógica.

Ele deve consumir o estado real de aprendizagem daquela região e poder, quando apropriado:

* oferecer ajuda voluntária;
* trabalhar fatos em dificuldade;
* apresentar uma estratégia;
* utilizar representação visual;
* oferecer treino sem punição;
* comunicar progresso;
* indicar naturalmente o que ainda precisa ser consolidado.

Não exponha métricas internas para a criança.

Evite:

> Você errou 2×8 três vezes.

Prefira linguagem como:

> Essa parece estar mais difícil. Quer tentar comigo?

## B. Habitante funcional

Deve representar uma necessidade coerente com a região e com as mecânicas existentes.

Pode estar relacionado a:

* encomendas;
* coleta;
* transformação do ambiente;
* construção;
* fauna;
* exploração;
* pesquisa;
* agricultura;
* comércio;
* progressão;
* atividades contextualizadas.

Escolha o papel depois de analisar as mecânicas reais da região.

## NPCs 3 e 4

Somente quando houver justificativa sistêmica.

Exemplos possíveis:

* comerciante;
* construtor;
* cuidador;
* especialista;
* guardião;
* explorador;
* pesquisador.

Não são requisitos.

---

# 13. Progressão

Reavalie progressão baseada apenas em quantidade bruta de acertos.

Uma ponte deve significar aproximadamente:

> existe domínio suficiente para avançar.

E não simplesmente:

> completou N exercícios.

Não bloqueie a criança por perfeccionismo.

A progressão deve:

* ser compreensível;
* ser determinística;
* evitar grinding;
* não depender de sorte;
* indicar claramente o que falta;
* aproveitar o novo conceito de domínio quando fizer sentido.

O Professor pode ajudar a comunicar naturalmente uma lacuna restante.

---

# 14. Economia

Adicione uma métrica de design:

## Questions per Reward

Para cada recompensa relevante, determine aproximadamente:

`recompensa → recursos/moedas → número de desafios → tempo`

Use isso para identificar grinding.

Audite especialmente:

* pontes;
* construções;
* loja;
* decoração;
* sementes;
* upgrades;
* encomendas.

Uma recompensa infantil pequena não deve exigir dezenas de exercícios repetitivos.

Reduza grinding sem tornar:

* moedas;
* recursos;
* coleta;
* construção;

irrelevantes.

---

# 15. Exploração também recompensa

Nem toda recompensa deve exigir uma nova multiplicação.

Preserve ou introduza, quando coerente:

* descoberta;
* exploração;
* fauna;
* retorno ao jogo;
* colecionáveis;
* amizade;
* acontecimentos ambientais;
* decoração;
* observação;
* transformações já conquistadas.

A criança deve sentir que **vive naquele mundo**, não que está apenas pagando por tudo com respostas matemáticas.

---

# 16. UX mobile

A pergunta central é:

> Uma criança consegue descobrir rapidamente o que pode fazer agora?

Prioridade visual:

1. mundo;
2. interação atual;
3. objetivo atual;
4. progresso relevante;
5. informação secundária.

Evite uma tela dominada por:

* HUD;
* minimapa;
* banners;
* recursos;
* menus;
* receitas;
* textos;
* botões permanentemente visíveis.

Use **progressive disclosure**.

Exiba ações principalmente quando forem relevantes ao contexto.

Exemplos:

* perto da árvore → `Coletar madeira`;
* perto do animal → `Dar comida`;
* perto da ponte → `Consertar ponte`.

Não mantenha instruções na tela quando a ação não puder ser executada.

---

# 17. Minimapa

O mapa deve ajudar a responder:

> Onde estou?

e principalmente:

> Para onde devo ir?

Avalie, conforme evidência visual:

* redução de tamanho;
* estado recolhido;
* expansão sob demanda;
* landmarks;
* objetivo atual;
* indicador de direção;
* menos labels;
* destaque apenas de informação relevante.

Não implemente todas essas sugestões automaticamente.

Escolha apenas as que resolverem problemas observados.

---

# 18. Acessibilidade

WCAG 2.2 e acessibilidade cognitiva são requisitos.

Audite e corrija, quando aplicável:

* contraste;
* foco;
* teclado;
* touch targets;
* escalabilidade de texto;
* informação dependente exclusivamente de cor;
* estados desabilitados;
* feedback;
* movimento;
* minimapa;
* clareza cognitiva.

Nenhuma informação essencial deve depender apenas da cor.

Combine quando necessário:

* cor;
* forma;
* ícone;
* borda;
* padrão;
* texto.

Respeite `prefers-reduced-motion` e mecanismos equivalentes já existentes.

Dê atenção especial à acessibilidade cognitiva:

* menos informação simultânea;
* instruções curtas;
* hierarquia clara;
* tempo suficiente de leitura;
* menor dependência de memória;
* números sempre que possível apresentados em contexto.

---

# 19. Internacionalização

Todo novo texto apresentado ao usuário deve utilizar o sistema i18n existente.

Não introduza strings de interface diretamente em componentes quando o projeto já possuir mecanismo de tradução.

Mantenha separação entre:

* regra de negócio;
* conteúdo localizado.

---

# 20. Persistência

O novo progresso pedagógico deve sobreviver ao reload.

Saves existentes devem continuar válidos.

Se a estrutura persistida precisar mudar:

1. versione;
2. migre;
3. teste a migração.

Dados antigos como `knownFacts` e `factCounts` devem ser convertidos para um estado inicial razoável.

Nunca destrua silenciosamente:

* moedas;
* itens;
* decoração;
* animais;
* fatos aprendidos;
* aparência;
* progressão.

---

# 21. Arquitetura

Preserve **Vertical Slice**.

A localização exata do novo domínio deve ser decidida com base no código encontrado.

Uma slice pedagógica dedicada pode ser adequada se criar uma fronteira de domínio clara, mas isso é uma hipótese, não uma ordem.

Evite:

* abstrações genéricas prematuras;
* frameworks internos;
* serviços sem necessidade;
* event buses desnecessários;
* estados duplicados;
* dependências circulares.

Prefira:

* funções puras para regras;
* estado mínimo;
* dependências explícitas;
* interfaces pequenas;
* comportamento testável independentemente da renderização 3D.

---

# 22. TDD

Toda regra de negócio nova deve ser desenvolvida seguindo:

**RED → GREEN → REFACTOR**

Não escreva toda a feature para depois adicionar testes.

Trabalhe em slices verticais pequenas:

`comportamento → teste falhando → implementação mínima → testes verdes → refactor`

Priorize funções puras para:

* domínio;
* dificuldade;
* revisão;
* seleção;
* domínio/mastery;
* migração;
* progressão;
* economia;
* invariantes de NPC.

---

# 23. Testes obrigatórios de comportamento

Proteja pelo menos estes comportamentos:

### Aprendizagem

* erro aumenta prioridade futura;
* erro não força repetição imediatamente;
* fato errado reaparece;
* recuperações posteriores aumentam intervalo;
* erro reduz domínio sem apagar histórico;
* dificuldade individual altera prioridade;
* fatos dominados recebem revisão de manutenção.

### NPCs

Para toda região:

`2 <= NPC count <= 4`

Além da contagem, o modelo deve tornar difícil cadastrar um NPC sem comportamento/função real.

Não considere uma simples string `purpose` evidência suficiente de função.

### Persistência

Teste migração de save realista da estrutura anterior.

### Progressão

Teste que avanço não dependa de RNG favorável nem apenas de contagem bruta quando domínio pedagógico for a nova regra.

---

# 24. Playwright

Cubra fluxos críticos.

## Fluxo pedagógico

`desafio → erro → feedback curto → continuar jogando → outros desafios → revisão do fato`

## Professor

`dificuldade registrada → conversar com professor → ajuda coerente com o estado pedagógico`

## Mobile

Valide:

* HUD;
* objetivo;
* minimapa;
* ações contextuais;
* touch;
* portrait;
* landscape quando suportado;
* overlays;
* estados desabilitados;
* ausência de sobreposição.

Quando houver screenshots E2E:

**inspecione-as visualmente.**

Teste passar sem exception não significa que a interface está visualmente correta.

---

# 25. Mutation Testing

Use Stryker nas regras onde um falso positivo seria perigoso.

Priorize:

* prioridade após erro;
* intervalos;
* domínio;
* dificuldade;
* revisão;
* progressão;
* limites de NPC;
* migração;
* economia.

Não persiga 100% de mutation score artificialmente.

O objetivo é provar que os testes realmente detectam mudanças nas regras críticas.

---

# 26. Performance

Não transforme o domínio pedagógico em lógica de render loop.

Não recalcular seleção ou domínio a 60 FPS.

Execute essas regras em eventos relevantes, por exemplo:

* desafio criado;
* resposta registrada;
* sessão carregada;
* revisão consultada;
* progressão avaliada.

Evite mover para estado React dados de alta frequência que não precisam provocar renderização.

---

# 27. Ordem de implementação

Respeite as dependências do domínio.

Execute nesta ordem:

### Fase 0 — Auditoria

Nenhuma feature nova.

Saída:

* estado atual;
* gaps;
* riscos;
* slices afetadas;
* testes relevantes;
* impacto de save;
* inventário de NPCs;
* análise de economia;
* decisão arquitetural.

### Fase 1 — Domínio pedagógico

Implemente com funções puras e TDD:

* progresso por fato;
* erro;
* domínio;
* dificuldade;
* revisão;
* seleção;
* persistência/migração.

**Gate:** deve ser possível simular muitas respostas em testes sem renderizar o jogo.

### Fase 2 — Geração de desafios

Integre o domínio ao jogo existente.

**Gate:** desafios adaptativos funcionam no jogo sem depender ainda de Professor ou nova UX.

### Fase 3 — Feedback de erro

Integre feedback pedagógico curto.

**Gate:** errar ensina alguma coisa sem quebrar o fluxo.

### Fase 4 — NPCs

Garanta população funcional de 2–4 NPCs por região e conecte o Professor à fonte única de verdade pedagógica.

**Gate:** todo NPC consegue justificar mecanicamente sua existência.

### Fase 5 — Progressão

Integre domínio às pontes/progressão quando adequado.

**Gate:** avanço é compreensível, testável e sem grinding artificial.

### Fase 6 — Economia

Calcule Questions per Reward e rebalanceie onde houver evidência de grinding.

### Fase 7 — UX mobile

Reduza carga cognitiva e aplique progressive disclosure.

### Fase 8 — Acessibilidade

Execute auditoria e correções WCAG 2.2 + acessibilidade cognitiva.

### Fase 9 — E2E e visual

Execute Playwright e inspecione screenshots.

### Fase 10 — Hardening

Execute o conjunto completo de validações.

---

# 28. Não espere aprovação desnecessariamente

Você deve trabalhar de forma autônoma.

Não interrompa a execução apenas para perguntar qual implementação escolher se o próprio código, testes e princípios deste prompt permitirem tomar uma decisão segura.

Quando existir dúvida:

1. investigue;
2. prefira a solução mais simples;
3. documente a decisão;
4. prossiga.

Pare e reporte antes de continuar somente se houver risco real de:

* perda de dados;
* quebra incompatível de save sem estratégia de migração;
* alteração arquitetural ampla não justificada;
* remoção de comportamento importante cujo propósito não possa ser determinado;
* contradição impossível de resolver entre requisitos essenciais.

---

# 29. Contrato de evidência por fase

Ao concluir cada fase, não diga apenas que está pronta.

Mostre evidência.

Informe concisamente:

### Implementado

O comportamento efetivamente alterado.

### Evidência

Testes, screenshots, simulações ou métricas que demonstram o resultado.

### Decisões

Escolhas arquiteturais importantes e por quê.

### Regressões

O que foi executado para verificar que funcionalidades existentes continuam válidas.

### Débito

Qualquer requisito ainda não atendido deve ser declarado explicitamente.

Não marque requisito como concluído sem evidência.

---

# 30. Definition of Done

O trabalho somente está concluído quando houver evidência de que:

## Pedagogia

* progresso existe por fato;
* erros são registrados;
* fatos difíceis voltam;
* não há repetição mecânica imediata;
* revisões possuem espaçamento progressivo;
* desempenho individual influencia dificuldade;
* fatos dominados continuam sendo revisados;
* erro não apaga progresso;
* feedback de erro é curto e pedagógico.

## NPCs

* todas as regiões possuem 2–4 NPCs;
* nenhum NPC existe apenas como decoração funcional;
* Professor utiliza a fonte real de progresso;
* NPCs não duplicam estado pedagógico.

## Progressão e economia

* progressão não depende apenas de contagem bruta quando o novo domínio puder representá-la melhor;
* progressão é compreensível;
* Questions per Reward foi analisado;
* grinding excessivo identificado foi reduzido.

## UX

* objetivo atual tem prioridade;
* ações são contextuais;
* HUD mobile tem menor carga cognitiva;
* minimapa ajuda navegação;
* screenshots críticas foram verificadas.

## Qualidade

* save anterior continua válido;
* i18n cobre textos novos;
* WCAG 2.2 relevante foi considerada;
* reduced motion é respeitado;
* unit tests passam;
* integration tests passam;
* Playwright passa;
* mutation testing protege regras críticas;
* typecheck passa;
* lint passa;
* production build passa.

---

# 31. Validação final

Antes de declarar conclusão, execute o conjunto relevante disponível no projeto:

```text
lint
typecheck
unit tests
integration tests
Playwright / E2E
mutation testing
production build
```

Não afirme que algo passou sem executar o comando correspondente.

Se algum comando não puder ser executado:

* diga qual;
* diga por quê;
* não apresente essa validação como concluída.

---

# 32. Resultado esperado

Ao final, o Numi 99 deve ser capaz de perceber algo equivalente a:

> Esta criança já domina 2×1, mas ainda está consolidando 2×8.

E o mundo deve reagir naturalmente a essa diferença.

A experiência da criança não deve ser:

> O jogo está me testando.

Deve ser:

> Estou ficando melhor enquanto jogo.

Esse é o critério norteador para todas as decisões deste trabalho.

Essa versão troca muita **prescrição estrutural** por **prescrição comportamental**. Por exemplo, em vez de mandar criar `FactProgress` com exatamente 11 campos, ela exige que o domínio seja capaz de representar aquelas propriedades e deixa o Codex escolher a estrutura depois de examinar o código. O documento original já enfatizava que o algoritmo deveria ser pequeno, determinístico, explicável e testável; coloquei isso como uma restrição arquitetural central. 

A outra diferença importante é o **Contrato de Evidência**. Ele reduz bastante a tendência dos agentes de declarar “feito” apenas porque escreveram código: cada fase precisa terminar demonstrando comportamento, testes, regressões e dívida restante. Isso combina especialmente bem com o TDD incremental já definido no seu material. 
