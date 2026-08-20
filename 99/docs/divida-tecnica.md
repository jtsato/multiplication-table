# Dívida técnica

Registro das dívidas conhecidas do Numi 99: o que ficou para trás, por quê, e o
que conta como pago.

## DIV-001 — Decorações compradas não aparecem na casa

- **Data:** 2026-08-19
- **Origem:** auditoria da spec `docs/superpowers/specs/2026-08-18-ilha-cozy-design.md`
  contra o código. A spec promete "a casa evolui com moedas… vagas de decoração";
  o plano da Fase 4 (Task 5) entregou as decorações como ralo das colheitas
  regionais.
- **Problema:** a loja vende seis decorações — tapete, aquário, vaso, lustre,
  prateleira e escultura — e a compra persiste em `owned`, mas **nenhuma delas é
  renderizada na cena 3D da casa**. O jogador paga moedas e recursos e não vê
  nada mudar.
- **Evidência:**
  - Catálogo com as peças: `src/slices/economy/economy.logic.ts`
    (`SHOP_ITEMS`, categoria `casa`).
  - Casa com apenas espelho, mural e cama: `src/slices/home/HomeView.tsx`
    (`Furniture`).
  - Nenhum uso de `owned` em componente de cena (varredura em
    `src/slices/home`, `src/slices/world`, `src/slices/resources`,
    `src/app` não encontra nenhum).
- **Impacto:** o ralo econômico funciona (todo recurso é consumido), mas o
  prêmio "poder mostrar" da categoria `casa` não é entregue. Para uma criança,
  comprar uma decoração é gastar sem ver resultado — exatamente o oposto do que
  a categoria promete.
- **Critério de aceite para fechar:**
  - Comprar uma decoração adiciona um objeto visível dentro da casa.
  - A decoração comprada continua lá depois de recarregar a página.
  - Não dá para comprar duas vezes (já coberto pela economia; falta o visual).
  - A cena cobre o caso com teste (`@react-three/test-renderer`) e o e2e grava
    uma captura dentro da casa com decoração.
- **Onde atacar:** dentro da slice `home/` — ex.: componente
  `HomeDecorations` que lê `owned` e desenha cada peça, sem que `home/` importe
  a slice de economia (o store compõe; a view recebe o estado).
- **Status:** fechada em 2026-08-19.

### Resolução

- **`src/slices/home/HomeDecorations.tsx`** lê `owned` do store composto e
  desenha as seis peças com primitivas low poly: tapete, aquário, vaso, lustre,
  prateleira e escultura.
- **`HOME_DECORATION_KINDS` / `HOME_DECORATION_OFFSETS`** moram em
  `home.logic.ts`. A casa sabe o que ela exibe; a loja sabe o que ela vende.
  Um teste cruza as duas listas: todo item de categoria `casa` da loja tem
  visual na casa, e só ele.
- **Testes:** `HomeDecorations.test.tsx` (4 testes de cena) + `home.test.ts`
  (paridade, posições dentro das paredes e distância dos móveis) +
  `HomeView.test.tsx` (integração: a casa desenha a peça comprada).
- **E2E:** `desktop.spec.ts` compra a Escultura de gelo, entra na casa, grava
  `e2e/telas/27-casa-decorada.png`, recarrega a página e grava
  `e2e/telas/28-casa-decorada-recarregada.png` com a peça ainda presente.
- **Portões:** lint limpo, typecheck limpo, 560 testes Vitest verdes, build ok,
  E2E verdes.

---

## DIV-002 — A baleia do Porto ainda não é um acontecimento

- **Data:** 2026-08-19
- **Origem:** escolha de escopo no núcleo da Fase 5 da spec
  `docs/superpowers/specs/2026-08-18-ilha-cozy-design.md`. O núcleo entregue tem
  animais de ambiente, alimentar → amigo, caderneta, pet e raros; a baleia ficou
  para trás de propósito, para a fatia não virar uma entrega gigante.
- **Problema:** a spec descreve a baleia como **acontecimento** — sobe no mar
  aberto do Porto, solta o esguicho e mergulha, sem dar moeda nem recurso. Hoje
  o Porto tem cardumes (peixes de ambiente), mas nenhum evento visual no mar.
- **Critério de aceite para fechar:**
  - A baleia aparece em intervalos no mar aberto do Porto.
  - O ciclo sobe → esguicha → mergulha é visível em captura E2E.
  - Não interage com a criança nem entrega recompensa.
- **Onde atacar:** dentro da slice `wildlife/` — ex.: um `WhaleView` ou uma
  função pura de agendamento (`whaleSchedule(clock, rng)`) testada em Vitest, com
  o ciclo animado no `useFrame`.
- **Status:** fechada em 2026-08-19.

### Resolução

- **`src/slices/wildlife/whale.logic.ts`** define a janela pura do
  acontecimento: `whaleState(clock)`, `whaleHeight(state)` (sobe e mergulha) e
  `whaleIsSpouting(state)`.
- **`WhaleView.tsx`** anima o corpo no mar aberto do Porto dentro do `useFrame`,
  sem nenhuma escrita no store — é só para olhar, como a spec manda.
- **Testes:** `whale.test.ts` (4 testes de Vitest) cobre a janela, o progresso e
  o esguicho; `desktop.spec.ts` grava `e2e/telas/31-baleia.png` com o relógio no
  meio da janela e confirma que o acontecimento não mexe em moedas nem desafios.

---

## Melhorias futuras (opcionais)

Itens que **não são dívida**: o jogo atual funciona sem eles, mas ficam como
backlog para quando o escopo crescer.

| Melhoria | Por que ficou de fora |
| --- | --- |
| Sombras individuais de vagalumes | São centenas de pontos pequenos; sombra por ponto custaria caro. A lanterna já projeta sombra local com mapa 256. |
| Texto 3D nas placas de região | Exigiria fonte/asset externo; a cor + minimapa com nome cobre a navegação. |
| Auditoria automatizada de acessibilidade (axe-core) | Pode entrar no E2E quando houver CI dedicado; hoje o suporte é via CSS `prefers-contrast`/`prefers-reduced-motion` e ARIA nos controles principais. |
| Lazy-load ainda mais fino do Rapier | O WASM já está em chunk separado; dá para adiar até a primeira física se o bundle inicial virar problema no mobile. |
| PWA/offline | Exigiria service worker e manifesto; o deploy atual é estático simples. |

