# Fase 1 — Noite curta e lanterna Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar todo o perigo do jogo, encurtar a noite para menos de um quarto do
ciclo e entregar a lanterna — uma luz que acompanha o jogador, guarda carga como
prazo e é reacesa resolvendo uma multiplicação na fogueira. Ao fim desta fase o jogo
continua jogável do começo ao fim, sem nenhuma forma de perder.

**Design:** `docs/superpowers/specs/2026-08-18-ilha-cozy-design.md`

**Architecture:** A slice `enemies/` é apagada por inteiro, junto com vida, dano e
desfecho. Nasce a slice `lantern/`, que copia o modelo de combustível já provado em
`building.logic.ts`: a carga é um **prazo** (`chargedUntil`), não um número que
decresce — assim ela queima continuamente sem uma única escrita por quadro no store,
e quem precisa do valor atual chama uma função pura. A recarga entra pelo caminho de
`purpose: 'abastecer'` que já existe: `math.store` continua sendo quem decide *quanto*
o acerto vale, e as slices de destino continuam sendo quem sabe aplicar.

**Tech Stack:** React 19, TypeScript strict, React Three Fiber, Zustand, Vitest +
Testing Library, Playwright.

## Global Constraints

- Não pode restar nenhuma forma de perder o jogo: sem vida, sem dano, sem desfecho.
- A carga da lanterna nunca é escrita por quadro — o store só recebe a renovação.
- Ficar sem carga não bloqueia nada: o jogo segue jogável no luar.
- O luar tem que permitir andar e reconhecer o terreno sem a lanterna acesa.
- O mundo continua rodando durante o desafio, e o painel continua ancorado no alvo.
- Nenhum asset externo; a luz da lanterna é uma `pointLight` e a peça é primitiva.
- Nenhuma dependência nova no `package.json`.
- O resumo do dia **não** entra nesta fase: ele depende das moedas e chega na Fase 2.
  Aqui o `OutcomeOverlay` simplesmente deixa de existir, e o jogo passa a ser sem fim.

---

### Task 1: Encurtar a noite e clarear o luar

**Files:**
- Modify: `src/slices/daynight/daynight.logic.ts`
- Modify: `src/slices/daynight/daynight.test.ts`

**Interfaces:**
- Altera os valores de `PHASE_BOUNDS` e de `PHASE_LIGHTING.noite` / `.amanhecer`.
- Remove `isDangerous`.

- [ ] **Step 1: Escrever os testes de duração e de legibilidade da noite**

Em `daynight.test.ts`, apagar o `describe('isDangerous')` inteiro e o import de
`isDangerous`. Acrescentar:

```ts
describe('proporcao das fases', () => {
  const duracao = (fase: DayPhase) =>
    (PHASE_BOUNDS[fase].end - PHASE_BOUNDS[fase].start) * DAYNIGHT.cycleSeconds;

  it('a noite dura menos de um quarto do dia', () => {
    expect(duracao('noite')).toBeLessThan(duracao('dia') / 4);
  });

  it('a noite cabe em menos de um minuto', () => {
    expect(duracao('noite')).toBeLessThanOrEqual(50);
  });

  it('o dia continua sendo a maior parte do ciclo', () => {
    expect(duracao('dia')).toBeGreaterThan(DAYNIGHT.cycleSeconds / 2);
  });
});

describe('luar', () => {
  it('e claro o bastante para andar sem lanterna', () => {
    const noite = skyConfigFor(PHASE_BOUNDS.noite.end - 0.001);
    expect(noite.ambientIntensity).toBeGreaterThanOrEqual(0.6);
    expect(noite.sunIntensity).toBeGreaterThanOrEqual(0.75);
  });

  it('ainda e nitidamente mais escuro que o dia', () => {
    const dia = skyConfigFor(PHASE_BOUNDS.dia.start + 0.1);
    const noite = skyConfigFor(PHASE_BOUNDS.noite.end - 0.001);
    expect(noite.ambientIntensity).toBeLessThan(dia.ambientIntensity * 0.7);
  });
});
```

Importar `DAYNIGHT` e o tipo `DayPhase` no bloco de imports do teste, se ainda não
estiverem lá.

- [ ] **Step 2: Rodar os testes e confirmar a falha correta**

Run: `npm test -- --run src/slices/daynight/daynight.test.ts`

Expected: FAIL nas novas asserções — a noite hoje dura 66 s e o luar está em
`ambientIntensity 0.5` / `sunIntensity 0.62`. Os testes antigos de fronteira, escrita
sobre `PHASE_BOUNDS` de forma simbólica, continuam passando.

- [ ] **Step 3: Aplicar os novos números**

Em `daynight.logic.ts`:

1. Trocar `PHASE_BOUNDS` por:

```ts
export const PHASE_BOUNDS = {
  dia: { start: 0, end: 0.68 },
  entardecer: { start: 0.68, end: 0.76 },
  noite: { start: 0.76, end: 0.92 },
  amanhecer: { start: 0.92, end: 1 },
} as const;
```

2. Reescrever o comentário do bloco: com o ciclo de 300 s são **dia 204 · entardecer
   24 · noite 48 · amanhecer 24**. O porquê mudou e o comentário tem que contar isso —
   a noite não é mais a prova a ser vencida, é uma janela curta e bonita; o dia cresceu
   porque é nele que a criança faz conta, e o entardecer encolheu porque não anuncia
   mais perigo nenhum, só a virada da luz.

3. Em `PHASE_LIGHTING.noite.to`, subir para `sunIntensity: 0.78` e
   `ambientIntensity: 0.62`. Repetir exatamente os mesmos valores em
   `PHASE_LIGHTING.amanhecer.from` — as fases têm que emendar sem salto, como o
   comentário que já está lá exige. Atualizar o comentário do luar: a calibragem
   antiga mirava "escuro o bastante para dar medo"; a nova mira "escuro o bastante
   para a lanterna valer a pena, claro o bastante para nunca atrapalhar".

4. Apagar `isDangerous` e a linha correspondente em `src/slices/daynight/index.ts`.

- [ ] **Step 4: Rodar os testes**

Run: `npm test -- --run src/slices/daynight/daynight.test.ts`

Expected: PASS, incluindo os testes preexistentes de fronteira, de monotonicidade do
escurecimento e de continuidade entre fases.

- [ ] **Step 5: Commitar**

```powershell
git add src/slices/daynight
git commit -m "feat: shorten night and brighten moonlight"
```

---

### Task 2: Remover a slice de inimigos e todo o perigo

**Files:**
- Delete: `src/slices/enemies/` (a pasta inteira: `enemies.logic.ts`,
  `enemies.store.ts`, `enemies.test.ts`, `EnemiesView.tsx`, `EnemiesView.test.tsx`,
  `index.ts`)
- Delete: `src/app/OutcomeOverlay.tsx`, `src/app/outcome.css`
- Modify: `src/app/store.ts`, `src/app/GameCanvas.tsx`, `src/app/App.tsx`,
  `src/app/Hud.tsx`, `src/app/TouchControls.tsx`
- Modify: `src/slices/math/ChallengePanel.tsx`
- Modify: `src/slices/building/building.logic.ts`
- Modify: `e2e/jogo.ts`

**Interfaces:**
- `GameState` perde `EnemiesSlice` — some `health`, `enemies`, `outcome`,
  `survivedNight` e todas as ações correspondentes.
- `restartGame` deixa de chamar `resetSurvival`.

- [ ] **Step 1: Apagar a slice e as referências**

```powershell
git rm -r src/slices/enemies
git rm src/app/OutcomeOverlay.tsx src/app/outcome.css
```

Em seguida, remover as referências, uma a uma:

- `src/app/store.ts` — tirar o import e o spread de `createEnemiesSlice`, tirar
  `EnemiesSlice` do tipo `GameState` e tirar `state.resetSurvival()` de `restartGame`.
- `src/app/GameCanvas.tsx` — tirar o import e o `<EnemiesView />`. Manter intacto o
  comentário sobre a ordem de montagem dos `useFrame`, ajustando só a menção ao spawn
  de inimigos: o relógio continua vindo primeiro, agora por causa do combustível da
  fogueira e da carga da lanterna.
- `src/app/App.tsx` — tirar o import e o `<OutcomeOverlay />`.
- `src/app/Hud.tsx` — tirar o import de `ENEMIES`, as leituras de `health` e
  `enemies.length`, o `<span className="hud__health">` inteiro e o
  `hud__danger`. As classes órfãs saem de `src/app/hud.css` na Task 6.
- `src/app/TouchControls.tsx:137` — tirar a leitura de `outcome` e a guarda
  `if (outcome !== 'jogando') return null`.
- `src/slices/math/ChallengePanel.tsx:21` — tirar `temMonstros` e o que ele controla
  na renderização.
- `src/slices/building/building.logic.ts` — tirar `fireSafeRadius` de `BUILDING`, que
  só existia para os inimigos.
- `e2e/jogo.ts:40-44` — tirar `vida`, `desfecho` e `inimigos` do estado exposto ao
  teste.

- [ ] **Step 2: Rodar typecheck para achar o que sobrou**

Run: `npm run typecheck`

Expected: PASS. O TypeScript strict é o que garante que nenhuma referência ficou
para trás; se algo falhar aqui, é uma referência esquecida, não um teste ruim.

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm test -- --run`

Expected: PASS. Qualquer teste que ainda cite vida, dano ou desfecho deve ser
**apagado**, não adaptado — a mecânica não existe mais.

- [ ] **Step 4: Confirmar que não sobrou vestígio**

Run: `git grep -n "enemies\|health\|outcome\|inimigo\|ENEMIES\|survivedNight" -- src e2e`

Expected: nenhuma linha. `outcome` é a única palavra ambígua: se aparecer, tem que ser
apenas a variável local de `resolveAnswer`/`answerChallenge`, que é o resultado da
resposta e nada tem a ver com desfecho de partida.

- [ ] **Step 5: Commitar**

```powershell
git add -A src e2e
git commit -m "feat: remove night enemies, damage and defeat"
```

---

### Task 3: Slice da lanterna — carga como prazo

**Files:**
- Create: `src/slices/lantern/lantern.logic.ts`
- Create: `src/slices/lantern/lantern.test.ts`
- Create: `src/slices/lantern/lantern.store.ts`
- Create: `src/slices/lantern/index.ts`
- Modify: `src/app/store.ts`
- Modify: `src/shared/palette.ts`

**Interfaces:**
- Produces `Lantern = { chargedUntil: number }`.
- Produces `LANTERN`, `chargeRemaining(lantern, now)`, `isGlowing(lantern, now)`,
  `rechargeUntil(lantern, now, ratio)`, `lanternIntensity(lantern, now)`.
- Produces `LanternSlice = { lantern, rechargeLantern(ratio, now?), resetLantern() }`.

- [ ] **Step 1: Escrever os testes da lógica pura**

Criar `lantern.test.ts`:

```ts
const apagada: Lantern = { chargedUntil: 0 };

describe('chargeRemaining', () => {
  it('conta o que falta ate o prazo', () => {
    expect(chargeRemaining({ chargedUntil: 100 }, 70)).toBe(30);
  });

  it('nunca e negativo', () => {
    expect(chargeRemaining({ chargedUntil: 100 }, 180)).toBe(0);
  });
});

describe('rechargeUntil', () => {
  it('o acerto rende uma carga inteira', () => {
    expect(rechargeUntil(apagada, 10, 1)).toBe(10 + LANTERN.chargeSeconds);
  });

  it('o erro rende uma fracao da carga, e nao zero', () => {
    const prazo = rechargeUntil(apagada, 10, 0.25);
    expect(prazo).toBeGreaterThan(10);
    expect(prazo).toBeLessThan(10 + LANTERN.chargeSeconds);
  });

  it('recarregar cedo soma ao que restava', () => {
    const meia: Lantern = { chargedUntil: 40 };
    expect(rechargeUntil(meia, 10, 1)).toBe(10 + 30 + LANTERN.chargeSeconds);
  });

  it('nao passa do teto de duas cargas', () => {
    const cheia: Lantern = { chargedUntil: 10 + LANTERN.chargeSeconds * 2 };
    expect(rechargeUntil(cheia, 10, 1)).toBe(10 + LANTERN.chargeSeconds * 2);
  });
});

describe('lanternIntensity', () => {
  it('e zero sem carga', () => {
    expect(lanternIntensity(apagada, 10)).toBe(0);
  });

  it('esmaece no fim da carga em vez de apagar de uma vez', () => {
    const fim: Lantern = { chargedUntil: 10 + LANTERN.lowChargeSeconds / 2 };
    const cheia: Lantern = { chargedUntil: 10 + LANTERN.chargeSeconds };
    const fraca = lanternIntensity(fim, 10);
    expect(fraca).toBeGreaterThan(0);
    expect(fraca).toBeLessThan(lanternIntensity(cheia, 10));
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- --run src/slices/lantern/lantern.test.ts`

Expected: FAIL — o módulo ainda não existe.

- [ ] **Step 3: Implementar a lógica pura**

Em `lantern.logic.ts`, espelhar deliberadamente `fuelRemaining` / `refuelUntil` de
`building.logic.ts` — é o mesmo modelo, já provado, e a semelhança é o que torna as
duas fáceis de ler juntas. Documentar no cabeçalho **por que** a carga é prazo e não
quantidade: um número que decresce exigiria escrita por quadro no store, que é
justamente o que a regra de performance do projeto proíbe.

```ts
export const LANTERN = {
  /** Uma carga cobre a noite inteira (48 s) com folga — uma conta por noite basta. */
  chargeSeconds: 60,
  /** Teto de duas cargas: recarregar cedo nao e desperdicio, mas nao acumula. */
  maxCharges: 2,
  /** Raio iluminado, em metros. */
  radius: 9,
  /** Abaixo disto a luz comeca a esmaecer e o HUD avisa. */
  lowChargeSeconds: 15,
} as const;
```

`lanternIntensity` devolve 0 sem carga, o valor cheio acima de `lowChargeSeconds` e
interpola linearmente entre os dois no fim. Esmaecer em vez de apagar de estalo é
decisão de tom: o aviso tem que ser gentil.

Em `lantern.store.ts`, o slice creator com `lantern: { chargedUntil: 0 }` — a lanterna
começa **apagada**, porque acendê-la pela primeira vez é o gesto que ensina a
mecânica. `rechargeLantern(ratio, now = dayNightClock.seconds)` aplica `rechargeUntil`,
e `resetLantern()` volta ao zero.

Em `palette.ts`, acrescentar `lanternLight: '#ffd98a'` no grupo de construções,
próximo de `fireCore`.

Compor `LanternSlice` em `GameState` no `store.ts` e chamar `resetLantern()` em
`restartGame`.

- [ ] **Step 4: Rodar os testes**

Run: `npm test -- --run src/slices/lantern`

Expected: PASS.

- [ ] **Step 5: Commitar**

```powershell
git add src/slices/lantern src/app/store.ts src/shared/palette.ts
git commit -m "feat: add lantern charge slice"
```

---

### Task 4: Acender a lanterna resolvendo a conta na fogueira

**Files:**
- Modify: `src/slices/math/math.store.ts`
- Modify: `src/slices/math/math.store.test.ts`

**Interfaces:**
- Consumes `rechargeLantern` da Task 3.
- `answerChallenge` com `purpose: 'abastecer'` passa a renovar **fogueira e lanterna**
  com a mesma proporção.

- [ ] **Step 1: Escrever o teste de integração entre as slices**

Em `math.store.test.ts`:

```ts
it('a conta da fogueira tambem acende a lanterna', () => {
  const store = useGameStore.getState();
  store.startChallenge({ id: 'fogueira-1', kind: 'madeira', groups: 4 }, 'abastecer');
  const desafio = useGameStore.getState().activeChallenge!;

  useGameStore.getState().answerChallenge(desafio.answer);

  expect(chargeRemaining(useGameStore.getState().lantern, dayNightClock.seconds))
    .toBeCloseTo(LANTERN.chargeSeconds, 0);
});

it('errar acende menos, e nunca deixa a lanterna apagada', () => {
  const store = useGameStore.getState();
  store.startChallenge({ id: 'fogueira-1', kind: 'madeira', groups: 4 }, 'abastecer');
  const desafio = useGameStore.getState().activeChallenge!;

  useGameStore.getState().answerChallenge(desafio.options.find((o) => o !== desafio.answer)!);

  const carga = chargeRemaining(useGameStore.getState().lantern, dayNightClock.seconds);
  expect(carga).toBeGreaterThan(0);
  expect(carga).toBeLessThan(LANTERN.chargeSeconds);
});
```

Seguir o padrão de reset entre testes que o arquivo já usa.

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- --run src/slices/math/math.store.test.ts`

Expected: FAIL — hoje o ramo `abastecer` só chama `refuelStructure`.

- [ ] **Step 3: Ligar a recarga**

Em `answerChallenge`, no ramo `abastecer`, calcular a proporção uma única vez e
aplicá-la aos dois destinos:

```ts
const ratio = outcome.correct ? 1 : WRONG_ANSWER_RATIO;
get().refuelStructure(challenge.targetId, ratio);
get().rechargeLantern(ratio);
```

Manter o comentário existente sobre a divisão de responsabilidade e estendê-lo: a
slice de matemática continua decidindo apenas *quanto* o acerto vale; quem sabe
aplicar continua sendo cada slice de destino. Uma conta, dois efeitos — o fogo do
acampamento e a luz que a criança leva com ela.

- [ ] **Step 4: Rodar os testes de matemática e de construção**

Run: `npm test -- --run src/slices/math src/slices/building src/slices/lantern`

Expected: PASS, incluindo os testes preexistentes de colheita, recompensa parcial e
feedback.

- [ ] **Step 5: Commitar**

```powershell
git add src/slices/math
git commit -m "feat: recharge lantern from the campfire challenge"
```

---

### Task 5: A luz na cena

**Files:**
- Create: `src/slices/lantern/LanternView.tsx`
- Create: `src/slices/lantern/LanternView.test.tsx`
- Modify: `src/slices/lantern/index.ts`
- Modify: `src/app/GameCanvas.tsx`

**Interfaces:**
- `LanternView` sem props; lê `playerTransform` e `dayNightClock` dentro do `useFrame`.

- [ ] **Step 1: Escrever o teste de cena**

Criar `LanternView.test.tsx` com o helper `renderScene` de `src/test/sceneHarness.tsx`:

```ts
it('nao ilumina nada com a lanterna apagada', async () => {
  const renderer = await renderScene(<LanternView />);
  await renderer.advanceFrames(2, 1 / 60);

  const luz = renderer.scene.findByType('PointLight');
  expect(luz.instance.intensity).toBe(0);

  await renderer.unmount();
});

it('acende com carga e acompanha o jogador', async () => {
  act(() => useGameStore.getState().rechargeLantern(1, dayNightClock.seconds));
  const renderer = await renderScene(<LanternView />);
  playerTransform.x = 7;
  playerTransform.z = -3;
  await renderer.advanceFrames(2, 1 / 60);

  const luz = renderer.scene.findByType('PointLight');
  expect(luz.instance.intensity).toBeGreaterThan(0);
  expect(luz.instance.position.x).toBeCloseTo(7);
  expect(luz.instance.position.z).toBeCloseTo(-3);

  await renderer.unmount();
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- --run src/slices/lantern/LanternView.test.tsx`

Expected: FAIL — o componente ainda não existe.

- [ ] **Step 3: Implementar a view**

`LanternView` monta uma `pointLight` com `color={palette.lanternLight}`,
`distance={LANTERN.radius}` e `decay={2}`. No `useFrame`:

1. Ler o estado com `useGameStore.getState()`, **nunca** com hook seletor — a regra de
   performance do projeto.
2. Posicionar a luz em `playerTransform`, um pouco acima do chão, para o jogador não
   virar uma silhueta contra o próprio facho.
3. Definir `intensity` com `lanternIntensity(lantern, dayNightClock.seconds)`.

Nada disso passa pelo store: é tudo leitura de objetos mutáveis dentro do quadro.

Em `GameCanvas.tsx`, montar `<LanternView />` **depois** de `<PlayerView />`, pelo
motivo que o comentário de ordem já explica: quem lê `playerTransform` tem que rodar
depois de quem escreve, sob pena de a luz ficar um quadro atrás do jogador — a 7 m/s,
é meio metro de atraso, e num facho de luz isso se vê.

- [ ] **Step 4: Rodar os testes de cena**

Run: `npm test -- --run src/slices/lantern`

Expected: PASS.

- [ ] **Step 5: Commitar**

```powershell
git add src/slices/lantern src/app/GameCanvas.tsx
git commit -m "feat: render the lantern light following the player"
```

---

### Task 6: HUD — carga no lugar da vida

**Files:**
- Modify: `src/app/Hud.tsx`
- Modify: `src/app/hud.css`
- Modify: `src/app/Hud.test.tsx` (criar se não existir)
- Modify: `src/app/TouchControls.tsx`

**Interfaces:**
- O HUD assina `lantern` e `clock`; a barra de carga é publicada a partir de valores
  discretos, sem leitura por quadro.

- [ ] **Step 1: Escrever as asserções do HUD**

`src/app/` ainda não tem nenhum arquivo de teste. `Hud.test.tsx` é o primeiro, e por
isso precisa abrir com `// @vitest-environment jsdom` na primeira linha — a convenção
por arquivo que o projeto usa para tudo que renderiza DOM.

```ts
it('mostra a barra de carga da lanterna', () => {
  render(<Hud />);
  expect(screen.getByRole('meter', { name: /lanterna/i })).toBeInTheDocument();
});

it('nao mostra mais barra de vida nem aviso de perigo', () => {
  render(<Hud />);
  expect(screen.queryByRole('meter', { name: /vida/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/à espreita/i)).not.toBeInTheDocument();
});

it('no entardecer convida a acender a lanterna, sem ameacar', () => {
  act(() => useGameStore.getState().publishClock({ phase: 'entardecer', day: 1, secondsToNextPhase: 12 }));
  render(<Hud />);
  const aviso = screen.getByRole('alert');
  expect(aviso).toHaveTextContent(/lanterna/i);
  expect(aviso.textContent).not.toMatch(/noite está chegando|perigo|fogueira!/i);
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- --run src/app/Hud.test.tsx`

Expected: FAIL — a barra de carga não existe e o aviso do entardecer ainda diz
"A noite está chegando — acenda uma fogueira!".

- [ ] **Step 3: Trocar a barra e o texto**

No `Hud.tsx`, no lugar exato onde estava a barra de vida, um `role="meter"` com
`aria-label="Lanterna"` cuja largura vem da carga restante sobre
`LANTERN.chargeSeconds`. A carga é lida do store, que só muda quando a lanterna é
recarregada — mas o **esvaziamento** é contínuo, então a barra usa a mesma amostra
throttled a 4 Hz que o relógio já publica, e não um `useFrame` novo. Se o valor
necessário não estiver na amostra, acrescentá-lo a `ClockSample`; é o mesmo caminho já
usado para o contador regressivo, com a mesma guarda de igualdade em
`publishClock`, para que o store não notifique assinantes sem mudança visível.

Trocar o aviso do entardecer por um convite, não um alerta:
`Anoitecendo — acenda a lanterna na fogueira` seguido do contador. O
`hud__prompt--aviso` continua sendo o mesmo componente; o que muda é o tom, e é o tom
que define o gênero do jogo.

Acrescentar um segundo aviso, só quando a fase for `noite` e a carga estiver abaixo de
`LANTERN.lowChargeSeconds`: `A lanterna está fraca`. Sem exclamação e sem contagem
regressiva — é informação, não pressão.

Em `hud.css`, renomear `.hud__health` para `.hud__lantern` com a cor
`palette.lanternLight`, e apagar `.hud__danger`, que ficou órfã na Task 2.

Em `TouchControls.tsx`, conferir que o botão **Lenha** continua aparecendo perto da
fogueira e ajustar o rótulo para **Acender**, que agora descreve melhor o que a ação
faz.

- [ ] **Step 4: Rodar os testes de UI**

Run: `npm test -- --run src/app`

Expected: PASS.

- [ ] **Step 5: Commitar**

```powershell
git add src/app
git commit -m "feat: show lantern charge in the HUD"
```

---

### Task 7: Provar no navegador e fechar a fase

**Files:**
- Modify: `e2e/jogo.ts`
- Modify: `e2e/desktop.spec.ts`
- Modify: `e2e/celular.spec.ts`

- [ ] **Step 1: Expor a lanterna à ponte de depuração**

Em `e2e/jogo.ts`, no lugar dos campos `vida`/`desfecho`/`inimigos` removidos na Task 2,
expor `cargaLanterna: chargeRemaining(s.lantern, clock.seconds)`.

- [ ] **Step 2: Reescrever o fluxo de noite dos dois projetos**

Os testes atuais provam "sobreviver até o amanhecer". Esse desfecho não existe mais.
Substituir pelo fluxo novo, em `desktop.spec.ts` e `celular.spec.ts`:

1. colher um recurso resolvendo a conta;
2. construir a fogueira;
3. adiantar o relógio até a noite;
4. acender a lanterna resolvendo a conta na fogueira e conferir que `cargaLanterna`
   subiu;
5. **gravar a tela da noite com a lanterna acesa** em `e2e/telas/`.

Apagar as asserções de vida, de dano por contato e de tela de derrota.

O passo 5 não é enfeite. Foi olhando as telas gravadas que apareceram a ilha cor de
areia, o personagem sem cabeça e a noite escura demais para jogar — e esta fase inteira
é uma aposta visual sobre o que é aconchegante. O número que passa no teste não é o
mesmo que funciona na tela.

- [ ] **Step 3: Rodar o projeto inteiro**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: todos com código 0.

- [ ] **Step 4: Rodar os testes ponta a ponta**

Run: `npm run e2e`

Expected: `desktop` e `celular` passam. Abrir as telas gravadas em `e2e/telas/` e
**olhar**: a noite tem que estar navegável sem a lanterna e visivelmente mais
acolhedora com ela acesa. Se não estiver, o ajuste é nos números da Task 1 e no raio da
Task 3 — não no teste.

- [ ] **Step 5: Atualizar o README e conferir o diff**

O README ainda descreve um jogo de sobrevivência: o título, a frase "sem fogo, a noite
vence", a tabela de controles com vida e inimigos, e o parágrafo do ciclo de 3 minutos.
Atualizar essas partes para a ilha cozy — a noite curta, a lanterna, e o fato de que
não há como perder.

Run:

```powershell
git diff --check HEAD~6..HEAD
git status --short
```

Confirmar que só arquivos do projeto `99` foram tocados e que as mudanças
preexistentes em `cc`, `ds` e `st` continuam intactas.

- [ ] **Step 6: Commitar**

```powershell
git add e2e README.md
git commit -m "test: cover the cozy night end to end"
```
