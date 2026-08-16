# Estado atual — Lojinha Maluca

**Data da verificação:** 16/08/2026  
**Escopo da verificação:** diretório `st`  
**Fonte funcional:** `specification.md`

## Resumo

O MVP já saiu da fase de especificação e possui uma aplicação React/TypeScript/Vite executável. O loop vertical está implementado até o fechamento do dia: criar perfil → escolher loja/avatar → atender clientes → calcular multiplicação → receber pistas → faturar → atualizar caixa.

Os primeiros cinco milestones têm uma implementação funcional ou uma baseline testada. Progressão, personalização avançada, áudio/narração, cobertura completa de acessibilidade e hardening ainda são parciais.

## Evidências encontradas

| Área | Estado | Evidência em `st` |
| --- | --- | --- |
| Especificação | Presente | `specification.md` contém visão, requisitos, milestones e aceite. |
| Aplicação web | Implementada | `src/main.tsx`, `src/app/App.tsx`, `index.html`. |
| Package manager | Implementado | `package.json` e `package-lock.json` com scripts de dev, build e verificação. |
| Interface | Implementada | Telas de perfil, criação, loja, atendimento, produtos e configurações; visual de blocos em CSS. |
| Domínio matemático | Implementado | Fatos, RNG seedado, distratores, pistas, domínio, comutatividade e scheduler em `src/domain/math`. |
| Estado do jogo | Implementado | `DaySession` explícita em `src/domain/game/session.ts`. |
| Perfis | Implementado | Criação e seleção de múltiplos perfis locais, avatar, loja e preferências. |
| Economia e progressão | Parcialmente implementado | Faturamento, caixa, compras, capítulos, objetivos, conquistas, estilos, decorações e blocos de expansão têm baseline; a apresentação avançada ainda falta. |
| Persistência | Implementada | IndexedDB com `schemaVersion`, migração, listagem, atualização, autosave e `close()`. |
| Offline | Baseline implementada | `public/sw.js` e registro em produção cacheiam o app shell e recursos GET. |
| Testes | Implementados | 15 arquivos Vitest/29 testes, smoke E2E e scan axe na seleção de perfil. |
| Documentação | Implementada | `README.md`, `docs/ARCHITECTURE.md`, `docs/ACCESSIBILITY.md` e `docs/ADAPTIVE-MATH.md`. |

## Funcionalidades jogáveis atuais

- criação de perfil sem dados pessoais;
- apelido, sugestões, avatar em blocos e escolha entre Livraria, Loja de Arte, Loja de Esportes e Tecnologia & Robótica;
- 5–6 clientes determinísticos por dia;
- cálculo direto e separação de produtos por clique/toque/teclado;
- três alternativas, distratores pedagógicos e posição variável;
- mensagem de erro respeitosa, representação concreta, soma repetida e solução final;
- registro da venda, fechamento do dia e entrada do faturamento no caixa;
- compra de produtos desbloqueáveis;
- capítulos por dias, objetivo opcional e conquistas por marcos da loja;
- refresh preservando o perfil via IndexedDB;
- primeira camada de texto grande, contraste reforçado, redução de movimento, foco visível e feedback semântico.

## Estado de execução e verificação

Executado em 16/08/2026:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS — 15 arquivos, 28 testes
npm run build      PASS — Vite produziu dist/
npm run test:e2e   PASS — 2 testes Chromium, incluindo axe
```

O Playwright precisou de execução fora do sandbox porque o ambiente bloqueou o Chromium com `spawn EPERM`; depois da autorização, os dois testes passaram. O navegador integrado da sessão não estava disponível, então a inspeção visual foi feita pelo Chromium do Playwright.

## Contexto do Git

O checkout Git fica no diretório-pai `C:\Dev\00-work\multiplication-table`, e `st` não é um worktree isolado. A implementação foi limitada a `st`; diretórios irmãos e alterações preexistentes fora desse escopo não foram modificados.

Os arquivos de `st` continuam como alterações não commitadas do trabalho em andamento. Nenhum reset, checkout destrutivo ou alteração em arquivos irmãos foi realizado.

## Lacunas conhecidas

- narração e efeitos de áudio ainda não estão conectados aos eventos, embora o perfil já tenha preferências de áudio;
- estilos selecionáveis, três decorações compráveis e expansão visual básica já existem; animações automáticas do avatar ainda faltam;
- não há uma tela dedicada de conquistas nem um aviso de nova versão do service worker;
- o scan axe automatizado cobre a seleção de perfil; as demais telas precisam entrar na matriz E2E;
- a cobertura E2E ainda não percorre um dia inteiro, erro com quatro níveis de pista, compra, refresh e offline real;
- o scheduler e o domínio de mastery estão testados, mas a seleção diária ainda usa a seed da sessão diretamente em vez de consultar todo o histórico de fatos.

## Próximo passo recomendado

Continuar pelo **Milestone 6**, conectando cada compra a uma mudança visual específica no diorama e consolidando a progressão. Em seguida, fechar cosméticos/áudio, ampliar os testes E2E de acessibilidade e validar o comportamento offline após refresh.

## Definição de estado atualizado

Uma funcionalidade só deve mudar para “implementada” quando houver código em `st`, teste ou verificação correspondente e evidência registrada aqui. Este arquivo deve ser revisado a cada milestone concluído.
