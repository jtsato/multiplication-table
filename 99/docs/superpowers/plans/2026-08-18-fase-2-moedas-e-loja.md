# Fase 2 — Moedas e loja Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o loop econômico. O acerto passa a pagar moeda, a loja vende três
itens que mudam o jogo, e o amanhecer traz o resumo do dia. Ao fim desta fase a
criança tem um motivo para voltar amanhã que não é sobreviver: é comprar a próxima
coisa.

**Design:** `docs/superpowers/specs/2026-08-18-ilha-cozy-design.md`

**Architecture:** Nasce a slice `economy/`, dona das moedas, da sequência de acertos,
dos fatos já dominados e do catálogo da loja. `math.store` continua sendo quem decide
*quanto* uma resposta vale e chama a slice de destino — o mesmo padrão já usado para
recurso e lanterna.

## Global Constraints

- **Moeda só sai do acerto.** Não existe vender recurso por moeda: isso faria o erro
  virar moeda por caminho indireto e destruiria o sentido da moeda como recompensa do
  domínio.
- **Recurso é gasto, não vendido.** Todo item da loja custa moedas **e** recursos, e os
  três tipos existentes são consumidos por pelo menos um item. É o que paga a dívida da
  fruta, que hoje não tem destino nenhum.
- O erro continua rendendo recurso (25%, mínimo 1). Nada nesta fase pune errar.
- A loja é um **painel**, não um NPC. A comerciante da Fase 6 vai apenas virar mais uma
  forma de abrir o mesmo painel — construir infraestrutura de NPC agora seria adiantar
  trabalho de duas fases à frente.
- Nenhuma dependência nova.
- Os fatos dominados são estado próprio desde já: eles são a base do mural da tabuada
  (Fase 3) e do portão das regiões (Fase 4).

## Números escolhidos

| Recompensa | Valor | Por quê |
| --- | --- | --- |
| Acerto | `perGroup` moedas | É o número da tabuada. Hoje paga 2 sempre; na Fase 4, a tabuada do 9 passa a pagar 9. A moeda cresce com a dificuldade sem nenhuma regra nova. |
| 3 acertos seguidos | +5 | Faz querer mais uma conta. |
| Fato novo (7×8 pela primeira vez) | +10, uma vez só | Incentiva variar em vez de moer o mesmo nó. |

| Item | Custo | Efeito |
| --- | --- | --- |
| Lanterna maior | 30 moedas + 8 madeira | Raio 9 → 13, carga 60 s → 90 s |
| Botas | 25 moedas + 6 pedra | Velocidade 7 → 8.75 (+25%) |
| Dica | 10 moedas + 4 frutas | Consumível: apaga uma alternativa errada do desafio aberto |

A Dica é o item que fecha o argumento da fase: **comprar ajuda com moeda ganha em conta
certa é uma troca honesta**, e é o que tira o medo de errar sem tornar o erro gratuito.

---

### Task 1: Slice da economia — moedas, sequência e fatos

**Files:**
- Create: `src/slices/economy/economy.logic.ts`, `economy.test.ts`, `economy.store.ts`,
  `index.ts`
- Modify: `src/app/store.ts`

**Interfaces:**
- Produces `factKey(perGroup, groups)`, `coinsFor({ perGroup, streak, factIsNew })`.
- Produces `EconomySlice = { coins, streak, knownFacts, correctToday, coinsToday,
  rewardCorrect(perGroup, fact), breakStreak(), resetDaily(), resetEconomy() }`.

- [x] **Step 1: Escrever os testes da lógica pura**

```ts
describe('factKey', () => {
  it('identifica o fato pela dupla de fatores', () => {
    expect(factKey(2, 4)).toBe('2x4');
  });

  it('trata 2x4 e 4x2 como o mesmo fato', () => {
    expect(factKey(4, 2)).toBe(factKey(2, 4));
  });
});

describe('coinsFor', () => {
  it('o acerto paga o numero da tabuada', () => {
    expect(coinsFor({ perGroup: 2, streak: 1, factIsNew: false })).toBe(2);
    expect(coinsFor({ perGroup: 9, streak: 1, factIsNew: false })).toBe(9);
  });

  it('a cada tres seguidos vem o bonus', () => {
    expect(coinsFor({ perGroup: 2, streak: 3, factIsNew: false })).toBe(2 + ECONOMY.streakBonus);
    expect(coinsFor({ perGroup: 2, streak: 6, factIsNew: false })).toBe(2 + ECONOMY.streakBonus);
    expect(coinsFor({ perGroup: 2, streak: 4, factIsNew: false })).toBe(2);
  });

  it('fato novo paga o bonus grande', () => {
    expect(coinsFor({ perGroup: 2, streak: 1, factIsNew: true })).toBe(2 + ECONOMY.newFactBonus);
  });
});
```

`factKey` normaliza a ordem dos fatores porque 2×4 e 4×2 são o mesmo fato para quem
está aprendendo — contar duas vezes o mesmo bônus de "primeira vez" seria pagar duas
vezes pela mesma descoberta.

- [x] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- --run src/slices/economy`

Expected: FAIL — o módulo não existe.

- [x] **Step 3: Implementar lógica e store**

`ECONOMY = { streakBonus: 5, newFactBonus: 10, streakEvery: 3 }`.

O store guarda `knownFacts` como `string[]` (e não `Set`), porque ele vai ser
serializado no save da Fase 3 e um `Set` não sobrevive a `JSON.stringify`.

`rewardCorrect(perGroup, groups)` incrementa a sequência, calcula as moedas, marca o
fato como conhecido e soma nos contadores do dia. `breakStreak()` zera a sequência no
erro. `resetDaily()` zera só `correctToday` e `coinsToday` — é o que o resumo do dia
consome; `knownFacts` e `coins` atravessam os dias.

- [x] **Step 4: Rodar os testes**

Run: `npm test -- --run src/slices/economy`

Expected: PASS.

- [x] **Step 5: Commitar**

```powershell
git add src/slices/economy src/app/store.ts
git commit -m "feat: add coins, streak and known facts"
```

---

### Task 2: A resposta paga moeda

**Files:**
- Modify: `src/slices/math/math.store.ts`
- Modify: `src/slices/math/math.store.test.ts`

**Interfaces:**
- `answerChallenge` chama `rewardCorrect` no acerto e `breakStreak` no erro, para os
  dois propósitos (`colher` e `abastecer`).

- [x] **Step 1: Escrever os testes**

```ts
it('o acerto paga moedas e o erro nao paga', () => { ... });
it('o erro continua rendendo recurso', () => { ... });
it('o erro quebra a sequencia', () => { ... });
it('o mesmo fato so paga bonus de novidade uma vez', () => { ... });
it('a conta da fogueira tambem paga moeda', () => { ... });
```

- [x] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- --run src/slices/math/math.store.test.ts`

- [x] **Step 3: Ligar a recompensa**

Em `answerChallenge`, depois de resolver o resultado e antes de publicar o feedback:

```ts
if (outcome.correct) {
  get().rewardCorrect(challenge.perGroup, challenge.groups);
} else {
  get().breakStreak();
}
```

O `ChallengeFeedback` ganha `coins: number`, para o painel poder mostrar o ganho.

- [x] **Step 4 e 5: Rodar e commitar**

Run: `npm test -- --run src/slices/math src/slices/economy`

```powershell
git commit -m "feat: pay coins for correct answers"
```

---

### Task 3: Moedas no HUD e no feedback

**Files:**
- Modify: `src/app/Hud.tsx`, `src/app/hud.css`, `src/app/Hud.test.tsx`
- Modify: `src/slices/math/ChallengePanel.tsx`, `challenge.css`

- [x] **Step 1: Escrever as asserções**

```ts
it('mostra o total de moedas', () => { ... });
it('mostra as moedas em pilhas de dez', () => { ... });
```

- [x] **Step 2: Rodar e confirmar a falha**

- [x] **Step 3: Implementar**

O contador mostra o total **e** a decomposição em dezenas: `37` aparece como
`37` com `3 pilhas + 7`. Esse é o reforço passivo da tabuada do 10 descrito na spec — a
criança conta dezenas o dia inteiro sem nenhuma pergunta ser feita. Em tela estreita,
só o número.

No painel de feedback, o acerto passa a mostrar `+8 · +2 moedas`, e a sequência
aparece quando o bônus cai.

- [x] **Step 4 e 5: Rodar e commitar**

---

### Task 4: Catálogo e compra

**Files:**
- Modify: `src/slices/economy/economy.logic.ts`, `economy.test.ts`, `economy.store.ts`

**Interfaces:**
- Produces `SHOP_ITEMS: Record<ShopItemKind, ShopItem>` com `{ label, coins, recipe,
  kind, repeatable }`.
- Produces `canBuy(item, coins, inventory)` e a ação `buy(kind)`.

- [x] **Step 1: Escrever os testes**

```ts
it('recusa sem moeda suficiente', () => { ... });
it('recusa sem recurso suficiente, mesmo com moeda de sobra', () => { ... });
it('debita moedas e recursos na compra', () => { ... });
it('nao compra duas vezes um item permanente', () => { ... });
it('a dica e comprada mais de uma vez e acumula', () => { ... });

// Este é o teste que a spec pede por nome:
it('todo tipo de recurso do jogo e consumido por algum item', () => {
  for (const kind of RESOURCE_KINDS) {
    expect(Object.values(SHOP_ITEMS).some((item) => (item.recipe[kind] ?? 0) > 0)).toBe(true);
  }
});
```

A última asserção é a rede contra o defeito da fruta: acrescentar um recurso sem
destino passa a quebrar a suíte.

- [x] **Step 2 a 5: falha, implementação, verificação, commit**

`payCost` de `building.logic.ts` já faz o débito de recursos e recusa pagamento parcial
— **reusar**, não reescrever. A slice de economia importa a função pura, não a de
construção inteira.

---

### Task 5: O painel da loja

**Files:**
- Create: `src/slices/economy/ShopPanel.tsx`, `shop.css`, `ShopPanel.test.tsx`
- Modify: `src/shared/input.ts`, `src/app/App.tsx`, `src/app/TouchControls.tsx`

**Interfaces:**
- Nova `GameAction: 'loja'`, ligada a `KeyL` e a um botão de toque.

- [x] **Step 1: Escrever as asserções**

```ts
it('abre e fecha pela acao do jogo', () => { ... });
it('desabilita o que nao da para pagar, mostrando o custo', () => { ... });
it('comprar debita e fecha o item', () => { ... });
it('nao abre com um desafio na tela', () => { ... });
```

A última importa: dois painéis modais ao mesmo tempo confundiriam a criança, e o
desafio tem prioridade.

- [x] **Step 2 a 5: falha, implementação, verificação, commit**

O painel segue a camada centralizada do `ChallengePanel` (`position: fixed`,
`pointer-events: none` na camada, `auto` no cartão). Cada item mostra rótulo, custo em
moedas, custo em recursos e o que faz — **em uma frase curta**, pela regra de não exigir
leitura fluente.

---

### Task 6: Os itens fazem efeito

**Files:**
- Modify: `src/slices/lantern/lantern.logic.ts`, `LanternView.tsx`
- Modify: `src/slices/player/player.logic.ts`
- Modify: `src/slices/math/ChallengePanel.tsx`
- Testes correspondentes

- [x] **Step 1: Escrever os testes**

```ts
it('a lanterna maior ilumina mais longe e dura mais', () => { ... });
it('as botas aumentam a velocidade desejada', () => { ... });
it('a dica apaga uma alternativa errada e some do estoque', () => { ... });
it('a dica nunca apaga a resposta certa', () => { ... });
```

- [x] **Step 2 a 5: falha, implementação, verificação, commit**

`LANTERN.radius` e `chargeSeconds` passam a ser lidos por funções que recebem os
upgrades comprados, em vez de constantes usadas direto. A velocidade do jogador segue o
mesmo caminho.

---

### Task 7: O resumo do dia

**Files:**
- Create: `src/app/DaySummary.tsx`, `summary.css`, `DaySummary.test.tsx`
- Modify: `src/app/App.tsx`, `src/slices/daynight/DayNightView.tsx`

- [x] **Step 1: Escrever as asserções**

```ts
it('aparece na virada para o amanhecer', () => { ... });
it('mostra contas certas, moedas do dia e fatos novos', () => { ... });
it('nao aparece duas vezes no mesmo amanhecer', () => { ... });
it('fechar zera os contadores do dia, mas nao as moedas', () => { ... });
```

- [x] **Step 2 a 5: falha, implementação, verificação, commit**

O texto é elogio concreto, não pontuação: **"Dia 3 — 14 contas certas, 42 moedas, e
você aprendeu 2×7"**. É também o relatório que o adulto quer ver, sem nunca ter sido
apresentado à criança como avaliação.

Substitui a tela de desfecho removida na Fase 1, mas com uma diferença que importa: não
tem botão de "jogar de novo", porque não acabou nada. Só um "Continuar".

---

### Task 8: Ponta a ponta e fechamento

**Files:**
- Modify: `e2e/jogo.ts`, `e2e/desktop.spec.ts`, `e2e/celular.spec.ts`
- Modify: `README.md`

- [x] **Step 1: Expor moedas e loja à ponte de depuração**

- [x] **Step 2: O fluxo econômico completo no navegador**

Colher acertando → conferir que a moeda subiu → abrir a loja → comprar → conferir o
débito e o efeito. Gravar tela da loja aberta, no desktop e no celular.

- [x] **Step 3: Rodar o projeto inteiro**

Run: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run e2e`

- [x] **Step 4: Olhar as telas**

A loja tem que caber na tela do celular sem rolagem e sem cortar o custo dos itens. Foi
uma tela gravada que revelou a noite preta na Fase 1.

- [x] **Step 5: Atualizar o README e commitar**
