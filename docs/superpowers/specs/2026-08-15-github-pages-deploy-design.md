# GitHub Pages Unificado — Design

## Objetivo

Publicar os quatro projetos web existentes (`cc`, `co`, `cw` e `gt`) em um único repositório raiz e em um único site do GitHub Pages.

## Arquitetura

O workflow do GitHub Actions fará checkout do repositório, instalará as dependências dos três projetos Node/Vite, executará os testes disponíveis e produzirá os quatro builds. Cada build será copiado para um subdiretório do artefato final:

- `/cc/`
- `/co/`
- `/cw/`
- `/gt/`

O artefato também terá uma página inicial versionada em `pages/index.html`, copiada para a raiz do artefato com links para cada projeto. O deploy será feito pelas actions oficiais de Pages (`configure-pages`, `upload-pages-artifact` e `deploy-pages`).

## Alterações de configuração

- Criar um `.gitignore` na raiz para dependências, builds, caches, cobertura, arquivos locais, IDE e sistema operacional.
- Criar `pages/index.html` como página inicial versionada do site.
- Criar `.github/workflows/pages.yml` com permissões mínimas para Pages, concorrência de deploy, execução em `push` na branch `main` e manualmente, e actions fixadas em SHAs completos.
- Ajustar `co/vite.config.ts` para `base: './'`, mantendo os assets relativos quando o app for servido em `/co/`.
- Manter `cc`, `cw` e `gt` com seus caminhos relativos já existentes.
- O workflow deve copiar `pages/index.html` para `site/index.html`, sem gerar HTML em tempo de execução.

## Verificação

O workflow executará:

- `npm run test` e `npm run build` em `cc`;
- `npm run test:run` e `npm run build` em `co`;
- `npm run test` e `npm run build` em `cw`;
- `npm test`, `npm run check` e `npm run build` em `gt`.

Localmente, a validação repetirá os scripts disponíveis e inspecionará o artefato gerado para confirmar que cada subdiretório contém seu `index.html`.

## Fora de escopo

- Alterar a lógica ou o visual dos quatro aplicativos.
- Criar quatro repositórios ou quatro sites Pages independentes.
- Adicionar um servidor ou backend.
