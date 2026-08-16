# Ilhas da Tabuada

Um jogo educacional infantil 2D em que cada multiplicação coloca um bloco em um arquipélago colorido. O MVP funciona inteiramente no navegador, sem login ou backend, e inclui personagem customizável, nove ilhas (tabuadas de 2 a 10), missões, progressão, conquistas, revisão adaptativa, PT-BR e inglês.

## Stack

- React + TypeScript strict + Vite
- SVG e CSS para cenário, personagem e animações originais
- Vitest + Testing Library para testes
- ESLint + Prettier para qualidade
- Web Audio API para efeitos simples opcionais
- `localStorage` por meio do repositório `ProgressRepository`

Phaser não foi usado porque o gameplay do MVP é baseado em escolha de respostas e transformações leves do cenário. SVG/CSS reduz o bundle, simplifica responsividade, tradução e acessibilidade por teclado, sem limitar as animações necessárias.

## Executar

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

### Comandos

```bash
npm run dev        # servidor local
npm run build      # TypeScript + build de produção
npm run test:run   # todos os testes uma vez
npm test           # testes em watch mode
npm run lint       # análise estática
npm run format     # aplica Prettier
```

## Arquitetura

```text
src/
├── components/  # peças visuais reutilizáveis, avatar e cena
├── content/     # catálogo orientado a dados das nove ilhas
├── domain/      # regras puras de questões, domínio, progressão e conquistas
├── i18n/        # resolução e hook de traduções
├── locales/     # catálogos pt-BR e en-US
├── screens/     # onboarding, início, mapa, fase, resultado e auxiliares
├── services/    # adaptador de persistência e áudio
├── state/       # coordenação do GameState e comandos da aplicação
├── styles/      # sistema visual responsivo
└── test/        # configuração dos testes
```

A UI só conversa com `GameProvider`. Regras pedagógicas permanecem funções TypeScript puras. O provider aplica as transições e salva o agregado completo pelo repositório. Essa separação mantém componentes pequenos e permite testar geração, adaptação e progressão sem montar a interface.

## Persistência

Todo o progresso fica na chave `blocky-tables:progress` do `localStorage`. Chamadas de storage existem somente em `LocalStorageProgressRepository`. O save usa o schema:

```ts
interface GameState {
  schemaVersion: 1;
  player: PlayerProfile | null;
  settings: GameSettings;
  progress: GameProgress;
  statistics: PlayerStatistics;
  achievements: AchievementState[];
}
```

Primeiro acesso cria defaults; JSON corrompido é descartado com segurança; schema `0` é migrado; reset remove a chave somente após confirmação na UI.

Uma missão em andamento salva também a pergunta completa, passo da construção, acertos, tentativas e feedback. Assim, reabrir o app restaura inclusive o estado entre uma resposta e o botão “próximo”. Se o navegador recusar uma gravação por quota ou política, a sessão em memória continua jogável.

Para trocar por uma API, implemente a mesma interface e injete o adaptador em `GameProvider`:

```ts
interface ProgressRepository {
  load(): Promise<GameState>;
  save(state: GameState): Promise<void>;
  reset(): Promise<void>;
}
```

Nenhuma regra de jogo precisa mudar.

## Aprendizado adaptativo

O desempenho é salvo por combinação (`7x3`, por exemplo), com tentativas, acertos, erros, último contato e score de domínio. Fatos novos têm peso normal; domínio baixo e erros recentes aumentam o peso; domínio alto reduz o peso. O fato imediatamente anterior é retirado da seleção quando há alternativas, evitando repetição mecânica. A cada terceira pergunta pode entrar um fato fraco de uma ilha já concluída, sem alterar o tema da missão atual.

Cada missão tem seis questões. Um erro oferece uma matriz visual de blocos e uma nova tentativa, sem remover construção ou impedir progresso. Completar a missão libera a próxima ilha; a precisão define de uma a três estrelas e fatos difíceis continuam disponíveis em novas sessões.

## Idiomas

Catálogos completos ficam em `src/locales/pt-BR.ts` e `src/locales/en-US.ts`. O tipo do catálogo inglês deriva das chaves do português, então o TypeScript acusa chaves ausentes.

Para adicionar idioma:

1. Inclua o código no tipo `Locale`.
2. Crie um catálogo com todas as chaves de `ptBR`.
3. Registre-o em `src/i18n/index.ts`.
4. Adicione a opção no onboarding e nas configurações.

Trocar o idioma altera somente `settings.locale`; personagem e progresso são preservados.

## Adicionar conteúdo

### Nova tabuada ou ilha

1. Adicione o número em `TABLES`, em `src/domain/types.ts`.
2. Inclua uma definição em `src/content/islands.ts` com bioma, construção e paleta.
3. Acrescente nome/descrição da missão, bioma e construção aos dois catálogos.
4. Se necessário, acrescente uma composição CSS para o novo tipo de construção.

### Nova missão

O motor `GameScreen` controla questões, feedback, salvamento e conclusão. Uma missão comum exige apenas nova entrada de conteúdo. Um comportamento realmente diferente deve virar um componente de cena focado e continuar recebendo `built` e `total`, sem duplicar lógica pedagógica.

## Acessibilidade e responsividade

- botões grandes e foco visível;
- navegação por teclado em controles nativos;
- status escrito e acompanhado de símbolo, não apenas cor;
- áudio totalmente opcional;
- suporte a `prefers-reduced-motion`;
- menus em portrait e gameplay otimizado para landscape;
- layouts para desktop, tablet e celular.

## Decisões do MVP

- A missão termina após seis respostas corretas; tentativas extras entram na precisão.
- A criança nunca fica bloqueada por nota: terminar a construção libera a próxima ilha.
- Os presets “Explorador” e “Construtor” são cosméticos; todas as cores, cabelos e acessórios servem para ambos.
- Não há assets remotos, bibliotecas ou material de Minecraft.
- Música ambiente discreta e efeitos curtos são gerados legalmente pela Web Audio API e só começam depois de interação do usuário.

## Testes

A suíte cobre geração e alternativas plausíveis, posição da resposta, pesos e não repetição, domínio, estatísticas, desbloqueio linear, conquistas, defaults, round-trip, corrupção e migração de storage, paridade dos idiomas, coordenação do estado e o fluxo do primeiro acesso até o mapa.
