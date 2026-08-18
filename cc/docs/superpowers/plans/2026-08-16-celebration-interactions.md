# Comemoração e interações do avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o avatar e o mascote mais interativos, deixar os botões de ação amarelos e criar uma comemoração com papel picado colorido ao concluir uma ilha.

**Architecture:** A interação permanece local aos componentes de tela: o avatar controla um estado temporário de aceno e o mascote recebe o humor correspondente por prop. A celebração usa uma lista determinística de peças decorativas renderizada na tela de conclusão, enquanto CSS concentra cores, movimentos e a adaptação a `prefers-reduced-motion`.

**Tech Stack:** React 19, TypeScript, SVG/CSS existente, Vitest, Testing Library e `audioService` já usado pelos controles do jogo.

## Global Constraints

- Aplicar amarelo aos botões de ação `primary`, `secondary`, `ghost`, `danger` e ao `SoundToggle`; cards de seleção e ilhas mantêm seus próprios estados.
- O avatar da tela inicial acena ao toque/clique/teclado, enquanto “Mudar personagem” continua sendo uma ação separada.
- Na missão, `waving` tem prioridade sobre `happy`, e `cheering` tem prioridade sobre ambos durante a comemoração.
- A conclusão da ilha deve renderizar papel picado decorativo com cores da ilha, amarelo, rosa, azul e branco.
- Não adicionar dependências nem imagens externas; manter SVG/CSS e dados determinísticos.
- Preservar regras de progressão, pontuação, persistência, traduções existentes e alterações não relacionadas já presentes no worktree.
- Toda animação nova deve respeitar `prefers-reduced-motion: reduce`.

---

### Task 1: Modelar os humores visuais do mascote e cobrir a apresentação

**Files:**

- Modify: `src/art/Mascot.tsx`
- Modify: `src/styles/global.css`
- Create: `src/art/Mascot.test.tsx`

**Interfaces:**

- Consumes: `MascotProps` existente, `MascotKind` e `MascotPalette` já usados pelo jogo.
- Produces: `mood` aceita `'happy' | 'waving' | 'cheering' | 'thinking'`; os elementos SVG continuam recebendo as classes `.mascot` e `.mascot--<mood>`.

- [ ] **Step 1: Escrever os testes que descrevem os três estados novos/ajustados**

Criar `src/art/Mascot.test.tsx` com ambiente jsdom e verificar classes e sinais visuais estáveis. O teste deve usar a paleta abaixo para manter o fixture pequeno:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Mascot } from './Mascot';

const palette = { accent: '#8fd14f', accentSoft: '#d9f2b4', blockDark: '#41642d' };

describe('Mascot moods', () => {
  it.each(['happy', 'waving', 'cheering'] as const)('aplica a classe do humor %s', (mood) => {
    const { container } = render(<Mascot palette={palette} mood={mood} />);
    expect(container.querySelector(`.mascot--${mood}`)).toBeInTheDocument();
  });

  it('renderiza o sorriso e os braços expressivos no estado feliz', () => {
    const { container } = render(<Mascot palette={palette} mood="happy" />);
    expect(container.querySelector('.mascot__smile')).toBeInTheDocument();
    expect(container.querySelector('.mascot__arms')).toBeInTheDocument();
  });

  it('renderiza a variação de aceno e o destaque da comemoração', () => {
    const waving = render(<Mascot palette={palette} mood="waving" />);
    expect(waving.container.querySelector('.mascot__arm--waving')).toBeInTheDocument();
    waving.unmount();

    const cheering = render(<Mascot palette={palette} mood="cheering" />);
    expect(cheering.container.querySelector('.mascot__sparkles')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Executar o teste para confirmar a falha inicial**

Run: `npm test -- src/art/Mascot.test.tsx`

Expected: FAIL porque `waving` ainda não é aceito e os marcadores `.mascot__smile`, `.mascot__arms`, `.mascot__arm--waving` e `.mascot__sparkles` ainda não existem.

- [ ] **Step 3: Implementar os elementos SVG dos humores**

Em `src/art/Mascot.tsx`:

1. Acrescentar `waving` ao tipo de `mood`.
2. Substituir a boca retangular única por um grupo `.mascot__smile` com uma boca aberta e um pequeno brilho claro, para que o estado normal pareça sorridente.
3. Envolver os braços em `.mascot__arms`; no estado `waving`, levantar um braço e aplicar `.mascot__arm--waving`; no estado `cheering`, levantar os dois braços.
4. Renderizar dentro do SVG um grupo `.mascot__sparkles` somente em `cheering`, com três brilhos pequenos ao redor do corpo.
5. Manter `aria-hidden="true"`, o `Topper` e as cores existentes.

Uma forma mínima e compatível com o desenho pixelado é:

```tsx
<g className="mascot__arms">
  <rect className={mood === 'cheering' ? 'mascot__arm mascot__arm--raised' : 'mascot__arm'} x="4" y="24" width="7" height="16" fill={palette.accent} />
  <rect className={mood === 'waving' ? 'mascot__arm mascot__arm--waving' : mood === 'cheering' ? 'mascot__arm mascot__arm--raised' : 'mascot__arm'} x="53" y="24" width="7" height="16" fill={palette.accent} />
</g>
<g className="mascot__smile">
  <rect x="22" y="40" width="20" height="7" rx="2" fill="#2b2233" />
  <rect x="26" y="40" width="12" height="2" fill="#ffffff" opacity="0.8" />
</g>
{mood === 'cheering' && (
  <g className="mascot__sparkles" aria-hidden="true" fill={palette.accentSoft}>
    <rect x="5" y="8" width="4" height="4" />
    <rect x="52" y="4" width="3" height="3" />
    <rect x="12" y="2" width="3" height="3" />
    <rect x="10" y="20" width="8" height="2" />
    <rect x="13" y="17" width="2" height="8" />
  </g>
)}
```

Os cinco retângulos acima formam três brilhos concretos: dois quadrados e uma cruz maior feita com dois retângulos sobrepostos.

- [ ] **Step 4: Adicionar movimento ao CSS dos humores**

Em `src/styles/global.css`, manter `.mascot--cheering` como salto, acrescentar uma flutuação leve para `.mascot--happy`, um aceno curto para `.mascot--waving` e os estilos de braços/brilhos. Use `transform-origin: center bottom` para não deslocar o layout.

```css
.mascot--happy {
  animation: mascot-float 1.8s ease-in-out infinite;
}

.mascot--waving {
  animation: mascot-wave 0.65s ease-in-out;
}

.mascot__arm--waving {
  transform-origin: 56px 32px;
  animation: mascot-arm-wave 0.65s ease-in-out;
}

@keyframes mascot-float {
  50% {
    transform: translateY(-3px);
  }
}

@keyframes mascot-wave {
  50% {
    transform: translateY(-3px) rotate(4deg);
  }
}

@keyframes mascot-arm-wave {
  50% {
    transform: rotate(-24deg);
  }
}
```

O `@media (prefers-reduced-motion: reduce)` existente deve continuar neutralizando essas animações; não criar uma segunda regra conflitante.

- [ ] **Step 5: Executar os testes do componente**

Run: `npm test -- src/art/Mascot.test.tsx`

Expected: PASS com todos os quatro casos do arquivo.

- [ ] **Step 6: Commitar somente o trabalho desta tarefa**

```bash
git add src/art/Mascot.tsx src/art/Mascot.test.tsx src/styles/global.css
git commit --only src/art/Mascot.tsx src/art/Mascot.test.tsx src/styles/global.css -m "feat: animate mascot moods"
```

---

### Task 2: Fazer o avatar acenar na tela inicial e durante a missão

**Files:**

- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/art/SceneView.tsx`
- Modify: `src/styles/global.css`
- Create: `src/screens/HomeScreen.test.tsx`
- Create: `src/art/SceneView.test.tsx`

**Interfaces:**

- Consumes: `Avatar`, `Mascot`, `Button`, `audioService`, `useTranslation` e o estado `GameState` existentes.
- Produces: o clique/teclado do avatar dispara somente o aceno; `onEditCharacter` fica ligado ao botão de edição; `SceneView` passa `mood="waving"` enquanto o aceno estiver ativo.

- [ ] **Step 1: Escrever o teste da separação entre acenar e editar**

Criar `src/screens/HomeScreen.test.tsx`, usando `I18nProvider locale="en-US"` e `createDefaultState('en-US')` com `player.onboardingCompleted = true`. O teste deve provar que tocar no avatar não chama edição, que o botão de edição chama edição e que o mascote recebe a classe de aceno:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultState } from '../domain/defaultState';
import { I18nProvider } from '../i18n/I18nProvider';
import { HomeScreen } from './HomeScreen';

it('separa o aceno do avatar da edição do personagem', async () => {
  const user = userEvent.setup();
  const onEditCharacter = vi.fn();
  const state = createDefaultState('en-US');
  state.player.onboardingCompleted = true;

  render(
    <I18nProvider locale="en-US">
      <HomeScreen
        state={state}
        onPlay={vi.fn()}
        onAchievements={vi.fn()}
        onSettings={vi.fn()}
        onEditCharacter={onEditCharacter}
      />
    </I18nProvider>,
  );

  await user.click(screen.getByRole('button', { name: 'Tap to wave' }));
  expect(onEditCharacter).not.toHaveBeenCalled();
  expect(document.querySelector('.home__avatar--waving')).toBeInTheDocument();
  expect(document.querySelector('.mascot--waving')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Change character' }));
  expect(onEditCharacter).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Executar o teste da tela inicial para confirmar a falha**

Run: `npm test -- src/screens/HomeScreen.test.tsx`

Expected: FAIL porque o avatar ainda chama `onEditCharacter`, não possui o nome acessível de aceno e não há estado `.home__avatar--waving`.

- [ ] **Step 3: Implementar o estado temporário de aceno na HomeScreen**

Em `HomeScreen.tsx`:

1. Importar `useEffect`, `useRef`, `useState` e `audioService`.
2. Criar `const [waving, setWaving] = useState(false)`, um timer de `ReturnType<typeof setTimeout> | null` e limpeza no unmount.
3. Criar `waveAtAvatar()` com a mesma duração de 600 ms usada em `SceneView`; tocar `audioService.play('click')`, ativar a classe e reiniciar o timer.
4. Tornar o botão do avatar acessível com `aria-label={t('a11y.heroWave')}` e handlers de clique/Enter/Espaço.
5. Passar `mood={waving ? 'waving' : 'happy'}` para o mascote do cabeçalho e `className={waving ? 'avatar--waving' : undefined}` para o avatar.
6. Adicionar um `Button variant="secondary" size="sm"` com `onClick={onEditCharacter}` e o texto já traduzido por `t('home.changeCharacter')`.

- [ ] **Step 4: Escrever o teste da missão**

Criar `src/art/SceneView.test.tsx` com `// @vitest-environment jsdom`, `I18nProvider locale="en-US"`, uma paleta literal e `scene="bridge"`, `decor={['tree', 'flower']}`, `progress={0}`, `avatar={createDefaultState('en-US').player.avatar}`, `mascotId="bloco"`. O caso deve ativar o grupo `role="button"` e confirmar a classe temporária:

```tsx
it('faz o heroi acenar e coloca o companheiro em waving', async () => {
  const user = userEvent.setup();
  const { container } = render(
    <I18nProvider locale="en-US">
      <SceneView
        scene="bridge"
        palette={palette}
        decor={['tree', 'flower']}
        progress={0}
        avatar={createDefaultState('en-US').player.avatar}
        mascotId="bloco"
      />
    </I18nProvider>,
  );

  await user.click(screen.getByRole('button', { name: 'Tap to wave' }));
  expect(container.querySelector('.scene__hero--waving')).toBeInTheDocument();
  expect(container.querySelector('.mascot--waving')).toBeInTheDocument();
});
```

- [ ] **Step 5: Corrigir a prioridade do humor em SceneView**

Manter a lógica de bloqueio durante `celebrating` e trocar a prop do mascote para a prioridade explícita:

```tsx
<Mascot
  palette={companion.colors}
  kind={companion.kind}
  mood={celebrating ? 'cheering' : waving ? 'waving' : 'happy'}
  size={COMPANION_SIZE}
/>
```

O grupo acessível do herói continua com `role="button"`, `tabIndex={0}`, `a11y.heroWave`, clique e Enter/Espaço. O estado `reducedMotion` deve impedir apenas as classes animadas, sem remover a interação.

- [ ] **Step 6: Refinar os estilos do avatar e da Home**

Em `global.css`, adicionar `.avatar--waving` e os estilos do novo grupo `.home__avatar-group`, mantendo o botão do avatar sem aparência de botão padrão. A edição deve ficar visível como um botão amarelo abaixo do avatar. A animação deve ser curta e reiniciável:

```css
.avatar--waving {
  animation: avatar-wave 0.65s ease-in-out;
  transform-origin: 50% 100%;
}

@keyframes avatar-wave {
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

.home__avatar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.home__avatar--waving {
  transform: translateY(-2px);
}
```

Aplicar a classe `home__avatar--waving` no botão enquanto `waving` estiver ativo e preservar o foco visível global.

- [ ] **Step 7: Executar os testes de interação**

Run: `npm test -- src/screens/HomeScreen.test.tsx src/art/SceneView.test.tsx`

Expected: PASS; tocar no avatar não abre o editor, o botão separado abre o editor, e Home/Missão exibem `.mascot--waving` durante a resposta.

- [ ] **Step 8: Commitar somente os arquivos desta tarefa**

```bash
git add src/screens/HomeScreen.tsx src/art/SceneView.tsx src/screens/HomeScreen.test.tsx src/art/SceneView.test.tsx src/styles/global.css
git commit --only src/screens/HomeScreen.tsx src/art/SceneView.tsx src/screens/HomeScreen.test.tsx src/art/SceneView.test.tsx src/styles/global.css -m "feat: let avatar wave on touch"
```

---

### Task 3: Aplicar a hierarquia amarela aos controles de ação

**Files:**

- Modify: `src/styles/global.css`
- Modify: `src/ui/SoundToggle.tsx` only if a semantic class or pressed-state hook is needed; otherwise CSS-only.
- Create: `src/ui/Button.test.tsx`

**Interfaces:**

- Consumes: variantes `primary`, `secondary`, `ghost`, `danger` de `Button` e classe `.sound-toggle` existentes.
- Produces: todas as ações mantêm as mesmas props e semântica, mas usam amarelos com contraste e feedback de pressionamento consistentes.

- [ ] **Step 1: Registrar as cores esperadas no teste de estilo existente ou em uma verificação de componente**

Como Vitest não calcula CSS externo no ambiente atual, manter a verificação visual e adicionar um teste de contrato de classes em `src/ui/Button.test.tsx`:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button variants', () => {
  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'preserva a classe %s',
    (variant) => {
      render(<Button variant={variant}>Ação</Button>);
      expect(screen.getByRole('button', { name: 'Ação' })).toHaveClass(`btn--${variant}`);
    },
  );
});
```

- [ ] **Step 2: Executar o teste de contrato**

Run: `npm test -- src/ui/Button.test.tsx`

Expected: PASS antes da alteração; o teste fixa que a mudança é visual e não quebra a API das variantes.

- [ ] **Step 3: Trocar somente os tokens visuais das variantes**

Em `global.css`, manter os nomes das classes e configurar:

```css
.btn--primary {
  background: #ffd23f;
  color: #5b4300;
}

.btn--secondary {
  background: #fff1a8;
  color: #5b4300;
  border: 2px solid #e4b91f;
  box-shadow: 0 3px 0 #c69a0b;
}

.btn--ghost {
  background: #fff8d6;
  color: #6b4d00;
  border: 2px solid #f1d56a;
  box-shadow: 0 2px 0 #d6b746;
}

.btn--danger {
  background: #e6ad25;
  color: #3d2b00;
  border: 2px solid #b98208;
  box-shadow: 0 3px 0 #9b6b00;
}

.sound-toggle {
  background: #ffd23f;
  color: #5b4300;
  border: 2px solid #e4b91f;
}
```

Não alterar os estados de cards/ilhas e preservar `:disabled`, `:active` e `:focus-visible`.

- [ ] **Step 4: Executar teste, typecheck e checagem de diff**

Run: `npm test -- src/ui/Button.test.tsx`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `git diff --check`

Expected: nenhuma saída.

- [ ] **Step 5: Commitar o contrato e o estilo amarelo**

```bash
git add src/ui/Button.test.tsx src/styles/global.css
git commit --only src/ui/Button.test.tsx src/styles/global.css -m "feat: unify action buttons in yellow"
```

---

### Task 4: Substituir o confete por papel picado e verificar a comemoração

**Files:**

- Modify: `src/screens/IslandCompleteScreen.tsx`
- Modify: `src/styles/global.css`
- Create: `src/screens/IslandCompleteScreen.test.tsx`

**Interfaces:**

- Consumes: `island.palette`, `Mascot mood="cheering"`, `IslandBadge` e `Button` existentes.
- Produces: a tela de conclusão renderiza uma coleção determinística de peças `.confetti` com classes de forma e variáveis CSS; o mascote continua `cheering`.

- [ ] **Step 1: Escrever o teste de quantidade, formas, cores e humor**

Criar o teste jsdom com um estado padrão marcado como missão concluída para a tabuada 2, `unlockedTable={3}`, `onBackToMap={vi.fn()}` e `I18nProvider locale="en-US"`. O caso deve verificar pelo menos 24 peças, três formas e que a tela usa `.mascot--cheering`:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultState } from '../domain/defaultState';
import { I18nProvider } from '../i18n/I18nProvider';
import { IslandCompleteScreen } from './IslandCompleteScreen';

it('renderiza papel picado colorido na conclusão da ilha', () => {
  const state = createDefaultState('en-US');
  const { container } = render(
    <I18nProvider locale="en-US">
      <IslandCompleteScreen state={state} table={2} unlockedTable={3} onBackToMap={vi.fn()} />
    </I18nProvider>,
  );

  const pieces = Array.from(container.querySelectorAll('.confetti'));
  expect(pieces.length).toBeGreaterThanOrEqual(24);
  expect(container.querySelector('.confetti--strip')).toBeInTheDocument();
  expect(container.querySelector('.confetti--dot')).toBeInTheDocument();
  expect(container.querySelector('.confetti--square')).toBeInTheDocument();
  expect(container.querySelector('.mascot--cheering')).toBeInTheDocument();
  expect(pieces.every((piece) => piece.getAttribute('aria-hidden') === 'true')).toBe(true);
});
```

- [ ] **Step 2: Executar o teste para confirmar a falha inicial**

Run: `npm test -- src/screens/IslandCompleteScreen.test.tsx`

Expected: FAIL porque existem apenas 14 peças sem classes de forma e nem todas têm `aria-hidden` individual.

- [ ] **Step 3: Criar a lista determinística de peças na tela de conclusão**

Em `IslandCompleteScreen.tsx`, declarar fora do componente uma lista com pelo menos 24 itens contendo `shape`, `left`, `delay`, `duration`, `rotation` e índice de cor. Usar as cores `[island.palette.accent, island.palette.accentSoft, '#ffd23f', '#ff8fa3', '#7bc9ff', '#ffffff']` e aplicar as variáveis CSS no `style` de cada `span`:

```tsx
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => ({
  shape: (['strip', 'dot', 'square'] as const)[index % 3],
  left: `${(index * 13 + 5) % 100}%`,
  delay: `${(index % 9) * 0.17}s`,
  duration: `${2.6 + (index % 5) * 0.24}s`,
  rotation: `${(index * 37) % 180}deg`,
  colorIndex: index % 6,
}));
```

O JSX deve usar `key={index}`, `aria-hidden="true"`, `className={`confetti confetti--${piece.shape}``, `left`, `background`, `--confetti-delay`, `--confetti-duration` e `--confetti-rotation`. Como as variáveis customizadas não fazem parte de `CSSProperties`, importar `type CSSProperties` de React e criar o estilo assim:

```tsx
const confettiStyle = {
  left: piece.left,
  background: confettiColors[piece.colorIndex],
  '--confetti-delay': piece.delay,
  '--confetti-duration': piece.duration,
  '--confetti-rotation': piece.rotation,
} as CSSProperties;
```

O array é fixo e somente a cor dependente da ilha é calculada durante o render.

- [ ] **Step 4: Implementar as formas e a queda no CSS**

Substituir o tamanho único atual por estilos que diferenciem tiras, pontos e quadrados e usem as variáveis por peça:

```css
.confetti {
  position: absolute;
  top: -1rem;
  animation: confetti-fall var(--confetti-duration) linear infinite;
  animation-delay: var(--confetti-delay);
  transform: rotate(var(--confetti-rotation));
}

.confetti--strip {
  width: 0.45rem;
  height: 1.25rem;
  border-radius: 0.1rem;
}
.confetti--dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
}
.confetti--square {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 0.15rem;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-1rem) rotate(var(--confetti-rotation));
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(calc(var(--confetti-rotation) + 360deg));
    opacity: 0.55;
  }
}
```

Manter `pointer-events: none` no contêiner e adicionar `z-index` atrás do conteúdo principal, se necessário, para que títulos e botões continuem fáceis de ler e tocar.

- [ ] **Step 5: Executar o teste da comemoração**

Run: `npm test -- src/screens/IslandCompleteScreen.test.tsx`

Expected: PASS com 28 peças, as três formas, atributos decorativos e mascote em `cheering`.

- [ ] **Step 6: Commitar somente a celebração**

```bash
git add src/screens/IslandCompleteScreen.tsx src/screens/IslandCompleteScreen.test.tsx src/styles/global.css
git commit --only src/screens/IslandCompleteScreen.tsx src/screens/IslandCompleteScreen.test.tsx src/styles/global.css -m "feat: celebrate island completion with confetti"
```

---

### Task 5: Verificação integrada e revisão visual

**Files:**

- Modify: nenhum arquivo de implementação; somente corrigir os arquivos das tarefas anteriores se uma verificação reproduzir uma falha desta funcionalidade.

**Interfaces:**

- Consumes: todos os componentes e testes das tarefas 1–4.
- Produces: evidência de que a interação, a comemoração e os estilos compilam sem alterar o fluxo do jogo.

- [ ] **Step 1: Rodar a suíte completa**

Run: `npm test`

Expected: todos os testes passam, incluindo as novas suítes de `Mascot`, `HomeScreen`, `SceneView`, `Button` e `IslandCompleteScreen`.

- [ ] **Step 2: Rodar o typecheck e o build**

Run: `npm run typecheck`

Expected: PASS sem erros TypeScript.

Run: `npm run build`

Expected: PASS com o bundle de produção gerado pelo Vite.

- [ ] **Step 3: Rodar lint e separar avisos preexistentes**

Run: `npm run lint`

Expected: nenhuma falha nova nos arquivos desta tarefa; se o aviso já conhecido em `src/screens/LevelScreen.tsx:81` permanecer, registrá-lo como preexistente em vez de modificar esse arquivo fora do escopo.

- [ ] **Step 4: Revisar visualmente os quatro fluxos**

Usar o servidor local existente e conferir:

1. Home: botões amarelos, avatar acenando ao toque, “Change character” separado e mascote feliz/flutuando.
2. Missão: avatar com aceno, mascote em `waving`, foco visível e nenhuma navegação acidental.
3. Conclusão de missão: mascote `cheering` sem quebrar a tela de resultado.
4. Conclusão de ilha: braços/brilhos do mascote e papel picado com formas e cores variadas; botão de retorno amarelo e legível.

- [ ] **Step 5: Confirmar o diff final e preservar alterações do usuário**

Run: `git status --short; git diff --check; git log -5 --oneline`

Expected: os commits da funcionalidade contêm apenas os caminhos planejados; arquivos modificados previamente pelo usuário continuam fora desses commits.
