import type { ReactNode } from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Physics } from '@react-three/rapier';
import { KeyboardBridge } from './KeyboardBridge';

type SceneRenderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;

/**
 * Monta uma cena R3F com fisica, sem WebGL e sem navegador.
 *
 * Dois detalhes tornam este helper necessario:
 *
 * 1. O Rapier inicializa o WASM de forma assincrona, entao os filhos de
 *    `<Physics>` so aparecem alguns ticks depois da montagem. `create()` sozinho
 *    devolve uma cena ainda vazia — por isso o helper aguarda a arvore aparecer.
 *
 *    **Aparecer na arvore nao e o mesmo que estar pronto.** Um `RigidBody`
 *    renderiza os filhos antes de preencher a propria ref, entao um teste que
 *    dependa do corpo precisa esperar mais — use `advanceUntil`.
 * 2. `paused` mantem o solver parado: estes testes verificam a *montagem* do
 *    grafo, nao a simulacao. Testar o solver seria testar o Rapier, nao o jogo.
 */
export async function renderScene(children: ReactNode): Promise<SceneRenderer> {
  const renderer = await ReactThreeTestRenderer.create(
    <Physics paused>
      {/* A ponte de teclado mora na raiz do app; um teste que monta so uma slice
          precisa dela para que `keydown` continue virando acao do jogo. */}
      <KeyboardBridge />
      {children}
    </Physics>,
  );

  /**
   * Teto de 1,5 s.
   *
   * Nao aumentar sem medir: uma cena legitimamente vazia na montagem — um
   * `BuildingView` sem construcoes, por exemplo — nunca sai pelo `break` e paga
   * o teto inteiro. Com 5 s, esses testes passaram a estourar o timeout padrao
   * do Vitest. A espera nao e de graca; quem precisa de mais deve usar
   * `advanceUntil`, que sai assim que a condicao vale.
   */
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (renderer.scene.allChildren.length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return renderer;
}

/**
 * Avanca quadros ate a condicao valer, em vez de chutar um numero de quadros.
 *
 * `renderScene` espera a arvore aparecer, mas isso acontece **antes** de o corpo
 * do Rapier existir: o `RigidBody` renderiza os filhos e so depois preenche a
 * ref, quando o WASM termina de inicializar. Um teste que confere a posicao
 * publicada logo apos `advanceFrames(2)` esta apostando numa corrida — e ela
 * era ganha nesta maquina e perdida no CI, onde `playerTransform.y` chegava a
 * asserçao ainda em 0.
 *
 * Aqui a espera e explicita: avanca ate a condicao valer ou ate o teto, e nesse
 * caso deixa o proprio teste falhar com a asserçao dele, que diz muito mais que
 * um "timeout".
 */
export async function advanceUntil(
  renderer: SceneRenderer,
  condition: () => boolean,
  { maxFrames = 240, delta = 1 / 60 }: { maxFrames?: number; delta?: number } = {},
): Promise<void> {
  for (let frame = 0; frame < maxFrames; frame += 1) {
    if (condition()) return;
    await renderer.advanceFrames(1, delta);
    // Cede o laco de eventos: a inicializacao do WASM do Rapier e assincrona e
    // nao progride se o teste so girar quadros sem soltar a thread.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
