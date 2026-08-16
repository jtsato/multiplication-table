import type { ReactNode } from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Physics } from '@react-three/rapier';

type SceneRenderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;

/**
 * Monta uma cena R3F com fisica, sem WebGL e sem navegador.
 *
 * Dois detalhes tornam este helper necessario:
 *
 * 1. O Rapier inicializa o WASM de forma assincrona, entao os filhos de
 *    `<Physics>` so aparecem alguns ticks depois da montagem. `create()` sozinho
 *    devolve uma cena ainda vazia — por isso o helper aguarda a arvore aparecer.
 * 2. `paused` mantem o solver parado: estes testes verificam a *montagem* do
 *    grafo, nao a simulacao. Testar o solver seria testar o Rapier, nao o jogo.
 */
export async function renderScene(children: ReactNode): Promise<SceneRenderer> {
  const renderer = await ReactThreeTestRenderer.create(<Physics paused>{children}</Physics>);

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (renderer.scene.allChildren.length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return renderer;
}
