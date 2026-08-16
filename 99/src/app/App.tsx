import { Suspense, lazy } from 'react';
import { Hud } from './Hud';
import { OutcomeOverlay } from './OutcomeOverlay';
import { TouchControls } from './TouchControls';
import { useIsTouchDevice, useKeyboardBindings } from '../shared/input';
import './loading.css';

/**
 * O canvas entra por importacao tardia.
 *
 * `three` + o WASM do Rapier passam de 3 MB, e 2 MB disso e o WASM que o
 * `rapier3d-compat` embute como base64 no proprio JS — nao da para evitar sem
 * trocar de pacote. O que da para evitar e a tela branca: separando o canvas em
 * outro chunk, o HTML e o CSS pintam a tela de carregamento na hora, enquanto o
 * motor baixa em segundo plano. Isso pesa ainda mais no celular, em rede movel.
 */
const GameCanvas = lazy(() =>
  import('./GameCanvas').then((module) => ({ default: module.GameCanvas })),
);

function LoadingScreen() {
  return (
    <div className="loading" role="status">
      <div className="loading__sun" aria-hidden="true" />
      <p className="loading__title">Sobrevivência da Tabuada</p>
      <p className="loading__text">Preparando a ilha…</p>
    </div>
  );
}

/**
 * Raiz de composicao: o canvas 3D e as camadas de DOM por cima.
 *
 * O HUD fica fora do `Canvas` de proposito — texto em DOM e mais nitido,
 * acessivel e barato que texto renderizado em textura.
 */
export function App() {
  const isTouch = useIsTouchDevice();

  // Ponte teclado -> acao, montada uma unica vez. As slices escutam a acao, nao
  // a tecla, entao o toque aciona exatamente o mesmo caminho.
  useKeyboardBindings();

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <GameCanvas isTouch={isTouch} />
      </Suspense>
      <Hud isTouch={isTouch} />
      {isTouch && <TouchControls />}
      <OutcomeOverlay />
    </>
  );
}
