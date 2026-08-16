# Tabuada em Blocos — MVP SPA

Jogo educacional infantil 2D para praticar tabuadas de **2 a 10** construindo um arquipélago colorido de blocos. O MVP roda inteiramente no navegador, sem backend, sem login e sem dependências externas.

## O que está implementado

- SPA 2D responsiva, com visual original em blocos.
- Primeiro acesso com seleção de `pt-BR` ou `en-US`.
- Escolha de personagem menino/menina e quatro cores cosméticas.
- Mapa linear com ilhas das tabuadas 2 → 10.
- Uma missão curta de 5 desafios por ilha.
- Respostas corretas constroem visualmente a missão; erros mostram uma dica por agrupamento.
- Seleção adaptativa de questões baseada em domínio e erros anteriores.
- Revisões ocasionais de fatos fracos de tabuadas anteriores.
- Persistência versionada em `localStorage`.
- Conquistas, streak, estatísticas, efeitos sonoros simples e reset de progresso.
- Layout para desktop/tablet e suporte a celular, com aviso para landscape durante gameplay.

## Arquitetura

O MVP foi implementado como **SPA browser-native com ES Modules**, CSS e SVG/DOM, sem bibliotecas externas. Isso mantém o protótipo executável mesmo sem acesso ao registry do npm.

A lógica está separada em módulos independentes:

```text
src/
  app.js                         # estado de UI, navegação e loop da missão
  styles.css                     # direção visual em blocos e responsividade
  data/islands.js                # metadados dos biomas/ilhas
  domain/defaultState.js         # schema inicial versionado
  domain/questions.js            # escolhas e seleção adaptativa
  domain/progress.js             # domínio, streaks, conquistas e desbloqueio
  i18n/pt-BR.js                  # textos em português
  i18n/en-US.js                  # textos em inglês
  i18n/index.js                  # tradutor/interpolação
  persistence/repository.js      # contrato do repositório
  persistence/localStorageRepository.js
```

A interface de persistência é assíncrona para permitir substituir o `LocalStorageProgressRepository` por um futuro `ApiProgressRepository` sem alterar a lógica pedagógica.

## Rodando

Requer apenas Node.js 20+.

```bash
npm run dev
```

Abra:

```text
http://localhost:4173
```

Nenhum `npm install` é necessário para este MVP.

## Testes

```bash
npm test
```

Os testes cobrem:

- estado inicial e desbloqueio;
- geração de alternativas;
- seleção adaptativa;
- domínio por multiplicação;
- streaks e conquistas;
- persistência, reset e payload corrompido;
- internacionalização e interpolação.

## Verificação de sintaxe

```bash
npm run check
```

## Build

```bash
npm run build
```

O build copia o SPA autocontido para `dist/`.

## Persistência

Chave atual:

```text
tabuada-em-blocos:v1
```

Estrutura principal:

```js
{
  schemaVersion: 1,
  player: {},
  settings: {},
  progress: { islands: {} },
  statistics: { facts: {} },
  achievements: []
}
```

Cada fato matemático, por exemplo `7x3`, guarda tentativas, acertos, erros, `masteryScore` e `lastSeenAt`.

## Adicionando um idioma

1. Crie um novo dicionário em `src/i18n/` com as mesmas chaves dos atuais.
2. Registre-o em `src/i18n/index.js`.
3. Adicione a opção de seleção na UI.

## Adicionando uma tabuada/ilha

As ilhas 2–10 ficam em `src/data/islands.js`. Cada item define o número da tabuada, tema, ícone e chaves traduzíveis para bioma/construção.

## Adicionando uma missão

O loop genérico fica em `src/app.js`. A renderização do mundo usa o metadado da ilha, e a construção evolui em cinco estágios. Para criar missões diferentes por ilha, extraia `constructionMarkup()` para renderizadores por `constructionKey`, mantendo o motor de perguntas intacto.

## Evolução futura

Fora do escopo do MVP, mas previstos arquiteturalmente:

- backend e sincronização de progresso;
- contas familiares/escolares;
- ranking privado/seguro;
- multiplayer assíncrono;
- mais missões por tabuada;
- assets e animações finais;
- música original;
- painel para responsáveis/professores.
