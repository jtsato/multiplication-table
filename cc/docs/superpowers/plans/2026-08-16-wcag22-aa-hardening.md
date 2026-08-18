# WCAG 2.2 AA Accessibility Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os riscos de acessibilidade identificados no avatar interativo, no diálogo de confirmação e nos indicadores de foco para aproximar o jogo da conformidade WCAG 2.2 AA.

**Architecture:** A cena continuará sendo um SVG, mas será exposta como grupo nomeado para que o avatar interno mantenha seu próprio papel de botão. O modal receberá gerenciamento local de foco, com ciclo de Tab e restauração ao gatilho, sem dependências externas; o CSS usará um token de foco escuro compartilhado por controles HTML e SVG.

**Tech Stack:** React 19, TypeScript, SVG/CSS existente, Vitest, Testing Library e `userEvent`.

## Global Constraints

- Usar WCAG 2.2 nível AA como baseline.
- Não alterar regras de jogo, conteúdo, traduções, progressão, pontuação, persistência ou áudio.
- Não adicionar dependências de acessibilidade ou automação visual.
- Manter as regras existentes de `prefers-reduced-motion` e `data-reduced-motion="on"`.
- Manter os tamanhos atuais de botões, opções, ilhas, SoundToggle e avatar.
- Não corrigir o erro de lint preexistente em `src/screens/LevelScreen.tsx:81`.
- Preservar alterações preexistentes no worktree; commits devem mencionar apenas os arquivos da funcionalidade.

---

### Task 1: Tornar o diálogo de confirmação modal acessível ao teclado

**Files:**

- Modify: `src/ui/ConfirmDialog.tsx`
- Create: `src/ui/ConfirmDialog.test.tsx`

**Interfaces:**

- Consumes: `ConfirmDialogProps`, `Button` com suporte a `ref`, `role="alertdialog"` e callbacks `onConfirm`/`onCancel` existentes.
- Produces: ao abrir, o foco entra no botão de cancelamento; Tab e Shift+Tab circulam pelos controles do diálogo; Escape cancela; ao fechar, o foco retorna ao elemento que estava ativo antes da abertura.

- [ ] **Step 1: Escrever os testes falhando do ciclo de foco**

Criar `src/ui/ConfirmDialog.test.tsx` com ambiente jsdom e um harness controlado por estado:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';

function Harness({ onConfirm = vi.fn() }: { onConfirm?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir diálogo
      </button>
      <ConfirmDialog
        open={open}
        title="Apagar progresso"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

describe('ConfirmDialog keyboard accessibility', () => {
  it('mantém o foco dentro do diálogo e restaura o gatilho ao fechar', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Abrir diálogo' });

    await user.click(trigger);
    const cancel = screen.getByRole('button', { name: 'Cancelar' });
    const confirm = screen.getByRole('button', { name: 'Apagar' });
    expect(cancel).toHaveFocus();

    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
```

O teste deve falhar antes da implementação porque o Tab atual sai do diálogo e o foco não é restaurado.

- [ ] **Step 2: Executar o teste para confirmar a falha**

Run: `npm test -- src/ui/ConfirmDialog.test.tsx`

Expected: FAIL em pelo menos uma asserção de foco, sem erro de importação ou de montagem do componente.

- [ ] **Step 3: Implementar o foco modal sem dependência externa**

Em `ConfirmDialog.tsx`, importar `useEffect`, `useRef` e `type KeyboardEvent` de `react`:

1. Criar `dialogRef` para o contêiner `role="alertdialog"` e `previousFocusRef` para o elemento focado antes da abertura.
2. Usar um seletor local de elementos focáveis: `button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`.
3. No `useEffect` executado quando `open` fica verdadeiro, guardar `document.activeElement`, focar `cancelRef.current` e, no cleanup, remover listeners e devolver o foco ao elemento anterior apenas se ele ainda estiver conectado e for um `HTMLElement`.
4. Tratar `Tab` no próprio contêiner do diálogo: quando o foco estiver no último elemento e Tab for pressionado, focar o primeiro; quando estiver no primeiro e Shift+Tab for pressionado, focar o último; chamar `preventDefault()` nos dois casos.
5. Tratar `Escape` no mesmo handler chamando `onCancel()` e `preventDefault()`.
6. Manter `aria-modal`, `aria-labelledby`, `aria-describedby`, cancelamento pelo backdrop e `stopPropagation()` interno.

O núcleo do handler deve seguir esta forma, usando `dialogRef.current` como fonte dos elementos:

```tsx
const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    onCancel();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = Array.from(
    dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};
```

- [ ] **Step 4: Executar novamente o teste do diálogo**

Run: `npm test -- src/ui/ConfirmDialog.test.tsx`

Expected: PASS com foco inicial no cancelamento, ciclo nos dois sentidos, fechamento por Escape e restauração do foco no gatilho.

- [ ] **Step 5: Commitar somente o diálogo e seu teste**

```bash
git add src/ui/ConfirmDialog.tsx src/ui/ConfirmDialog.test.tsx
git commit --only src/ui/ConfirmDialog.tsx src/ui/ConfirmDialog.test.tsx -m "feat: trap focus in confirmation dialogs"
```

---

### Task 2: Expor corretamente a cena e o botão de aceno

**Files:**

- Modify: `src/art/SceneView.tsx`
- Modify: `src/art/SceneView.test.tsx`

**Interfaces:**

- Consumes: `SceneViewProps.ariaLabel`, grupo interno do herói com `role="button"` e chave `a11y.heroWave` existentes.
- Produces: o SVG da cena usa `role="group"` com sua descrição, e o botão do herói continua sendo encontrado separadamente por leitores de tela e testes de acessibilidade.

- [ ] **Step 1: Escrever a asserção de semântica que falha atualmente**

Acrescentar ao teste `src/art/SceneView.test.tsx` um caso que renderize a cena com `ariaLabel="Progresso da construção: 0 por cento"` e confirme que o grupo nomeado existe, que a cena não é um `img` e que o botão de aceno segue exposto:

```tsx
it('separa a semântica da cena do botão do herói', () => {
  render(
    <I18nProvider locale="en-US">
      <SceneView
        scene="bridge"
        palette={palette}
        decor={['tree', 'flower']}
        progress={0}
        avatar={createDefaultState('en-US').player.avatar}
        mascotId="bloco"
        ariaLabel="Progresso da construção: 0 por cento"
      />
    </I18nProvider>,
  );

  expect(
    screen.getByRole('group', { name: 'Progresso da construção: 0 por cento' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tap to wave' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Executar o teste para confirmar a falha**

Run: `npm test -- src/art/SceneView.test.tsx`

Expected: FAIL porque o SVG atual expõe `role="img"` em vez de `role="group"`.

- [ ] **Step 3: Trocar somente o papel semântico do SVG da cena**

Em `SceneView.tsx`, trocar o início do SVG para:

```tsx
<svg
  className="scene"
  viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
  preserveAspectRatio="xMidYMax slice"
  shapeRendering="crispEdges"
  role="group"
  aria-label={ariaLabel}
>
```

Manter o `role="button"`, `tabIndex={0}`, `aria-label`, `onClick` e `onKeyDown` do grupo do herói. Não usar `aria-hidden` no SVG pai, pois isso ocultaria também o controle de aceno.

- [ ] **Step 4: Executar os testes da cena**

Run: `npm test -- src/art/SceneView.test.tsx`

Expected: PASS nos testes de aceno e na nova asserção de semântica.

- [ ] **Step 5: Commitar a correção semântica da cena**

```bash
git add src/art/SceneView.tsx src/art/SceneView.test.tsx
git commit --only src/art/SceneView.tsx src/art/SceneView.test.tsx -m "fix: expose scene and hero semantics"
```

---

### Task 3: Melhorar o indicador de foco para fundos claros e amarelos

**Files:**

- Modify: `src/styles/global.css`

**Interfaces:**

- Consumes: `:focus-visible` global e seletor de foco de `ToggleRow` existentes.
- Produces: um token `--color-focus` compartilhado, com indicador visível sobre o fundo da aplicação, botões amarelos e grupo SVG do herói.

- [ ] **Step 1: Registrar a combinação de cores a ser corrigida**

Usar a verificação objetiva abaixo como referência antes da alteração. O anel atual `#1c7fd6` tem contraste aproximado de 2,88:1 sobre `#ffd23f` e 2,05:1 sobre `#e6ad25`, abaixo do patamar de 3:1 usado para informação visual de controles. O novo token `#172b4d` deve ser usado porque apresenta aproximadamente 9,77:1 e 6,96:1 nos mesmos pares.

```text
focus atual #1c7fd6 / primary #ffd23f: 2.88:1
focus atual #1c7fd6 / danger #e6ad25: 2.05:1
focus novo  #172b4d / primary #ffd23f: 9.77:1
focus novo  #172b4d / danger #e6ad25: 6.96:1
```

- [ ] **Step 2: Aplicar o token e os estilos de foco**

Em `:root`, adicionar `--color-focus: #172b4d`. Alterar o seletor global e o foco do toggle para usar o token:

```css
:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.toggle-row__input:focus-visible + .toggle-row__control {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
```

Adicionar um tratamento específico ao grupo SVG focável, pois `outline` pode não ser desenhado de forma consistente em todos os navegadores sobre elementos SVG:

```css
.scene__hero:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 4px;
  filter: drop-shadow(0 0 0.15rem #ffffff) drop-shadow(0 0 0.35rem var(--color-focus));
}
```

Não remover o estilo de foco global nem trocar o tamanho dos controles.

- [ ] **Step 3: Verificar contraste, movimento e diff**

Run: `node -e "const p=[['#172b4d','#ffd23f'],['#172b4d','#e6ad25'],['#172b4d','#eaf6ff']];const L=h=>{const a=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]};for(const [a,b] of p){const x=L(a),y=L(b);console.log(((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2))}"`

Expected: três valores acima de `3.00`.

Run: `git diff --check`

Expected: nenhuma saída.

- [ ] **Step 4: Commitar o indicador de foco**

```bash
git add src/styles/global.css
git commit --only src/styles/global.css -m "fix: strengthen keyboard focus contrast"
```

---

### Task 4: Verificação integrada WCAG

**Files:**

- Modify: nenhum arquivo inicialmente; corrigir somente os arquivos das tarefas anteriores se uma verificação reproduzir uma falha desta funcionalidade.

**Interfaces:**

- Consumes: testes e correções das tarefas 1–3.
- Produces: evidência de que teclado, semântica, foco, movimento existente e fluxo do jogo continuam funcionando juntos.

- [ ] **Step 1: Rodar os testes focados**

Run: `npm test -- src/ui/ConfirmDialog.test.tsx src/art/SceneView.test.tsx src/screens/HomeScreen.test.tsx`

Expected: PASS nos testes do modal, cena e interação do avatar.

- [ ] **Step 2: Rodar a suíte completa**

Run: `npm test`

Expected: todos os testes passam, incluindo os testes existentes de progressão, persistência, mapa, missão e comemoração.

- [ ] **Step 3: Rodar typecheck e build**

Run: `npm run typecheck`

Expected: PASS sem erros TypeScript.

Run: `npm run build`

Expected: PASS com o bundle Vite gerado.

- [ ] **Step 4: Rodar diff check e lint**

Run: `git diff --check`

Expected: nenhuma saída.

Run: `npm run lint`

Expected: nenhum erro novo nos arquivos WCAG; o erro preexistente em `src/screens/LevelScreen.tsx:81` e os warnings preexistentes, se permanecerem, devem ser registrados sem alterar esse arquivo fora do escopo.

- [ ] **Step 5: Confirmar o estado Git**

Run: `git status --short; git log -5 --oneline`

Expected: os commits desta tarefa contêm apenas `ConfirmDialog`, `SceneView`, `global.css` e seus testes; alterações preexistentes não relacionadas permanecem fora deles.
