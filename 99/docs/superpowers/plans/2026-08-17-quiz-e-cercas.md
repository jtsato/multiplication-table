# Quiz centralizado e encaixe de cercas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralizar o quiz na viewport e tornar a montagem de cercados previsível, com encaixe automático nas pontas e espaço livre para árvores/pedras.

**Architecture:** O `ChallengePanel` será uma camada DOM fixa montada junto ao `Hud`, mantendo o store e as ações atuais. A lógica pura de construção ganhará geometria de segmento para cercas e uma função de encaixe que será usada tanto pelo fantasma quanto pela confirmação, evitando que a prévia e a construção divergirem.

**Tech Stack:** React 19, TypeScript strict, React Three Fiber, Zustand, Vitest + Testing Library, Playwright.

## Global Constraints

- O quiz ficará fixo no centro da viewport e não dependerá da posição 3D do recurso.
- A camada do quiz terá `pointer-events: none`; somente o cartão e os botões capturarão interação.
- O jogo continuará rodando enquanto o quiz estiver aberto.
- Cercas serão encaixadas em extremidades existentes para linhas e cantos de 90 graus.
- O encaixe só será usado quando a posição resultante passar pelas validações existentes.
- Árvores/pedras coletáveis já esgotadas continuarão sem bloquear construções.
- Não haverá nova dependência nem controle manual adicional para girar cercas.

---

### Task 1: Adicionar geometria de cerca e encaixe puro

**Files:**
- Modify: `src/slices/building/building.logic.ts`
- Test: `src/slices/building/building.test.ts`

**Interfaces:**
- Produces `FencePlacement = { position: Vec3; rotation: number }`.
- Produces `snapFencePlacement(manualPosition, manualRotation, inventory, existing, nodes, snapDistance?)`.
- Extends `checkPlacement` com um sexto parâmetro opcional `rotation = 0`, mantendo compatibilidade com as chamadas existentes.

- [ ] **Step 1: Escrever os testes que reproduzem os encaixes e o bloqueio geométrico**

Adicionar a `building.test.ts`:

```ts
it('encaixa uma cerca na extensao reta da cerca mais proxima', () => {
  const existente = structure('cerca', 0, 0);
  const resultado = snapFencePlacement(vec3(1.75, 0, 0), 0, rico, [existente], []);

  expect(resultado.position.x).toBeCloseTo(2);
  expect(resultado.position.z).toBeCloseTo(0);
  expect(resultado.rotation).toBeCloseTo(0);
});

it('encaixa uma cerca em um canto de 90 graus', () => {
  const existente = structure('cerca', 0, 0);
  const resultado = snapFencePlacement(vec3(1, 0, -1.2), 0, rico, [existente], []);

  expect(resultado.position.x).toBeCloseTo(1);
  expect(resultado.position.z).toBeCloseTo(-1);
  expect(Math.abs(Math.sin(resultado.rotation))).toBeCloseTo(1);
});

it('mantem o posicionamento manual quando nenhuma ponta esta proxima', () => {
  const manual = vec3(6, 0, 6);
  const resultado = snapFencePlacement(manual, 0.3, rico, [structure('cerca', 0, 0)], []);

  expect(resultado.position).toEqual(manual);
  expect(resultado.rotation).toBeCloseTo(0.3);
});

it('recusa recurso proximo de uma extremidade da cerca', () => {
  const resultado = checkPlacement(
    STRUCTURES.cerca,
    vec3(0, 0, 0),
    rico,
    [],
    [node(4.1, 0)],
    0,
  );

  expect(resultado).toEqual({ ok: false, reason: 'perto-de-recurso' });
});
```

Importar `snapFencePlacement` no bloco de imports do teste. O caso do recurso deve usar uma árvore/pedra cujo centro está além da antiga distância circular, mas cuja extremidade da cerca ficaria próxima do recurso.

- [ ] **Step 2: Rodar os testes e confirmar a falha correta**

Run: `npm test -- --run src/slices/building/building.test.ts`

Expected: FAIL porque `snapFencePlacement` ainda não existe e porque `checkPlacement` ainda não considera a geometria orientada da cerca.

- [ ] **Step 3: Implementar a geometria mínima e o encaixe**

Em `building.logic.ts`:

1. Adicionar a `BUILDING`:

```ts
fenceLength: 2,
fenceSnapDistance: 1.5,
```

2. Criar `FencePlacement` e helpers privados para direção local, extremidades e distância quadrada de um ponto a um segmento no plano XZ. A direção da cerca deve respeitar a convenção Three.js já usada no componente: `(cos(rotation), -sin(rotation))` no plano XZ.

3. Alterar `checkPlacement` para receber `rotation = 0`. Para `spec.kind === 'cerca'`, medir a distância do nó ao segmento entre as duas extremidades e compará-la com `STRUCTURES.cerca.footprint + BUILDING.clearanceFromNodes`. Nós `depleted` continuam ignorados. Para fogueiras, preservar a regra circular atual.

4. Ao validar sobreposição entre duas cercas, preservar a recusa para cercas sobrepostas, mas permitir uma junção quando uma extremidade coincidir e a diferença de rotação for paralela ou perpendicular. Isso permite os pontos gerados pelo snap sem liberar duas cercas no mesmo lugar.

5. Implementar `snapFencePlacement`:

```ts
export function snapFencePlacement(
  manualPosition: Vec3,
  manualRotation: number,
  inventory: Inventory,
  existing: readonly Structure[],
  nodes: readonly ResourceNode[],
  snapDistance = BUILDING.fenceSnapDistance,
): FencePlacement
```

Gerar candidatos para cada cerca existente, em cada extremidade, com rotações `existing.rotation`, `existing.rotation + Math.PI / 2` e `existing.rotation - Math.PI / 2`, posicionando uma extremidade da nova peça exatamente no ponto de conexão. Descartar candidatos além de `snapDistance` do posicionamento manual ou reprovados por `checkPlacement`. Retornar o candidato válido mais próximo; sem candidato, retornar a posição e rotação manuais.

- [ ] **Step 4: Rodar os testes e confirmar a implementação mínima**

Run: `npm test -- --run src/slices/building/building.test.ts`

Expected: PASS, incluindo todos os testes anteriores de custo, ilha, sobreposição e recursos.

- [ ] **Step 5: Commitar a unidade de lógica**

```powershell
git add src/slices/building/building.logic.ts src/slices/building/building.test.ts
git commit -m "feat: snap fence placement to existing ends"
```

---

### Task 2: Usar o mesmo encaixe no fantasma e na confirmação

**Files:**
- Modify: `src/slices/building/BuildingView.tsx`
- Test: `src/slices/building/BuildingView.test.tsx`

**Interfaces:**
- Consumes `snapFencePlacement` e o sexto parâmetro de `checkPlacement` da Task 1.
- Produces preview e confirmação com o mesmo par `{ position, rotation }`.

- [ ] **Step 1: Escrever o teste de integração que falha**

Adicionar um teste que zere `nodes`, dê madeira suficiente, construa uma primeira cerca e então coloque o jogador de modo que a posição manual fique perto da extensão da primeira:

```ts
it('confirma a segunda cerca encaixada na ponta da primeira', async () => {
  encheInventario();
  act(() => useGameStore.setState({ nodes: [] }));
  const renderer = await renderScene(<BuildingView />);
  await renderer.advanceFrames(1, 1 / 60);

  pressKey('KeyC');
  pressKey('Space');
  const primeira = state().structures[0];

  playerTransform.x = primeira.position.x + 5.4;
  playerTransform.z = primeira.position.z;
  playerTransform.yaw = Math.PI / 2;
  pressKey('KeyC');
  pressKey('Space');

  expect(state().structures).toHaveLength(2);
  expect(state().structures[1].position.x).toBeCloseTo(primeira.position.x + 2);
  expect(state().structures[1].position.z).toBeCloseTo(primeira.position.z);

  await renderer.unmount();
});
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test -- --run src/slices/building/BuildingView.test.tsx -t "segunda cerca encaixada"`

Expected: FAIL porque `BuildingView` ainda confirma a posição manual e/ou recusa a junção.

- [ ] **Step 3: Aplicar o encaixe nos dois caminhos do componente**

Em `BuildingView.tsx`, calcular a posição manual com `placementPosition`. Quando `buildMode === 'cerca'`, passar posição, yaw, inventário, estruturas e nós a `snapFencePlacement`; para fogueira, manter `{ position: manualPosition, rotation: playerTransform.yaw }`.

Usar o mesmo cálculo no `useFrame` do `PlacementGhost` e no handler `confirmar`. O fantasma deve receber `group.position` e `group.rotation.y` do resultado, e a confirmação deve chamar `placeStructure(result.position, result.rotation, ...)`. Passar também `result.rotation` ao `checkPlacement` do fantasma.

- [ ] **Step 4: Rodar a integração e a suíte de construção**

Run: `npm test -- --run src/slices/building/BuildingView.test.tsx`

Expected: PASS com a nova montagem lado a lado e todos os testes anteriores.

- [ ] **Step 5: Commitar a integração**

```powershell
git add src/slices/building/BuildingView.tsx src/slices/building/BuildingView.test.tsx
git commit -m "feat: use snapped fence placement in preview and build"
```

---

### Task 3: Transformar o quiz em overlay centralizado

**Files:**
- Modify: `src/slices/math/ChallengePanel.tsx`
- Modify: `src/slices/math/challenge.css`
- Modify: `src/app/GameCanvas.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/slices/math/ChallengePanel.test.tsx`

**Interfaces:**
- `ChallengePanel` continuará sem props e continuará lendo `activeChallenge`, `feedback` e ações do store.
- O componente deixará de depender de `@react-three/drei`, posições de nós ou estruturas.

- [ ] **Step 1: Escrever a asserção de camada centralizada**

No teste de montagem do desafio, adicionar:

```ts
expect(container.querySelector('.challenge-overlay')).toBeInTheDocument();
expect(container.querySelector('.challenge-overlay .challenge')).toBeInTheDocument();
```

Remover o mock de `Html` e o import de `ReactNode` somente junto da implementação, para que a alteração do teste inicialmente falhe pela classe inexistente.

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test -- --run src/slices/math/ChallengePanel.test.tsx -t "camada centralizada"`

Expected: FAIL porque o painel atual é filho direto do `Html` mockado e não possui `.challenge-overlay`.

- [ ] **Step 3: Implementar o overlay mínimo**

Em `ChallengePanel.tsx`, remover `Html`, `useIsTouchDevice`, `Vec3`, a busca de `anchor` e as leituras de `nodes`/`structures`. Renderizar o conteúdo dentro de:

```tsx
<div className="challenge-overlay">
  {challenge ? <div className="challenge">...</div> : <div className="challenge challenge--feedback ...">...</div>}
</div>
```

Manter sem mudanças a resposta por teclado, os botões, o feedback e o timer. Em `GameCanvas.tsx`, remover `ChallengePanel`; em `App.tsx`, montar `<ChallengePanel />` junto das camadas DOM do HUD.

Em `challenge.css`, adicionar:

```css
.challenge-overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 16px;
  pointer-events: none;
}

.challenge {
  width: min(260px, calc(100vw - 32px));
  pointer-events: auto;
}

.challenge--feedback {
  width: min(200px, calc(100vw - 32px));
}
```

Adicionar uma margem equivalente com `env(safe-area-inset-*)` no media query de telas estreitas para que o cartão também fique dentro da área segura do celular.

- [ ] **Step 4: Rodar os testes do painel**

Run: `npm test -- --run src/slices/math/ChallengePanel.test.tsx`

Expected: PASS nos testes de renderização, respostas, feedback e expiração.

- [ ] **Step 5: Commitar o overlay**

```powershell
git add src/slices/math/ChallengePanel.tsx src/slices/math/challenge.css src/app/GameCanvas.tsx src/app/App.tsx src/slices/math/ChallengePanel.test.tsx
git commit -m "fix: center challenge panel in viewport"
```

---

### Task 4: Verificar centralização no navegador e o projeto inteiro

**Files:**
- Modify: `e2e/jogo.ts`
- Modify: `e2e/desktop.spec.ts`
- Modify: `e2e/celular.spec.ts`

- [ ] **Step 1: Adicionar uma asserção reutilizável de viewport**

Em `e2e/jogo.ts`, criar:

```ts
export async function esperarPainelCentralizado(page: Page): Promise<void> {
  const caixa = await page.locator('.challenge').boundingBox();
  const viewport = page.viewportSize();
  expect(caixa).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(caixa!.x).toBeGreaterThanOrEqual(-1);
  expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(Math.abs(caixa!.x + caixa!.width / 2 - viewport!.width / 2)).toBeLessThanOrEqual(2);
}
```

- [ ] **Step 2: Usar a asserção nos fluxos desktop e celular**

Depois de abrir o desafio em `desktop.spec.ts` e `celular.spec.ts`, chamar `await esperarPainelCentralizado(page);` antes do screenshot. Isso verifica que o painel não corta em nenhuma das duas larguras suportadas.

- [ ] **Step 3: Rodar a suíte unitária, typecheck, lint e build**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: todos os comandos terminam com código 0; o Vitest não relata falhas e o build produz `dist/`.

- [ ] **Step 4: Rodar os testes ponta a ponta**

Run: `npm run e2e`

Expected: os projetos `desktop` e `celular` passam, inclusive asserções de centralização, respostas do quiz e cercado.

- [ ] **Step 5: Conferir diff e estado do Git**

Run:

```powershell
git diff --check HEAD~4..HEAD
git status --short
```

Confirmar que apenas arquivos do projeto `99` foram alterados pelos commits desta implementação e que as mudanças preexistentes em `cc`/`st` permanecem intocadas.
