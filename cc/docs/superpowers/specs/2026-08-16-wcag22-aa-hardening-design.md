# Especificação: reforço de acessibilidade WCAG 2.2 AA

## Objetivo

Reduzir os riscos de acessibilidade encontrados nos fluxos de avatar, missão e confirmação de ações, usando WCAG 2.2 nível AA como baseline, sem alterar regras de jogo, conteúdo ou layout geral.

## Critérios de referência

- WCAG 2.2 [1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum): texto de interface deve manter contraste mínimo de 4,5:1 nos casos aplicáveis.
- WCAG 2.2 [1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast): informações visuais necessárias para identificar controles e estados devem manter contraste mínimo de 3:1.
- WCAG 2.2 [2.4.3 Focus Order](https://www.w3.org/TR/WCAG22/#focus-order) e [2.4.7 Focus Visible](https://www.w3.org/TR/WCAG22/#focus-visible): o foco deve seguir uma ordem compreensível e permanecer visível.
- WCAG 2.2 [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum): o controle focado não pode ficar inteiramente oculto por conteúdo criado pelo autor.
- WCAG 2.2 [2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum): alvos de ponteiro devem ter pelo menos 24 por 24 CSS pixels, salvo exceções previstas no critério.
- WAI-ARIA [img role](https://www.w3.org/TR/wai-aria/#img): `img` tem filhos apresentacionais; o avatar interativo não deve ficar dentro de uma semântica que o oculte da árvore de acessibilidade.
- WAI-ARIA APG [Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): o foco entra no modal, permanece dentro dele durante Tab/Shift+Tab e retorna ao controle que o abriu quando o modal fecha.

## Escopo

### Cena e avatar interativo

O SVG da missão deixa de expor a cena inteira como `role="img"` quando contém o avatar acionável. A cena passa a ser um agrupamento nomeado pela descrição de progresso existente, mantendo o grupo interno do herói com `role="button"`, `tabIndex={0}` e `aria-label={t('a11y.heroWave')}`.

O comportamento de clique, toque, Enter, Espaço e aceno permanece igual. A mudança é semântica: leitores de tela devem encontrar a cena e, separadamente, o controle de aceno.

### Diálogo de confirmação

`ConfirmDialog` continua usando `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` e `aria-describedby`. Ao abrir:

1. O elemento atualmente focado é guardado.
2. O foco vai para o botão de cancelamento, que é a opção segura.
3. Tab do último controle retorna ao primeiro; Shift+Tab do primeiro retorna ao último.
4. Escape chama `onCancel`.

Ao fechar, o foco retorna ao elemento que abriu o diálogo, desde que ele ainda esteja conectado e possa receber foco. Se o elemento não existir mais, o fechamento não deve lançar erro nem criar um foco artificial.

O clique no backdrop continua cancelando e o clique dentro do diálogo continua impedindo propagação. Não será adicionado um gerenciador global de foco para outras telas.

### Indicador de foco e contraste

Adicionar um token de foco escuro, com halo claro, para funcionar sobre o fundo azul da aplicação e sobre os botões amarelos. Aplicar o mesmo tratamento ao controle visual de `ToggleRow`, evitando que ele mantenha o anel azul de baixo contraste.

As cores textuais dos botões amarelos existentes já foram escolhidas com texto escuro; não serão trocadas nesta etapa. A verificação deve confirmar que nenhum ajuste de foco reduz a legibilidade do conteúdo.

### Movimento e tamanho dos alvos

Manter as regras existentes de `prefers-reduced-motion` e `data-reduced-motion="on"`. A correção não adiciona animação nova, não altera o tempo do aceno e não remove feedback essencial.

Manter os tamanhos atuais de botões, opções, ilhas, SoundToggle e avatar. A revisão deve confirmar que os novos controles de teclado não criam alvos menores que 24 por 24 pixels.

## Fora do escopo

- Auditoria completa de todas as telas com uma ferramenta externa.
- Adição de dependências de acessibilidade ou de automação visual.
- Refatoração para o elemento HTML `<dialog>`.
- Mudança de traduções, regras de progressão, pontuação, persistência ou áudio.
- Correção do erro de lint preexistente em `src/screens/LevelScreen.tsx:81`.

## Testes

- `SceneView` deve continuar expondo um botão acessível chamado pela chave `a11y.heroWave` e a cena deve deixar de usar `role="img"` como contêiner do botão.
- `ConfirmDialog` deve receber foco ao abrir, circular foco com Tab e Shift+Tab, fechar com Escape e restaurar o foco ao gatilho.
- Os testes existentes de Home, missão e comemoração devem continuar passando.
- Executar a suíte completa, typecheck, build, diff check e lint; qualquer erro restante deve ser separado do escopo desta especificação.
