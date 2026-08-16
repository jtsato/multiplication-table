# Estado atual — Lojinha Maluca

**Data da verificação:** 16/08/2026  
**Escopo da verificação:** diretório `st`  
**Fonte funcional:** `specification.md`

## Resumo

O trabalho ainda está na fase de especificação. O diretório `st` contém apenas o arquivo `specification.md`; não existe implementação executável do jogo nesse diretório. Portanto, nenhum milestone do roadmap foi iniciado e nenhum critério de aceite do MVP pode ser considerado atendido.

## Evidências encontradas

| Área | Estado | Evidência em `st` |
| --- | --- | --- |
| Especificação | Presente | `specification.md` contém visão do produto, requisitos, milestones e critérios de aceite. |
| Aplicação web | Ausente | Não há `src/`, `index.html` ou entrypoint. |
| Package manager | Ausente | Não há `package.json` nem lockfile. |
| Configuração | Ausente | Não há configuração local de Vite, TypeScript, ESLint, Vitest ou Playwright. |
| Interface | Ausente | Não há componentes, telas, estilos ou assets próprios. |
| Domínio matemático | Ausente | Não há fatos, distratores, pistas, domínio, scheduler ou RNG implementados. |
| Estado do jogo | Ausente | Não há reducer, máquina de estados ou sessão de atendimento. |
| Perfis | Ausente | Não há criação, seleção ou persistência de jogadores. |
| Economia e progressão | Ausente | Não há clientes, produtos, caixa, capítulos, melhorias, cosméticos ou conquistas. |
| Persistência | Ausente | Não há camada IndexedDB, `schemaVersion`, migrações ou autosave. |
| Offline | Ausente | Não há service worker nem estratégia de cache. |
| Testes | Ausente | Não há testes unitários, de componente, E2E ou de acessibilidade. |
| Documentação de execução | Ausente em `st` | Não há README local com instalação, comandos ou limitações. |

## O que já está definido

`specification.md` já estabelece:

- o objetivo pedagógico de ensinar multiplicação dentro da fantasia de uma loja;
- o loop principal de atendimento, cálculo, feedback, faturamento e crescimento;
- quatro lojas temáticas e seus catálogos iniciais e desbloqueáveis;
- sessões de 5–6 clientes, sem cronômetro no modo normal;
- alternativas múltiplas com três respostas e distratores pedagógicos;
- ajuda progressiva e ausência de punição por erro;
- perfis locais múltiplos, IndexedDB, versionamento de save e autosave;
- acessibilidade WCAG 2.2 AA como baseline, com teclado, foco, zoom, leitor de tela, áudio alternativo e movimento reduzido;
- funcionamento offline após o primeiro carregamento completo;
- a ordem de implementação em dez milestones;
- os comandos e a verificação final esperados quando a aplicação existir.

## O que ainda precisa ser construído

Para sair do estado atual e alcançar o MVP, é necessário implementar, em ordem vertical:

1. a fundação React/TypeScript/Vite e a infraestrutura de testes;
2. o modelo de estado, conteúdo e persistência IndexedDB;
3. o fluxo de perfil, avatar, loja e acessibilidade inicial;
4. um atendimento completo jogável;
5. o motor adaptativo de matemática, distratores e pistas;
6. o dia completo com fechamento e caixa;
7. capítulos, produtos, melhorias e expansão visual;
8. personalização, objetivos e conquistas;
9. a revisão completa de acessibilidade;
10. service worker, offline, migrações, tratamento de falhas e hardening.

## Estado de execução e verificação

Não é possível executar `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` ou `npm run test:e2e` a partir de `st`, porque ainda não existe `package.json` nem aplicação configurada. Esses comandos devem ser adicionados e executados a partir do Milestone 1.

Também não há evidência local para afirmar que o jogo abre no navegador, salva progresso, funciona offline, atende clientes, calcula vendas ou passa por testes de acessibilidade.

## Contexto do Git

O diretório de trabalho Git é o diretório-pai `C:\Dev\00-work\multiplication-table`, e não `st` isoladamente. A inspeção encontrou outros diretórios irmãos e alterações fora do escopo atual. Eles não foram tratados como implementação da Lojinha Maluca e não foram modificados.

No estado verificado, `specification.md` e os documentos deste diretório pertencem ao trabalho em andamento de `st`; alterações existentes em outros diretórios devem ser preservadas e avaliadas separadamente.

## Riscos e decisões pendentes

- **Base técnica ainda não criada:** a primeira decisão operacional é inicializar a aplicação dentro de `st`, para que o roadmap e a implementação tenham a mesma raiz.
- **Ausência de convenções locais:** como não há package manager ou configuração em `st`, as escolhas de React, TypeScript, Vite, testes e lint devem ser registradas no Milestone 1.
- **Escopo amplo:** a especificação cobre dez milestones; o primeiro objetivo executável deve ser a fatia vertical de um atendimento, sem tentar construir todo o metagame antes de validar o loop principal.
- **Estado Git compartilhado:** qualquer implementação deve continuar limitada a `st` e evitar arquivos dos diretórios irmãos.
- **Assets:** a identidade visual precisa ser criada internamente com CSS/SVG/formas geométricas, respeitando a proibição de assets protegidos.

## Próximo passo recomendado

Iniciar o **Milestone 1 — Fundação**, criando o projeto executável mínimo, o contrato de estado e o repositório IndexedDB com teste de criação, atualização, carregamento e migração. Depois disso, avançar para o fluxo de perfil e só então para o primeiro atendimento jogável.

## Definição de estado atualizado

Este arquivo deve ser revisado a cada milestone. Uma funcionalidade só deve mudar de “ausente” para “implementada” quando houver código no diretório `st`, teste ou verificação correspondente e evidência registrada aqui.
