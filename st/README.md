# Lojinha Maluca

MVP web da Lojinha Maluca: um jogo educativo em português do Brasil no qual a criança atende clientes, calcula compras e faz a loja crescer praticando multiplicação.

## Rodar localmente

```bash
npm install
npm run dev
```

Comandos de verificação:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run verify
```

O Playwright precisa de um Chromium instalado. Em um ambiente novo, execute `npx playwright install chromium` antes de `npm run test:e2e`.

## O que está implementado

- seleção e criação de múltiplos perfis locais;
- apelido, avatar em blocos, escolha entre quatro lojas e ajustes iniciais;
- dia com 5–6 clientes, cálculo direto e separação visual de produtos;
- três alternativas com distratores pedagógicos e posição variável;
- feedback respeitoso e pistas progressivas após erros;
- domínio de fatos, comutatividade, bandas internas e scheduler determinístico conectado ao histórico do perfil;
- fechamento de dia, faturamento, saldo, capítulos, objetivos e conquistas;
- catálogo com produtos desbloqueáveis, saldo visível e mudanças persistidas;
- sons de feedback, narração opcional e animações acessíveis do avatar;
- IndexedDB com `schemaVersion`, migração, autosave e tratamento básico de falha;
- service worker com cache versionado, aviso de atualização e suporte offline após o primeiro carregamento completo;
- teclado, foco visível, zoom, texto grande, contraste reforçado e movimento reduzido.

## Arquitetura

Veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). O motor matemático está descrito em [docs/ADAPTIVE-MATH.md](docs/ADAPTIVE-MATH.md) e a cobertura de acessibilidade em [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Persistência e offline

Perfis ficam somente no IndexedDB local `lojinha-maluca`. Nenhum login, servidor, analytics ou dado pessoal é necessário. O service worker cacheia o app shell e recursos GET; a sessão continua disponível sem rede depois do primeiro carregamento.

## Limitações conhecidas

- o scan axe automatizado ainda precisa cobrir catálogo, atendimento, configurações, conquistas e fechamento do dia;
- avaliação manual com leitor de tela, zoom de 200%, tablets e cenários extremos de quota/storage continua pendente.
