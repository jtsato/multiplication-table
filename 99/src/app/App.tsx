import { useGameStore } from './store';
import { LanguagePicker } from './LanguagePicker';
import { Suspense, lazy, useEffect } from 'react';
import { DaySummary } from './DaySummary';
import { Hud } from './Hud';
import { TouchControls } from './TouchControls';
import { useIsTouchDevice, useKeyboardBindings } from '../shared/input';
import { AvatarPanel } from '../slices/avatar';
import { BedPanel, OrdersPanel, WallChart } from '../slices/home';
import { loadGame, startAutoSave } from '../slices/save';
import { ShopPanel } from '../slices/economy';
import { AnimalBookPanel } from '../slices/wildlife';
import { ChallengePanel } from '../slices/math';
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
  const t = useGameStore((state) => state.text).strings;

  return (
    <div className="loading" role="status">
      <div className="loading__sun" aria-hidden="true" />
      {/* O nome não traduz e nunca entra num arquivo de locale — há teste que
          falha se entrar. A tagline e o resto, sim. */}
      <p className="loading__title">Numi 99</p>
      <p className="loading__tagline">{t.tagline}</p>
      <p className="loading__text">{t.loading}</p>
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

  /**
   * Carrega o progresso e liga a gravacao automatica.
   *
   * Antes do canvas de proposito: o mundo se monta com as moedas, os itens e a
   * aparencia ja no lugar, sem a crianca ver o personagem trocar de roupa
   * sozinho um segundo depois de entrar.
   */
  useEffect(() => {
    loadGame();
    return startAutoSave();
  }, []);

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <GameCanvas isTouch={isTouch} />
      </Suspense>
      <Hud isTouch={isTouch} />
      <LanguagePicker />
      <ChallengePanel />
      <ShopPanel />
      <AvatarPanel />
      <WallChart />
      <OrdersPanel />
      <BedPanel />
      <AnimalBookPanel />
      <DaySummary />
      {isTouch && <TouchControls />}
    </>
  );
}
