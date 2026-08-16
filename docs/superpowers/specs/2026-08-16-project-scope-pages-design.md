# Projeto ativo e publicação no GitHub Pages

## Objetivo

Manter somente as experiências `cc`, `99` e `st` no repositório e na publicação do GitHub Pages. Remover os projetos `co`, `cw` e `gt` sem alterar as mudanças de trabalho já existentes em `99` e `st`.

## Design

- Excluir integralmente os diretórios de projeto `co`, `cw` e `gt`.
- Ajustar `.github/workflows/pages.yml` para instalar dependências, testar e gerar build apenas de `cc`, `99` e `st`.
- Montar o artefato do Pages nos caminhos `site/cc`, `site/99` e `site/st`.
- Atualizar `pages/index.html` para oferecer somente links para `cc`, `99` e `st`.
- Configurar `st/vite.config.ts` com `base: './'`, pois o app será servido no subcaminho `/st/`.

## Verificação

- Confirmar que os diretórios `co`, `cw` e `gt` não existem e que `cc`, `99` e `st` continuam presentes.
- Verificar que não restam referências a `co`, `cw` ou `gt` no workflow e no índice de publicação.
- Executar os testes e builds dos três projetos conforme os scripts existentes.
- Validar a sintaxe e as diferenças finais do workflow sem tocar nas alterações preexistentes fora do escopo.

## Fora do escopo

Não haverá refatoração dos aplicativos mantidos, alteração de dependências ou remoção das mudanças não relacionadas já presentes no checkout.
