import { useGameStore } from './store';
import { Suspense, lazy, useEffect } from 'react';
import { Hud } from './Hud';
import { TouchControls } from './TouchControls';
import { useIsTouchDevice, useKeyboardBindings } from '../shared/input';
import { unlockAudio } from '../shared/audio';
import { loadGame, startAutoSave } from '../slices/save';
import { DailyBanner } from '../slices/daily';
import { SettingsPanel, SettingsToggle } from '../slices/settings';
import { Minimapa } from '../slices/navigation';
import { FpsMeter } from './FpsMeter';
import './accessibility.css';
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

/**
 * Painéis DOM que só aparecem quando o jogador abre alguma coisa.
 *
 * Eles ficavam no chunk inicial do App; agora cada um vira um chunk pequeno que
 * só baixa no momento do uso — loja, espelho, mural, encomendas, cama, caderneta,
 * resumo do dia e painel de desafio. O HUD e os controles continuam estáticos
 * porque são visíveis desde o primeiro segundo.
 */
const DaySummary = lazy(() => import('./DaySummary').then((module) => ({ default: module.DaySummary })));
const AvatarPanel = lazy(() =>
  import('../slices/avatar/AvatarPanel').then((module) => ({ default: module.AvatarPanel })),
);
const BedPanel = lazy(() => import('../slices/home/BedPanel').then((module) => ({ default: module.BedPanel })));
const OrdersPanel = lazy(() =>
  import('../slices/home/OrdersPanel').then((module) => ({ default: module.OrdersPanel })),
);
const WallChart = lazy(() =>
  import('../slices/home/WallChart').then((module) => ({ default: module.WallChart })),
);
const ShopPanel = lazy(() =>
  import('../slices/economy/ShopPanel').then((module) => ({ default: module.ShopPanel })),
);
const AnimalBookPanel = lazy(() =>
  import('../slices/wildlife/AnimalBookPanel').then((module) => ({ default: module.AnimalBookPanel })),
);
const ChallengePanel = lazy(() =>
  import('../slices/math/ChallengePanel').then((module) => ({ default: module.ChallengePanel })),
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
  // Modo debug: `?fps=1` mostra o medidor de FPS sem afetar quem joga normal.
  const showFps =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fps');

  // Ponte teclado -> acao, montada uma unica vez. As slices escutam a acao, nao
  // a tecla, entao o toque aciona exatamente o mesmo caminho.
  useKeyboardBindings();

  /**
   * Libera o AudioContext no primeiro gesto do usuario.
   *
   * Navegadores bloqueiam áudio antes de qualquer interacao; este listener
   * unico (uma vez por tipo de evento) e o suficiente para o jogo comecar a
   * soar no primeiro toque ou tecla.
   */
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

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
      <DailyBanner />
      <SettingsToggle />
      <SettingsPanel />
      <Minimapa />
      <Suspense fallback={null}>
        <ChallengePanel />
        <ShopPanel />
        <AvatarPanel />
        <WallChart />
        <OrdersPanel />
        <BedPanel />
        <AnimalBookPanel />
        <DaySummary />
      </Suspense>
      {showFps && <FpsMeter />}
      {isTouch && <TouchControls />}
    </>
  );
}
