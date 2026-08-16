Você atuará como **Senior Game Engineer, Frontend Architect, UX Engineer, Accessibility Engineer e Educational Game Designer**.

Sua tarefa é transformar a especificação abaixo em um **MVP completo, funcional, jogável, testado e executável no navegador**.

Não entregue apenas protótipos, wireframes, pseudocódigo, scaffolding ou telas estáticas.

**Implemente o jogo.**

---

# 1. REGRA PRINCIPAL DE EXECUÇÃO

Antes de escrever código:

1. inspecione completamente o repositório;
2. leia `README`, `AGENTS.md`, configurações, package manager e convenções existentes;
3. preserve padrões válidos já adotados no projeto;
4. identifique conflitos entre esta especificação e o estado atual do repositório;
5. elabore um plano de implementação curto e objetivo;
6. execute o plano;
7. implemente verticalmente até existir um jogo realmente utilizável;
8. execute testes, lint, typecheck e build;
9. corrija os problemas encontrados;
10. somente depois considere o trabalho concluído.

Não pare depois de escrever o plano.

Não deixe `TODO`, mocks vazios, telas falsas ou fluxos interrompidos sem necessidade.

Quando houver uma escolha técnica não especificada, prefira:

* simplicidade;
* baixo acoplamento;
* código testável;
* acessibilidade;
* desempenho;
* manutenção;
* poucas dependências;
* soluções determinísticas.

Não transforme o MVP em uma arquitetura enterprise desnecessária.

---

# 2. VISÃO DO PRODUTO

Nome:

# 🏪 Lojinha Maluca

Público principal:

**crianças de 9 a 10 anos.**

Objetivo pedagógico principal:

> Ensinar e consolidar multiplicação de forma contextualizada, mostrando para a criança **para que a multiplicação serve**, em vez de apresentar somente exercícios abstratos de memorização.

O jogo deve transformar situações como:

`6 × 7 = ?`

em situações concretas:

> Um cliente quer 6 cadernos.
> Cada caderno custa R$ 7.
> Quanto ele deve pagar?

A criança administra uma loja, atende clientes, calcula compras, recebe dinheiro, acompanha o fechamento financeiro e usa o caixa para melhorar e personalizar sua loja.

A matemática deve existir **dentro da fantasia da loja**.

O jogo não deve parecer uma lista de exercícios com decoração.

---

# 3. PRINCÍPIOS FUNDAMENTAIS

Preserve estes princípios durante toda a implementação.

## 3.1 Multiplicação contextual

Sempre que possível:

`quantidade × preço unitário = total`

Exemplo:

`6 × R$ 7 = R$ 42`

---

## 3.2 Concreto → visual → simbólico

A criança inicialmente deve compreender:

```text
6 produtos

R$ 7 cada

7 + 7 + 7 + 7 + 7 + 7

6 × 7

42
```

Conforme demonstra domínio, o sistema remove gradualmente as pistas.

---

## 3.3 Erro não é punição

Nunca:

* retirar dinheiro porque houve erro matemático;
* diminuir XP;
* humilhar;
* tocar buzina agressiva;
* mostrar personagem decepcionado;
* usar mensagens como “Você é ruim nisso”;
* exigir sequência perfeita;
* reiniciar progresso.

Erro deve provocar **ajuda progressiva**.

---

## 3.4 Sem pressão de velocidade

O modo normal não terá cronômetro.

Tempo de resposta **não deve fazer parte do cálculo de domínio matemático**.

---

## 3.5 Aprendizagem invisível

O sistema acompanha domínio internamente.

A criança não deve ver:

```text
Domínio da tabuada: 71%
Nota: 8,3
Precisão: 82%
Ranking matemático
```

Ela deve perceber:

> Minha loja está crescendo.

---

## 3.6 Progressão concreta

Sempre que a criança compra algo ou avança de capítulo, deve haver uma mudança perceptível na loja.

Não use recompensas puramente abstratas quando puder existir uma recompensa visual.

---

# 4. ESCOPO DO MVP

Implementar:

* SPA web responsiva;
* desktop e tablet como plataformas principais;
* suporte razoável a telas menores;
* funcionamento offline depois do primeiro carregamento completo;
* sem backend;
* sem login;
* múltiplos perfis locais;
* IndexedDB;
* quatro lojas temáticas;
* avatar personalizável;
* visual voxel/blocos;
* clientes recorrentes;
* 5–6 clientes por dia;
* multiplicações entre `1 × 1` e `10 × 10`;
* sistema matemático adaptativo;
* múltipla escolha;
* três alternativas;
* distratores pedagógicos;
* ajuda progressiva;
* capítulos;
* economia simples;
* melhorias funcionais;
* melhorias cosméticas;
* objetivos opcionais;
* conquistas;
* narração opcional;
* áudio configurável;
* acessibilidade WCAG 2.2 AA como baseline;
* redução de movimento;
* persistência completa;
* testes automatizados.

---

# 5. FORA DO ESCOPO

NÃO implementar no MVP:

* backend;
* cadastro online;
* e-mail;
* senha;
* autenticação;
* sincronização em nuvem;
* multiplayer;
* ranking;
* leaderboard;
* chat;
* anúncios;
* compras reais;
* microtransações;
* loot boxes;
* moedas premium;
* servidor;
* banco de dados remoto;
* analytics externo;
* tracking publicitário;
* coleta de dados pessoais;
* data de nascimento;
* nome real obrigatório;
* estoque limitado;
* gestão manual de estoque;
* pedidos com mais de um tipo de produto;
* divisão;
* porcentagem;
* troco;
* contas com centavos;
* preços decimais;
* movimentação manual do avatar;
* mundo 3D livre;
* WebGL complexo;
* cronômetros obrigatórios;
* streaks de desempenho;
* conquistas por perfeição;
* instalação PWA obrigatória;
* qualquer asset, textura, personagem, nome, logotipo ou elemento protegido do Minecraft.

A estética pode lembrar **voxel/block games**, mas deve possuir identidade própria.

---

# 6. STACK TÉCNICA PREFERENCIAL

Se o repositório ainda não tiver stack definida, utilize:

* React;
* TypeScript;
* Vite;
* HTML semântico;
* CSS moderno;
* CSS Modules ou organização equivalente;
* IndexedDB;
* Service Worker;
* Vitest;
* React Testing Library;
* Playwright;
* axe para verificações automatizadas de acessibilidade;
* ESLint;
* formatter consistente.

Evite adicionar framework de UI pesado.

Não use uma game engine 3D para este MVP.

Prefira:

* DOM;
* CSS;
* SVG;
* CSS transforms;
* pequenas animações CSS.

A cena voxel/isométrica pode ser construída visualmente com SVG/CSS.

A interface funcional deve permanecer DOM semântico.

---

# 7. ORGANIZAÇÃO DE CÓDIGO

Mantenha domínio e interface separados.

Uma estrutura possível:

```text
src/
├── app/
│   ├── App.tsx
│   ├── AppProvider.tsx
│   └── appReducer.ts
│
├── domain/
│   ├── math/
│   │   ├── facts.ts
│   │   ├── mastery.ts
│   │   ├── scheduler.ts
│   │   ├── distractors.ts
│   │   └── hints.ts
│   │
│   ├── game/
│   │   ├── session.ts
│   │   ├── chapters.ts
│   │   ├── objectives.ts
│   │   └── achievements.ts
│   │
│   ├── economy/
│   │   ├── economy.ts
│   │   └── upgrades.ts
│   │
│   └── profile/
│       └── profile.ts
│
├── content/
│   ├── stores.ts
│   ├── products.ts
│   ├── customers.ts
│   ├── cosmetics.ts
│   └── messages.ts
│
├── infrastructure/
│   ├── storage/
│   ├── offline/
│   └── audio/
│
├── accessibility/
│
├── components/
│
├── screens/
│
├── styles/
│
└── tests/
```

Não siga essa estrutura cegamente caso o projeto existente possua uma organização melhor.

---

# 8. IDIOMA

Interface do MVP:

**Português do Brasil.**

Código, tipos e identificadores podem ser escritos em inglês.

Centralize textos de interface em um módulo de conteúdo para facilitar futura internacionalização.

Não precisa implementar seletor de idiomas agora.

---

# 9. PERFIS LOCAIS

O jogo deve permitir múltiplos jogadores no mesmo navegador.

Tela inicial:

# Quem vai jogar?

Mostrar cards com:

* avatar;
* apelido;
* tipo de loja;
* capítulo;
* botão para entrar.

Também:

> * Criar novo jogador

Não solicitar:

* e-mail;
* nome real;
* idade;
* telefone;
* endereço;
* localização.

---

# 10. CRIAÇÃO DO PERFIL

Fluxo:

```text
Selecionar jogador
        ↓
Criar perfil
        ↓
Escolher apelido
        ↓
Personalizar avatar
        ↓
Escolher loja
        ↓
Escolher estilo-base
        ↓
Configurações rápidas de acessibilidade
        ↓
Começar
```

---

# 11. APELIDO

Pergunta:

> Como você quer ser chamado na sua loja?

Permitir texto livre.

Adicionar sugestões como:

* Lojista Pixel
* Mestre dos Blocos
* Capitão da Loja
* Construtor Pixel
* Gerente Voxel

Adicionar:

> 🎲 Surpreenda-me

Não sugerir que seja necessário informar nome real.

---

# 12. AVATAR

Avatar simples em estilo voxel/blocos.

A criança pode escolher:

* aparência;
* cabelo;
* roupa;
* acessório;
* avental/uniforme.

As opções são puramente cosméticas.

Nenhum avatar possui vantagem.

O avatar aparece:

* na loja;
* atrás do balcão;
* em transições;
* em pequenas animações automáticas.

A criança **não movimenta manualmente o avatar**.

---

# 13. PARTICIPAÇÃO DO AVATAR

Quando uma ação ocorre:

* cliente chega;
* produtos são separados;
* compra é concluída;
* produto novo é adquirido;

o avatar pode executar animações automáticas curtas.

Essas animações nunca podem:

* bloquear a interface;
* impedir continuar;
* esconder informação;
* ser obrigatórias para compreender o resultado.

---

# 14. DIREÇÃO VISUAL

Visual:

**voxel / blocos / diorama isométrico.**

Não copiar Minecraft.

Não usar:

* texturas de Minecraft;
* Creeper;
* Steve;
* fontes imitadas;
* logotipos;
* sons;
* assets;
* nomes protegidos.

Criar identidade própria.

Características:

* formas cúbicas;
* volumes simples;
* sombras;
* perspectiva isométrica;
* personagens blocados;
* objetos legíveis;
* cores amigáveis;
* interface limpa.

---

# 15. CÂMERA HÍBRIDA

## Visão geral

Loja em perspectiva isométrica.

Mostrar:

* avatar;
* balcão;
* clientes;
* prateleiras;
* produtos;
* decoração;
* expansões.

## Atendimento

Ao iniciar a atividade matemática:

* reduzir distrações;
* aproximar visualmente o balcão;
* apresentar uma interface frontal;
* deixar quantidade, preço e alternativas extremamente legíveis.

A estética voxel continua presente, mas não deve competir com a matemática.

---

# 16. LOJAS DO MVP

Todas disponíveis desde o começo.

A criança escolhe livremente.

## 16.1 Livraria

Produtos:

### iniciais

* Marcador — R$ 2
* Revista — R$ 4
* Livro — R$ 7

### disponíveis posteriormente

* Quadrinho — R$ 5
* Caderno — R$ 6
* Atlas — R$ 9

---

## 16.2 Loja de Arte

### iniciais

* Lápis — R$ 1
* Pincel — R$ 3
* Régua — R$ 5

### posteriormente

* Bloco de desenho — R$ 6
* Estojo — R$ 8
* Tela pequena — R$ 10

---

## 16.3 Loja de Esportes

### iniciais

* Cone — R$ 2
* Corda — R$ 3
* Garrafa esportiva — R$ 5

### posteriormente

* Peteca — R$ 6
* Bola — R$ 8
* Raquete — R$ 10

---

## 16.4 Tecnologia & Robótica

Evitar produtos inadequados ou perigosos.

### iniciais

* LED para projeto — R$ 1
* Cabo de conexão — R$ 2
* Botão eletrônico — R$ 4

### posteriormente

* Sensor — R$ 6
* Mini motor — R$ 8
* Kit maker — R$ 10

---

# 17. PREÇOS

Os preços são:

* inteiros;
* de R$ 1 a R$ 10;
* estáveis;
* associados permanentemente ao produto.

Não alterar o preço de um produto entre dias.

Não introduzir centavos.

Exibir, por exemplo:

> R$ 7

em vez de obrigatoriamente:

> R$ 7,00

Os preços são **didaticamente simplificados**.

Não afirmar que representam preços reais de mercado.

---

# 18. PRODUTOS DISPONÍVEIS

Cada loja possui:

* 6 produtos;
* 3 disponíveis inicialmente;
* 3 adquiríveis posteriormente.

Produtos antigos nunca desaparecem.

Catálogo evolui:

```text
3 → 4 → 5 → 6
```

---

# 19. DESBLOQUEIO DOS PRODUTOS

No capítulo apropriado, novos produtos ficam **disponíveis para compra**.

Não entram automaticamente no catálogo.

A criança escolhe qual comprar primeiro.

Produtos não escolhidos continuam disponíveis futuramente.

Exemplo:

```text
NOVOS PRODUTOS

Quadrinho
Investimento: R$ 80
Preço de venda: R$ 5

Caderno
Investimento: R$ 110
Preço de venda: R$ 6

Atlas
Investimento: R$ 150
Preço de venda: R$ 9
```

---

# 20. CUSTOS DOS DESBLOQUEIOS

Use como baseline:

```text
pequeno impacto visual     R$ 80
médio impacto              R$ 110
grande impacto             R$ 150
```

Produto mais caro pode gerar:

* expositor maior;
* nova seção;
* iluminação;
* alteração visual maior.

Nunca pode gerar:

* multiplicador de dinheiro;
* vantagem matemática;
* respostas mais fáceis;
* maior domínio;
* bônus por acerto.

---

# 21. LOOP PRINCIPAL

O core loop é:

```text
Cliente chega
      ↓
Faz pedido
      ↓
Criança interpreta
      ↓
Quando necessário separa produtos
      ↓
Calcula
      ↓
Escolhe resposta
      ↓
Recebe feedback
      ↓
Venda é registrada
      ↓
Próximo cliente
```

Depois:

```text
5–6 clientes
      ↓
Fechamento
      ↓
Saldo
      ↓
Melhorias
      ↓
Personalização
      ↓
Próximo dia
```

---

# 22. DIAS

Uma sessão normal corresponde a um dia da loja.

Cada dia possui:

**5 ou 6 clientes.**

Não criar sessões longas.

Meta de UX:

aproximadamente **3–6 minutos**, dependendo do ritmo da criança.

Não há cronômetro.

---

# 23. TIPOS DE ATENDIMENTO

Misturar dois formatos.

## 23.1 Cálculo direto

Exemplo:

> Lia quer 6 livros.
> Cada livro custa R$ 7.

Pergunta:

> Quanto ela deve pagar?

---

## 23.2 Separação de produtos

Cliente:

> Quero 4 cadernos.

A criança seleciona visualmente:

```text
📘 📘 📘 📘
```

Depois:

> Cada caderno custa R$ 6.

Pergunta:

> Quanto custa a compra?

Não exigir drag-and-drop.

Pode existir arrastar como melhoria opcional, mas todas as ações devem funcionar por:

* clique;
* toque;
* teclado.

---

# 24. MÚLTIPLA ESCOLHA

Todas as respostas do MVP utilizam:

**3 alternativas.**

Exemplo:

```text
6 × 7 = ?

R$ 36
R$ 42
R$ 49
```

Não implementar campo numérico no MVP.

A posição correta deve variar.

Nunca criar padrão previsível.

---

# 25. DISTRATORES PEDAGÓGICOS

As alternativas erradas não devem ser números aleatórios sem significado.

Exemplo:

para:

`6 × 7 = 42`

podem aparecer:

`36`

porque:

`6 × 6 = 36`

e:

`49`

porque:

`7 × 7 = 49`

Crie `DistractorStrategy`.

Possíveis categorias:

```text
near_fact
square_fact
adjacent_multiplier
addition_like
quantity_price_confusion
fallback
```

Regras:

* nenhuma alternativa duplicada;
* somente uma correta;
* valores coerentes;
* não criar respostas absurdas;
* evitar pegadinhas;
* guardar qual distrator foi selecionado pela criança;
* usar essa informação somente para adaptação pedagógica.

---

# 26. FEEDBACK DE ERRO

Nunca usar apenas:

> ERRADO!

Preferir:

> Ainda não fechou a conta.

ou:

> Vamos conferir de outro jeito.

O erro deve acionar o sistema de pistas.

---

# 27. AJUDA PROGRESSIVA

Implementar quatro níveis.

## Nível 0

Sem ajuda adicional.

---

## Após primeiro erro

Mensagem contextual:

> Confira a quantidade e o preço de cada item.

---

## Após segundo erro

Mostrar representação concreta:

```text
📘 📘 📘 📘 📘 📘

R$ 7 cada
```

---

## Após terceiro erro

Mostrar soma repetida:

```text
7 + 7 + 7 + 7 + 7 + 7
```

---

## Persistindo a dificuldade

Mostrar relação completa:

```text
6 × 7 = 42
```

Depois permitir concluir o atendimento.

Nunca deixar a criança presa.

---

# 28. FEEDBACK DE ACERTO

Resposta comum:

> ✓ R$ 42 — certo!

e:

> * R$ 42 em vendas

Feedback:

* curto;
* positivo;
* não exagerado;
* som discreto;
* animação breve;
* cliente satisfeito.

Não usar uma celebração enorme a cada conta.

---

# 29. COMEMORAÇÕES MAIORES

Reservar para:

* novo produto;
* nova área;
* expansão;
* capítulo;
* conquista;
* catálogo completo.

Respeitar redução de movimento.

---

# 30. CLIENTES RECORRENTES

Criar um pequeno elenco fixo.

Sugestão:

* Lia
* Caio
* Bia
* Theo
* Nina
* Davi

Cada um possui:

* nome;
* aparência voxel própria;
* personalidade leve;
* frases características;
* preferências temáticas.

Evitar estereótipos.

Nenhuma característica física representa:

* inteligência;
* capacidade;
* dificuldade;
* comportamento.

Exemplos:

> Lia: “Quero 4 cadernos para o meu projeto.”

> Caio: “Preciso de 6 cones para uma atividade.”

> Bia: “Quero 5 sensores para montar um projeto.”

Os personagens reaparecem ao longo do jogo.

Podem reconhecer crescimento da loja:

> “Nossa, sua loja ganhou uma área nova!”

---

# 31. MATEMÁTICA DO MVP

Cobrir multiplicações:

```text
1 × 1
até
10 × 10
```

Existem internamente:

**100 fatos direcionais.**

Exemplo:

`7 × 8`

e:

`8 × 7`

são armazenados separadamente.

---

# 32. PROPRIEDADE COMUTATIVA

Os fatos são relacionados.

```text
7 × 8 ──┐
        ├── família 56
8 × 7 ──┘
```

Dominar `7 × 8` ajuda a estimativa de `8 × 7`.

Mas:

**não marcar automaticamente `8 × 7` como dominado.**

A segunda orientação deve aparecer ocasionalmente.

---

# 33. COBERTURA MATEMÁTICA E O LIMITE DOS 6 PRODUTOS

Este é um requisito arquitetural importante.

Cada loja possui apenas 6 produtos de preço fixo.

Portanto, somente pedidos:

```text
quantidade × preço
```

não conseguem representar todas as combinações possíveis de `1×1` até `10×10`.

NÃO resolva isso:

* mudando preços;
* criando preços aleatórios;
* aumentando silenciosamente para 10 produtos;
* quebrando a regra de preço fixo.

Quando um fato necessário não puder ser contextualizado naturalmente através de uma venda, utilize uma **atividade concreta curta da própria loja**.

Exemplos:

> Organize 7 prateleiras com 8 itens em cada.

`7 × 8 = ?`

ou:

> Prepare 9 caixas com 6 itens em cada.

`9 × 6 = ?`

Essas atividades devem:

* continuar contextualizadas;
* usar multiplicação;
* utilizar as mesmas 3 alternativas;
* utilizar o mesmo sistema de pistas;
* alimentar o mesmo modelo de domínio;
* ser raras;
* não transformar o jogo em outra modalidade.

No máximo uma atividade desse tipo em um dia quando pedagogicamente necessária.

---

# 34. NÃO ORGANIZAR POR “TABUADA DO N”

A criança não verá:

> Agora você está na tabuada do 7.

Não criar fases rígidas:

```text
tabuada do 2
tabuada do 3
tabuada do 4
...
```

Misturar fatos gradualmente.

Internamente, use bandas pedagógicas.

---

# 35. BANDAS INTERNAS DE INTRODUÇÃO

Sugestão:

## Banda A

Fatos que envolvem principalmente:

`1, 2, 5, 10`

## Banda B

Adicionar:

`3, 4`

## Banda C

Adicionar:

`6`

## Banda D

Adicionar:

`7, 8, 9`

## Banda E

Mistura completa.

Estas bandas são internas.

Nunca apresentar dessa maneira para a criança.

---

# 36. MODELO DE DOMÍNIO

Criar estrutura semelhante:

```ts
type MultiplicationFact = {
  a: number;
  b: number;

  attempts: number;
  independentCorrect: number;
  supportedCorrect: number;

  mastery: number;

  lastSeenDay?: number;
  lastHintDepth?: number;

  state:
    | "new"
    | "learning"
    | "consolidating"
    | "mastered";
};
```

Manter constantes da política centralizadas.

---

# 37. HEURÍSTICA DE DOMÍNIO

Não usar IA/ML.

Use algoritmo determinístico e testável.

Uma política inicial aceitável:

```text
acerto primeira tentativa:
+0.18

acerto após pista contextual:
+0.10

acerto após representação visual:
+0.06

acerto após soma repetida:
+0.03

solução precisou ser mostrada:
+0

erro:
pequena redução interna
```

Nunca mostrar essas pontuações.

Clamp:

```text
0.0 .. 1.0
```

Os números podem ser refinados, mas devem ficar centralizados em configuração.

---

# 38. ESTADOS DE DOMÍNIO

Sugestão:

```text
NEW
nenhuma exposição significativa

LEARNING
mastery < 0.45

CONSOLIDATING
0.45 ≤ mastery < 0.75

MASTERED
mastery ≥ 0.75
```

Para `MASTERED`, exigir também:

* pelo menos 3 acertos independentes;
* distribuídos em pelo menos 2 dias.

Não dominar um fato apenas porque foi acertado uma vez.

---

# 39. TRANSFERÊNCIA COMUTATIVA

Quando houver progresso positivo em:

`7 × 8`

transferir pequena parcela de confiança para:

`8 × 7`.

Sugestão:

**20% do ganho.**

Limites:

* nunca auto-dominar o par;
* confiança transferida não deve ultrapassar aproximadamente 0.65;
* ainda exigir exposição direta.

---

# 40. SCHEDULER ADAPTATIVO

Criar um componente de domínio independente, por exemplo:

`AdaptiveFactScheduler`.

Priorizar fatos considerando:

* conteúdo já introduzido;
* domínio baixo;
* necessidade de revisão;
* tempo desde última exposição;
* variedade;
* fatos relacionados;
* progressão do capítulo.

Não usar tempo de resposta.

---

# 41. REPETIÇÃO ESPAÇADA

Evitar:

```text
7 × 8
7 × 8
7 × 8
7 × 8
```

Regras desejadas:

* não repetir imediatamente o mesmo fato;
* deixar pelo menos algumas atividades entre repetições;
* limitar exposição excessiva por dia;
* trabalhar o par comutativo posteriormente;
* fatos difíceis reaparecem em dias futuros;
* fatos dominados ainda recebem revisão ocasional.

---

# 42. CALIBRAÇÃO INICIAL

Os primeiros 2–3 atendimentos servem como calibração invisível.

Exemplo:

```text
2 × 3
5 × 4
3 × 6
```

Objetivo:

estimar quantidade inicial de suporte.

Não mostrar:

> Teste de nivelamento.

---

# 43. TUTORIAL E CALIBRAÇÃO

Há uma diferença importante:

O primeiro atendimento faz parte do tutorial.

Os dados do tutorial **não devem alterar fortemente o domínio permanente**.

Podem alimentar:

```text
initialSupportEstimate
```

mas não devem rotular a criança.

Após o tutorial, o modelo passa a construir domínio gradualmente.

---

# 44. TUTORIAL CONTEXTUAL

Não criar uma tela longa explicando tudo.

O primeiro cliente ensina o jogo enquanto a criança joga.

Exemplo:

```text
Cliente:
“Quero 3 livros.”

↓

Destacar produto.

“Selecione 3 livros.”

↓

Mostrar R$ 4 cada.

↓

Mostrar:
4 + 4 + 4

↓

Mostrar:
3 × 4

↓

Perguntar total.
```

Não repetir instruções já aprendidas desnecessariamente.

Adicionar botão:

> Ajuda

para rever instruções.

---

# 45. CAPÍTULOS

Implementar cinco capítulos.

## Capítulo 1

**Primeiros Clientes**

* loja pequena;
* mais suporte visual;
* tutorial;
* calibração.

Mínimo aproximado:

**3 dias.**

---

## Capítulo 2

**Loja Conhecida**

* loja cresce;
* produtos adicionais ficam disponíveis para aquisição;
* mais combinações matemáticas.

Mínimo aproximado:

**4 dias.**

---

## Capítulo 3

**Loja Popular**

* nova expansão visual;
* maior variedade;
* mais autonomia.

Mínimo aproximado:

**5 dias.**

---

## Capítulo 4

**Loja de Sucesso**

* loja maior;
* conteúdos mais complexos dentro de `1–10`;
* menos pistas para fatos dominados.

Mínimo aproximado:

**5 dias.**

---

## Capítulo 5

**Loja Incrível**

* versão visual mais completa;
* consolidação;
* revisão adaptativa;
* progressão sem pressão para “terminar”.

---

# 46. AVANÇO DE CAPÍTULO

Modelo híbrido.

Exigir:

1. número mínimo de dias;
2. prontidão matemática suficiente.

Não exigir perfeição.

Nenhum único fato pode bloquear sozinho a progressão.

Pode-se utilizar:

* média ponderada dos fatos-alvo;
* cobertura mínima;
* quantidade de fatos consolidados.

Centralize a política em configuração.

A criança NÃO vê o cálculo.

Mensagem:

> Sua loja está crescendo!

---

# 47. EXPANSÃO FÍSICA

Ao mudar de capítulo:

a loja cresce automaticamente.

Não cobrar por essa expansão principal.

Exemplos:

```text
Capítulo 1
balcão + uma área

Capítulo 2
nova ala

Capítulo 3
área temática

Capítulo 4
fachada maior

Capítulo 5
loja completa
```

Mudanças visuais não podem mover os controles principais de forma imprevisível.

---

# 48. ECONOMIA

Usar somente:

**R$**

Não criar moeda premium.

O dinheiro possui função real na loja.

---

# 49. FATURAMENTO

Cada venda acrescenta ao faturamento:

```text
quantidade × preço unitário
```

Exemplo:

```text
6 × R$ 7 = R$ 42
```

Erro matemático nunca reduz faturamento.

A venda é concluída depois que a criança chega à resposta com ou sem ajuda.

---

# 50. FECHAMENTO AUTOMÁTICO

Ao final do dia:

```text
FECHAMENTO DO DIA

Vendas
R$ 186

Reposição
-R$ 46

Despesas da loja
-R$ 20

Saldo do dia
R$ 120

Caixa acumulado
R$ 390
```

A criança NÃO resolve essas contas no MVP.

O sistema calcula automaticamente.

---

# 51. DESPESAS

Manter modelo previsível.

Não criar perdas aleatórias.

Sugestão:

```text
reposição:
aproximadamente 25% do faturamento,
arredondada para inteiro

despesas operacionais:
valor fixo pequeno por capítulo
```

Todos os valores permanecem inteiros.

Centralizar parâmetros.

Nunca gerar saldo negativo por surpresa aleatória.

---

# 52. CAIXA

```text
novoCaixa =
caixaAnterior + saldoDoDia - comprasDeMelhorias
```

Caixa inicial pode ficar em torno de:

**R$ 50**

A economia deve permitir uma pequena melhoria nas primeiras sessões.

Não criar grind excessivo.

---

# 53. MELHORIAS

Dois grupos:

## funcionais

* novo produto;
* expositor;
* nova seção visual;
* prateleira;
* balcão visualmente melhor.

## cosméticas

* parede;
* piso;
* luminária;
* planta;
* tapete;
* placa;
* fachada;
* balcão;
* objetos decorativos.

---

# 54. PERSONALIZAÇÃO

A criança escolhe primeiro um estilo-base gratuito.

Sugestões:

* Pixel Natural
* Tech Block
* Colorido Criativo
* Urbano Moderno
* Clássico

Depois pode misturar itens individuais.

Nenhuma escolha é permanente.

---

# 55. ACESSIBILIDADE DAS PERSONALIZAÇÕES

Nunca permitir que uma decoração:

* deixe texto ilegível;
* reduza contraste da interface;
* esconda controles;
* altere a cor semântica de foco;
* transforme fundo e texto em combinação inadequada.

Interface funcional e decoração devem usar camadas visuais independentes.

---

# 56. OBJETIVO OPCIONAL DO DIA

Cada dia pode possuir um objetivo pequeno e opcional.

Exemplos:

* vender 3 tipos de produto;
* atender todos os clientes;
* realizar uma venda com produto recém-adquirido;
* atender determinados personagens;
* vender determinada quantidade total de itens.

Não usar:

* “acerte tudo”;
* “não erre”;
* “responda rápido”;
* “faça 10 acertos seguidos”.

Falhar no objetivo não traz penalidade.

---

# 57. RECOMPENSA DE OBJETIVOS

Preferencialmente:

* item cosmético;
* nova placa;
* moldura;
* decoração.

Evitar grandes recompensas econômicas.

---

# 58. CONQUISTAS

Implementar poucas.

Sugestões:

### Primeiro Dia

Concluir o primeiro dia.

### Minha Primeira Melhoria

Comprar uma melhoria.

### Loja em Expansão

Avançar de capítulo.

### Catálogo Crescendo

Comprar um novo produto.

### Cliente Conhecido

Encontrar todos os clientes recorrentes.

### Loja com Estilo

Personalizar vários elementos.

### Catálogo Completo

Possuir os seis produtos.

### Loja Incrível

Chegar ao capítulo final.

---

# 59. CONQUISTAS PROIBIDAS

Não criar:

* 10 acertos seguidos;
* 100% de acerto;
* responda em menos de X segundos;
* nunca use pista;
* termine sem errar.

Não transformar aprendizagem em pressão.

---

# 60. ESTOQUE

Estoque é infinito.

Produtos nunca ficam indisponíveis porque acabaram.

Visualmente existem nas prateleiras.

Não criar sistema de compra de estoque.

A linha “reposição” no fechamento é somente um custo operacional automático.

---

# 61. PEDIDOS

No MVP:

**um tipo de produto por pedido.**

Exemplo:

```text
6 livros × R$ 7
```

Não implementar:

```text
3 livros + 2 cadernos
```

A arquitetura pode permitir futura extensão para múltiplas linhas.

---

# 62. NARRAÇÃO

Narração é opcional.

Todo conteúdo narrado também precisa estar disponível em texto.

Criar controle:

> Ouvir novamente

Use `SpeechSynthesis` do navegador quando disponível.

Configurar:

```text
lang = pt-BR
```

A experiência não pode depender do TTS.

Caso nenhuma voz adequada esteja disponível:

* jogo continua funcionando;
* texto permanece;
* controle pode indicar indisponibilidade de maneira discreta.

Não afirmar que TTS offline funciona em todos os navegadores.

---

# 63. ÁUDIO

Separar:

* narração;
* efeitos;
* música.

Cada um possui:

* ligado/desligado;
* volume próprio.

Persistir configurações no perfil.

Nenhuma informação essencial deve depender exclusivamente de som.

Não tocar áudio inesperado na tela inicial.

---

# 64. ACESSIBILIDADE — META

Projetar para:

# WCAG 2.2 nível AA

Além disso, adotar algumas boas práticas além do mínimo quando úteis para crianças.

Não declare formalmente “100% WCAG compliant” apenas porque testes automatizados passaram.

Documente:

* critérios tratados;
* testes automatizados;
* verificações manuais ainda necessárias.

---

# 65. HTML SEMÂNTICO

Preferir elementos nativos:

```html
button
input
fieldset
legend
dialog
nav
main
header
section
```

Evitar:

```html
<div onclick="...">
```

Não recriar botões manualmente quando `<button>` resolve.

---

# 66. TECLADO

Todo o jogo funcional deve ser utilizável por teclado.

Garantir:

* Tab;
* Shift+Tab;
* Enter;
* Space;
* Escape quando apropriado;
* setas somente quando padrão do componente justificar.

Nenhuma armadilha de teclado.

---

# 67. FOCO

Criar foco altamente visível.

Produto alvo:

* aproximadamente 3 px ou mais;
* contraste forte;
* offset suficiente;
* não depender somente de mudança sutil de cor.

Nunca esconder `outline` sem substituto adequado.

O foco não pode ficar coberto por:

* HUD;
* modal;
* rodapé;
* tooltip;
* animação.

---

# 68. ALVOS DE INTERAÇÃO

Embora o WCAG permita situações menores, o produto deve adotar como regra:

**48 × 48 CSS px como alvo preferencial mínimo.**

Especialmente para:

* respostas;
* produtos;
* botões;
* navegação;
* volume;
* configurações.

Manter espaço suficiente entre controles.

---

# 69. CONTRASTE

Texto normal:

mínimo **4.5:1**.

Texto grande:

mínimo **3:1**.

Componentes e indicadores importantes também devem ter contraste suficiente.

Não usar cor como única indicação.

---

# 70. NÃO DEPENDER DE COR

Para correto:

```text
✓ Correto
```

Não apenas verde.

Para erro:

```text
! Vamos tentar de outro jeito
```

Não apenas vermelho.

Para seleção:

* borda;
* ícone;
* texto;
* estado programático.

---

# 71. ZOOM E TEXTO GRANDE

Permitir:

**200% de zoom/text size sem perda de funcionalidade.**

Configuração interna:

```text
Texto
Padrão
Grande
```

Evitar alturas rígidas que cortem texto.

---

# 72. RESPONSIVIDADE

Prioridades:

1. desktop;
2. tablet;
3. fallback funcional mobile.

Não exigir orientação específica.

A área de atendimento precisa reorganizar-se adequadamente.

Em telas estreitas:

alternativas podem virar coluna vertical.

Nunca gerar rolagem horizontal para controles essenciais.

---

# 73. REDUÇÃO DE MOVIMENTO

Respeitar:

```css
@media (prefers-reduced-motion: reduce)
```

Também oferecer preferência no perfil:

> Movimento reduzido

Quando ativado:

* remover movimentos de câmera;
* reduzir transições;
* substituir deslocamentos por fade simples ou mudança instantânea;
* desativar partículas;
* simplificar avatar.

Nenhuma funcionalidade pode depender da animação.

---

# 74. ARRASTAR

Não exigir drag.

Se drag-and-drop for implementado visualmente:

a mesma ação deve funcionar via:

* toque simples;
* clique;
* teclado;
* controles adicionar/remover.

---

# 75. LEITOR DE TELA

Cena voxel decorativa:

`aria-hidden="true"` quando apropriado.

Não fazer leitor de tela anunciar centenas de blocos visuais.

A camada semântica deve anunciar:

* cliente;
* pedido;
* quantidade;
* preço;
* pergunta;
* alternativas;
* seleção;
* pista;
* resultado;
* saldo;
* mudanças relevantes.

---

# 76. ARIA

Use ARIA somente quando necessário.

Preferir semântica nativa.

Componentes customizados devem possuir corretamente:

* name;
* role;
* state;
* value.

---

# 77. STATUS MESSAGES

Utilizar região `aria-live="polite"` cuidadosamente para:

* resultado;
* pista;
* produto adicionado;
* desbloqueio;
* alteração importante.

Não anunciar animações decorativas.

Não criar spam no leitor de tela.

---

# 78. CONTROLES CONSISTENTES

Configurações e Ajuda devem permanecer em localização previsível.

Ícones devem possuir rótulos acessíveis.

Exemplo:

não usar somente:

`⚙`

Use nome acessível:

> Configurações

---

# 79. TEXTO

Linguagem:

* clara;
* curta;
* apropriada para 9–10 anos;
* respeitosa;
* sem infantilização excessiva.

Evitar frases longas.

---

# 80. CONTEÚDO ADEQUADO

Não incluir como produtos ou recompensas:

* doces;
* álcool;
* cigarros;
* drogas;
* armas;
* apostas;
* loot boxes;
* produtos adultos;
* itens inadequados.

---

# 81. PRIVACIDADE INFANTIL

Não realizar chamadas externas de telemetria.

Não coletar identificadores pessoais.

Não enviar apelido para servidor.

Tudo local.

Nenhum perfil sai do dispositivo.

---

# 82. PERSISTÊNCIA

Use IndexedDB.

Criar uma camada de repositório independente da UI.

Estrutura aproximada:

```ts
type PlayerProfile = {
  id: string;
  schemaVersion: number;

  nickname: string;
  avatar: AvatarConfig;

  store: StoreState;
  chapter: number;
  day: number;

  cash: number;

  mathProgress: MathProgress;
  achievements: AchievementState[];
  objectives: ObjectiveHistory;

  accessibility: AccessibilitySettings;
  audio: AudioSettings;

  createdAt: string;
  updatedAt: string;
};
```

---

# 83. VERSIONAMENTO DE SAVE

Persistência deve conter:

```text
schemaVersion
```

Criar infraestrutura para migrações.

Não assumir que saves futuros sempre terão a mesma estrutura.

---

# 84. AUTOSAVE

Salvar após eventos significativos:

* finalizar atendimento;
* finalizar dia;
* comprar produto;
* comprar cosmético;
* trocar configuração;
* mudar capítulo;
* editar avatar.

Não depender de salvar apenas ao fechar navegador.

---

# 85. FALHA DE STORAGE

Lidar graciosamente com:

* IndexedDB indisponível;
* quota;
* dado inválido;
* migration failure.

Nunca apagar silenciosamente o perfil.

Se for impossível recuperar, explicar claramente antes de qualquer reset.

---

# 86. OFFLINE

Depois do primeiro carregamento completo:

o jogo deve continuar funcional sem internet.

Cachear:

* HTML;
* JS;
* CSS;
* SVG;
* fontes locais se existirem;
* assets necessários;
* conteúdo.

Nenhuma chamada de API é necessária durante gameplay.

Pode utilizar Workbox ou integração equivalente com Vite.

Não precisa implementar prompt de instalação PWA.

---

# 87. UPDATE DO SERVICE WORKER

Uma atualização do aplicativo nunca pode apagar IndexedDB.

Evitar refresh inesperado durante uma atividade.

Se nova versão estiver disponível, pode mostrar aviso discreto:

> Nova versão disponível.

Aplicar preferencialmente em momento seguro.

---

# 88. TELAS PRINCIPAIS

Implementar no mínimo:

1. Loading/bootstrap
2. Seleção de perfil
3. Criar perfil
4. Avatar
5. Escolher loja
6. Escolher estilo
7. Acessibilidade inicial
8. Visão da loja
9. Atendimento
10. Feedback/pistas
11. Fechamento do dia
12. Melhorias
13. Produtos disponíveis
14. Cosméticos
15. Capítulo concluído
16. Conquistas
17. Configurações
18. Ajuda

---

# 89. VISÃO PRINCIPAL DA LOJA

HUD simples.

Exemplo conceitual:

```text
┌──────────────────────────────────────────────┐
│ Avatar       Lojinha Maluca          R$ 390 │
├──────────────────────────────────────────────┤
│                                              │
│          DIORAMA VOXEL ISOMÉTRICO            │
│                                              │
│     cliente → balcão ← avatar                │
│                                              │
│     prateleiras / produtos / decoração       │
│                                              │
├──────────────────────────────────────────────┤
│ Objetivo opcional             Dia 4          │
└──────────────────────────────────────────────┘
```

Não copiar exatamente.

Criar design final coerente.

---

# 90. TELA DE ATENDIMENTO

Priorizar clareza.

Exemplo:

```text
Lia

“Quero 6 livros.”

[representação dos seis livros]

R$ 7 cada

Quanto devo cobrar?

[ R$ 36 ]
[ R$ 42 ]
[ R$ 49 ]

[ Ouvir novamente ]
[ Preciso de ajuda ]
```

Em desktop, respostas podem ficar horizontais.

Em telas menores, verticalmente.

---

# 91. ESTADO DE INTERAÇÃO

Considere uma máquina de estados explícita ou reducer.

Estados possíveis:

```text
PROFILE_SELECT
PROFILE_CREATE
STORE_SELECT
STORE_OVERVIEW
DAY_START
CUSTOMER_ENTER
PRODUCT_SELECT
QUESTION
HINT
ANSWER_FEEDBACK
CUSTOMER_EXIT
DAY_SUMMARY
UPGRADES
CHAPTER_TRANSITION
SETTINGS
```

Evitar boolean soup como:

```ts
isQuestion
isHint
isCustomer
isSummary
isTransition
```

se isso produzir combinações inválidas.

---

# 92. DETERMINISMO

Randomizações devem ser controláveis por seed nos testes.

Isso vale para:

* clientes;
* pergunta;
* posição da alternativa correta;
* objetivo diário;
* pequenos detalhes de cenário.

O gameplay não precisa mostrar a seed.

---

# 93. PERFORMANCE

Meta:

* carregamento rápido;
* bundle razoável;
* interação fluida;
* nenhuma engine 3D pesada;
* animações via transform/opacity quando possível;
* evitar renderizações React desnecessárias;
* lazy loading somente onde realmente útil.

---

# 94. ASSETS

Crie assets simples internamente usando:

* SVG;
* CSS;
* formas geométricas;
* ícones próprios.

Não buscar assets protegidos da internet.

Não usar emojis como arte final principal.

Emoji pode ser usado em mensagens provisórias durante desenvolvimento, mas substitua por elementos visuais consistentes antes de concluir.

---

# 95. TIPOGRAFIA

Preferir fonte de sistema ou fonte local segura.

Não depender de Google Fonts para funcionamento.

Texto deve permanecer legível offline.

---

# 96. TESTES UNITÁRIOS OBRIGATÓRIOS

Cobrir especialmente:

## Matemática

* resposta correta;
* geração de fatos;
* limites 1–10;
* comutatividade;
* score;
* estados;
* mastery clamp;
* spacing;
* scheduler.

## Distratores

* exatamente 3 alternativas;
* única resposta correta;
* sem duplicação;
* distratores válidos.

## Pistas

* sequência correta;
* solução final;
* reset ao próximo atendimento.

## Economia

* faturamento;
* despesas;
* saldo;
* caixa;
* compra;
* impossibilidade de comprar sem saldo.

## Progressão

* mínimo de dias;
* domínio;
* mudança de capítulo;
* nenhum fato individual bloqueia sozinho.

## Persistência

* create;
* update;
* load;
* migration.

---

# 97. TESTES DE COMPONENTE

Cobrir:

* alternativas;
* escolha de produto;
* modal de compra;
* configurações;
* perfil;
* tutorial;
* feedback;
* pistas.

Testar teclado.

---

# 98. TESTES E2E

Criar pelo menos os fluxos:

## Fluxo 1

```text
abrir jogo
→ criar perfil
→ escolher avatar
→ escolher loja
→ configurar acessibilidade
→ iniciar primeiro dia
```

## Fluxo 2

```text
responder corretamente
→ venda registrada
```

## Fluxo 3

```text
errar
→ receber pista
→ errar novamente
→ receber representação
→ concluir
```

## Fluxo 4

```text
terminar 5 clientes
→ fechamento
→ saldo
```

## Fluxo 5

```text
comprar melhoria
→ loja muda visualmente
```

## Fluxo 6

```text
recarregar página
→ perfil permanece
```

## Fluxo 7

```text
offline
→ jogo continua após cache inicial
```

---

# 99. TESTES DE ACESSIBILIDADE

Integrar axe nas principais telas.

Testar manualmente também:

* teclado;
* foco;
* leitor de tela estrutural;
* zoom 200%;
* texto grande;
* movimento reduzido;
* contraste;
* layout em tablet;
* alternativas por toque.

Nenhum teste automatizado substitui avaliação manual.

---

# 100. COMANDOS

Idealmente disponibilizar:

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run verify
```

`verify` deve executar as principais verificações possíveis.

---

# 101. DOCUMENTAÇÃO

Criar ou atualizar `README.md`.

Incluir:

* objetivo;
* stack;
* como instalar;
* como rodar;
* como testar;
* como buildar;
* como funciona persistência;
* como funciona offline;
* arquitetura resumida;
* acessibilidade;
* limitações conhecidas.

Criar também, se fizer sentido:

```text
docs/
├── PRODUCT.md
├── ARCHITECTURE.md
├── ACCESSIBILITY.md
└── ADAPTIVE-MATH.md
```

Não duplicar documentação inutilmente.

---

# 102. ACESSIBILIDADE DOCUMENTADA

`ACCESSIBILITY.md` deve descrever no mínimo:

* WCAG 2.2 AA como alvo;
* teclado;
* foco;
* contraste;
* target sizes;
* movimento reduzido;
* zoom;
* screen readers;
* audio alternatives;
* drag alternative;
* aria-live;
* testes realizados;
* limitações.

---

# 103. ARQUITETURA DO MOTOR MATEMÁTICO

`ADAPTIVE-MATH.md` deve explicar:

```text
Fact
↓
Scheduler
↓
Question
↓
Distractors
↓
Attempt
↓
Hint
↓
Outcome
↓
Mastery Update
↓
Spacing
```

Documentar valores de configuração.

---

# 104. CRITÉRIOS DE ACEITE DO MVP

O projeto só está pronto quando:

* abre no navegador;
* não exige backend;
* permite criar múltiplos perfis;
* salva IndexedDB;
* permite escolher qualquer uma das 4 lojas;
* avatar pode ser personalizado;
* loja possui estética voxel original;
* primeiro dia pode ser jogado do começo ao fim;
* existem 5–6 clientes;
* pedidos contextualizam multiplicação;
* há seleção de produtos;
* há cálculo direto;
* existem 3 alternativas;
* distratores são pedagógicos;
* há pistas progressivas;
* erros não retiram dinheiro;
* faturamento é calculado;
* fechamento é automático;
* saldo entra no caixa;
* melhorias podem ser compradas;
* alteração aparece visualmente;
* capítulos existem;
* progressão híbrida existe;
* produtos são desbloqueáveis;
* cosméticos existem;
* conquistas existem;
* objetivo opcional existe;
* matemática adaptativa funciona;
* propriedade comutativa é relacionada;
* repetição não é agressiva;
* suporte diminui conforme domínio;
* narração opcional existe;
* áudio é configurável;
* teclado funciona;
* foco é visível;
* movimento reduzido funciona;
* texto grande funciona;
* layout desktop funciona;
* layout tablet funciona;
* jogo funciona offline depois do cache;
* refresh não perde progresso;
* build passa;
* testes passam;
* lint passa;
* typecheck passa.

---

# 105. PROIBIÇÕES DE UX

Não usar:

* dark patterns;
* countdown;
* energia limitada;
* “volte amanhã”;
* streak diário;
* FOMO;
* recompensa aleatória monetizada;
* perdas arbitrárias;
* ranking;
* comparações entre crianças;
* “você é melhor que…”;
* pontuação de inteligência;
* mensagens de fracasso;
* punição por pista.

---

# 106. PRINCÍPIO PEDAGÓGICO FINAL

O jogo deve fazer a criança pensar:

> “Preciso descobrir quanto custa essa compra.”

e não:

> “Preciso fazer outra questão da tabuada.”

Essa diferença deve orientar todas as decisões.

---

# 107. PRINCÍPIO DE ACESSIBILIDADE FINAL

Sempre que houver conflito entre uma interação divertida e acessibilidade:

**preserve a fantasia, mas ofereça uma forma equivalente e acessível de realizar a mesma ação.**

Exemplo:

```text
arrastar livro
```

pode existir.

Mas também deve existir:

```text
selecionar livro
→ Adicionar
```

e funcionamento por teclado.

---

# 108. PRINCÍPIO DE ESCOPO FINAL

Não tente antecipar todas as futuras versões.

O MVP precisa validar principalmente este loop:

```text
ATENDER
   ↓
MULTIPLICAR
   ↓
RECEBER FEEDBACK
   ↓
FATURAR
   ↓
FECHAR O DIA
   ↓
MELHORAR A LOJA
   ↓
VER A LOJA CRESCER
   ↓
JOGAR NOVAMENTE
```

Faça esse ciclo excelente antes de adicionar qualquer coisa fora do escopo.

---

# 109. ORDEM RECOMENDADA DE IMPLEMENTAÇÃO

Implemente verticalmente.

## Milestone 1 — Fundação

* Vite/React/TypeScript;
* design tokens;
* shell;
* persistência;
* domínio base;
* testes.

## Milestone 2 — Perfil

* seleção;
* criação;
* avatar;
* loja;
* acessibilidade.

## Milestone 3 — Primeiro atendimento completo

* cliente;
* pedido;
* produto;
* pergunta;
* alternativas;
* resposta;
* feedback.

Esse milestone já deve ser jogável.

## Milestone 4 — Sistema pedagógico

* distratores;
* pistas;
* domínio;
* scheduler;
* comutatividade;
* revisão espaçada.

## Milestone 5 — Dia completo

* 5–6 clientes;
* faturamento;
* fechamento;
* caixa.

## Milestone 6 — Progressão

* capítulos;
* produtos;
* upgrades;
* expansão visual.

## Milestone 7 — Personalização

* estilos;
* cosméticos;
* avatar melhorado.

## Milestone 8 — Metagame

* objetivos;
* conquistas.

## Milestone 9 — Acessibilidade completa

* keyboard pass;
* focus pass;
* axe;
* zoom;
* screen reader semantics;
* reduced motion;
* narration.

A acessibilidade deve ser considerada desde o início; este milestone é uma revisão, não o momento de começar a implementá-la.

## Milestone 10 — Offline e hardening

* service worker;
* offline tests;
* storage migration;
* error handling;
* performance.

---

# 110. NÃO PARE EM UM PROTÓTIPO

Ao terminar, deve ser possível:

1. executar o projeto;
2. criar uma criança fictícia;
3. personalizar avatar;
4. escolher uma loja;
5. jogar um dia inteiro;
6. errar uma conta e receber ajuda;
7. acertar;
8. terminar o dia;
9. receber saldo;
10. comprar alguma melhoria;
11. ver a melhoria na loja;
12. fechar o navegador;
13. abrir novamente;
14. continuar do mesmo ponto;
15. desligar a rede;
16. continuar jogando após o cache inicial.

---

# 111. VERIFICAÇÃO FINAL

Antes da resposta final, execute de verdade, quando disponíveis:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Não diga que algo passou sem executar.

Se algo não puder ser executado no ambiente, informe exatamente:

* o que;
* por quê;
* como verificar localmente.

---

# 112. RESPOSTA FINAL DO CODEX

Ao terminar, responda com:

## Implementado

Resumo do que foi construído.

## Arquitetura

Principais decisões.

## Como executar

Comandos exatos.

## Testes

Comandos executados e resultados.

## Acessibilidade

O que foi verificado.

## Offline

Como testar.

## Persistência

Onde e como os dados são armazenados.

## Limitações conhecidas

Somente limitações reais.

## Próximos passos

No máximo 3–5 evoluções relevantes.

---

# 113. DEFINIÇÃO FINAL DE SUCESSO

O resultado deve parecer um **pequeno jogo de verdade**, e não um formulário de matemática.

A criança precisa perceber:

* personagens;
* loja;
* produtos;
* dinheiro;
* escolhas;
* crescimento;
* personalização;
* contexto.

O adulto precisa perceber:

* objetivo pedagógico;
* progressão;
* adaptação;
* ausência de punição;
* acessibilidade;
* privacidade;
* qualidade técnica.

E o código precisa demonstrar:

* separação de responsabilidades;
* domínio testável;
* estado previsível;
* persistência robusta;
* acessibilidade desde a arquitetura;
* baixo acoplamento;
* ausência de complexidade acidental.

**Construa agora o MVP completo da Lojinha Maluca conforme esta especificação.**
