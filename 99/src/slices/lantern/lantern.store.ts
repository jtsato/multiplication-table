import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { dayNightClock } from '../daynight/dayNightClock';
import { rechargeUntil, type Lantern } from './lantern.logic';

export interface LanternSlice {
  lantern: Lantern;
  /** Renova a carga da lanterna. `ratio` de 0 a 1 conforme o acerto. */
  rechargeLantern: (ratio: number, now?: number) => void;
  resetLantern: () => void;
}

/**
 * A lanterna comeca **apagada**, e nao com uma carga de cortesia.
 *
 * Acende-la pela primeira vez e o gesto que ensina a mecanica: a crianca chega
 * na primeira noite, ve que esta escuro, vai ate a fogueira e resolve uma conta.
 * Uma lanterna que ja viesse cheia adiaria essa descoberta para a segunda noite,
 * quando o momento de aprender ja passou.
 */
const APAGADA: Lantern = { chargedUntil: 0 };

export const createLanternSlice: StateCreator<GameState, [], [], LanternSlice> = (set) => ({
  lantern: APAGADA,

  rechargeLantern: (ratio, now = dayNightClock.seconds) =>
    set((state) => ({ lantern: { chargedUntil: rechargeUntil(state.lantern, now, ratio) } })),

  resetLantern: () => set({ lantern: APAGADA }),
});
