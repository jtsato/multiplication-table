import { create } from 'zustand';
import { createBuildingSlice, type BuildingSlice } from '../slices/building/building.store';
import { createDayNightSlice, type DayNightSlice } from '../slices/daynight/daynight.store';
import { createEnemiesSlice, type EnemiesSlice } from '../slices/enemies/enemies.store';
import { dayNightClock } from '../slices/daynight/dayNightClock';
import { playerTransform } from '../slices/player/playerTransform';
import { playerTransform as transformDoBarrel } from '../slices/player';
import { createMathSlice, type MathSlice } from '../slices/math/math.store';
import { createResourcesSlice, type ResourcesSlice } from '../slices/resources/resources.store';
import { createWorldSlice, type WorldSlice } from '../slices/world/world.store';

/**
 * Estado do jogo, composto pelas slices verticais.
 *
 * Este e o unico arquivo que conhece todas as slices. Uma slice nunca importa o
 * store — importa apenas o tipo `GameState`, o que evita ciclo de importacao e
 * mantem cada funcionalidade independente da composicao final.
 */
export type GameState = WorldSlice &
  ResourcesSlice &
  MathSlice &
  BuildingSlice &
  DayNightSlice &
  EnemiesSlice;

export const useGameStore = create<GameState>()((...args) => ({
  ...createWorldSlice(...args),
  ...createResourcesSlice(...args),
  ...createMathSlice(...args),
  ...createBuildingSlice(...args),
  ...createDayNightSlice(...args),
  ...createEnemiesSlice(...args),
}));

/**
 * Ponte de depuracao, usada pelos testes ponta a ponta.
 *
 * Expor o store e os relogios vivos e o que permite ao teste de navegador
 * conduzir o jogador ate um recurso e conferir o estado real — sem isso, o E2E
 * so conseguiria apertar teclas no escuro. Fica sob um nome com prefixo, e
 * apenas leitura de estado; nenhuma regra do jogo depende dele.
 */
declare global {
  interface Window {
    __tabuada?: {
      store: typeof useGameStore;
      transform: typeof playerTransform;
      clock: typeof dayNightClock;
      /** Mesmo objeto visto pelo barrel — serve para detectar duplicacao de modulo. */
      transformViaBarrel: typeof playerTransform;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__tabuada = {
    store: useGameStore,
    transform: playerTransform,
    clock: dayNightClock,
    transformViaBarrel: transformDoBarrel,
  };
}

/**
 * Reinicia a partida sem recarregar a pagina.
 *
 * Vive aqui, e nao numa slice, porque e a unica operacao que atravessa todas
 * elas — cada slice sabe se limpar, mas nenhuma manda nas outras.
 */
export function restartGame(): void {
  const state = useGameStore.getState();
  state.resetResources();
  state.resetBuilding();
  state.cancelChallenge();
  state.clearFeedback();
  state.resetClock();
  state.resetSurvival();
}
