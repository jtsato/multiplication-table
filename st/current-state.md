# Estado atual — Lojinha Maluca

**Data da verificação:** 16/08/2026  
**Escopo da verificação:** diretório `st`  
**Fonte funcional:** `specification.md`

## Resumo

O MVP já saiu da fase de especificação e possui uma aplicação React/TypeScript/Vite executável. O loop vertical está implementado até o fechamento do dia: criar perfil → escolher loja/avatar → atender clientes → calcular multiplicação → receber pistas → faturar → atualizar caixa.

Os primeiros oito milestones têm uma implementação funcional ou uma baseline testada. O loop adaptativo, áudio/narração, animações acessíveis, conquistas visuais e o caminho offline principal estão implementados; revisão manual de acessibilidade e hardening final ainda são parciais.

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
| Economia e progressão | Implementado como baseline | Faturamento, caixa, compras, capítulos, objetivos, conquistas, catálogo visual, estilos, decorações e blocos de expansão têm apresentação persistida. |
| Persistência | Implementada | IndexedDB com `schemaVersion`, migração, listagem, atualização, autosave e `close()`. |
| Offline | Implementada no fluxo principal | `public/sw.js`, registro em produção, aviso de atualização e teste E2E offline após refresh cobrem o caminho principal. |
| Testes | Implementados | 18 arquivos Vitest/37 testes, 7 testes E2E Chromium e scan axe na seleção de perfil. |
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
- seleção diária contextualizada pelo histórico adaptativo do perfil;
- sons de feedback e narração opcional configuráveis na tela de ajustes;
- animação de repouso e comemoração do avatar, desativadas com movimento reduzido;
- tela dedicada de conquistas com marcos opcionais e sem nota de desempenho;
- saldo visível no catálogo antes e depois das compras;
- refresh preservando o perfil via IndexedDB;
- primeira camada de texto grande, contraste reforçado, redução de movimento, foco visível e feedback semântico.

## Estado de execução e verificação

Executado em 16/08/2026:

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS — 18 arquivos, 37 testes
npm run build      PASS — Vite produziu dist/
npm run test:e2e   PASS — 7 testes Chromium, incluindo axe, pistas, compra, conquistas, refresh e offline
```

O navegador integrado da sessão não estava disponível; a validação E2E foi feita pelo Chromium do Playwright contra o build de produção servido pelo preview.

## Contexto do Git

O checkout Git fica no diretório-pai `C:\Dev\00-work\multiplication-table`, e `st` não é um worktree isolado. A implementação foi limitada a `st`; diretórios irmãos e alterações preexistentes fora desse escopo não foram modificados.

Os arquivos de `st` continuam como alterações não commitadas do trabalho em andamento. Nenhum reset, checkout destrutivo ou alteração em arquivos irmãos foi realizado.

## Lacunas conhecidas

- o aviso de atualização do service worker existe, mas a avaliação manual da troca segura e cenários extremos de storage ainda falta;
- o scan axe automatizado cobre a seleção de perfil; as demais telas precisam entrar na matriz E2E;
- falta revisão manual com leitor de tela, zoom de 200% e diferentes larguras/tablets;
- falta uma revisão final de performance, quota excedida e dados persistidos inválidos.

## Próximo passo recomendado

Continuar pelo **Milestone 9/10**, ampliando axe para as telas principais e revisando performance/storage no hardening final.

## Definição de estado atualizado

Uma funcionalidade só deve mudar para “implementada” quando houver código em `st`, teste ou verificação correspondente e evidência registrada aqui. Este arquivo deve ser revisado a cada milestone concluído.
