import { create } from 'zustand';
import { createI18nSlice, type I18nSlice } from '../i18n/i18n.store';
import { createAvatarSlice, type AvatarSlice } from '../slices/avatar/avatar.store';
import { createBuildingSlice, type BuildingSlice } from '../slices/building/building.store';
import { createDayNightSlice, type DayNightSlice } from '../slices/daynight/daynight.store';
import { createEconomySlice, type EconomySlice } from '../slices/economy/economy.store';
import { createHomeSlice, type HomeSlice } from '../slices/home/home.store';
import { HOME_SPOTS } from '../slices/home/home.logic';
import { dayNightClock } from '../slices/daynight/dayNightClock';
import { createLanternSlice, type LanternSlice } from '../slices/lantern/lantern.store';
import { playerTransform } from '../slices/player/playerTransform';
import { createMathSlice, type MathSlice } from '../slices/math/math.store';
import { createRegionsSlice, type RegionsSlice } from '../slices/regions/regions.store';
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
  LanternSlice &
  EconomySlice &
  HomeSlice &
  AvatarSlice &
  RegionsSlice &
  I18nSlice;

export const useGameStore = create<GameState>()((...args) => ({
  ...createWorldSlice(...args),
  ...createResourcesSlice(...args),
  ...createMathSlice(...args),
  ...createBuildingSlice(...args),
  ...createDayNightSlice(...args),
  ...createLanternSlice(...args),
  ...createEconomySlice(...args),
  ...createHomeSlice(...args),
  ...createAvatarSlice(...args),
  ...createRegionsSlice(...args),
  ...createI18nSlice(...args),
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
      homeSpots: typeof HOME_SPOTS;
      /**
       * Leva o jogador a um ponto do mapa.
       *
       * Registrado por `PlayerView`, que e quem tem o corpo do Rapier. Serve
       * para o teste ponta a ponta montar a cena — "de pe ao lado de uma
       * arvore" — sem depender de atravessar a ilha correndo, o que tornava a
       * suite lenta e instavel. Andar de verdade tem teste proprio.
       */
      teleportar?: (x: number, z: number) => void;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__tabuada = {
    store: useGameStore,
    transform: playerTransform,
    clock: dayNightClock,
    // Posicoes dos moveis, para o E2E levar o jogador ate eles.
    homeSpots: HOME_SPOTS,
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
  state.resetLantern();
  state.resetEconomy();
  state.resetRegions();
}
