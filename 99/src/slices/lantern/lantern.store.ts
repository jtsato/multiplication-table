import type { StateCreator } from 'zustand';
import type { GameState } from '../../app/store';
import { dayNightClock } from '../daynight/dayNightClock';
import {
  chargeRemaining,
  lanternChargeSeconds,
  rechargeUntil,
  type Lantern,
} from './lantern.logic';

export interface LanternSlice {
  lantern: Lantern;
  /**
   * Segundos de carga restantes, amostrados para o HUD.
   *
   * O prazo em `lantern` nao muda enquanto a lanterna queima — e essa a graca
   * dele —, mas a barra do HUD precisa esvaziar. Em vez de o HUD ler o relogio
   * vivo (o que o faria re-renderizar por quadro), a `LanternView` publica esta
   * amostra com throttle, do mesmo jeito que `DayNightView` publica o relogio.
   *
   * Mora aqui, e nao em `ClockSample`, para a slice de dia/noite nao precisar
   * saber que existe uma lanterna.
   */
  lanternCharge: number;
  /** Renova a carga da lanterna. `ratio` de 0 a 1 conforme o acerto. */
  rechargeLantern: (ratio: number, now?: number) => void;
  /** Amostra da carga para o HUD, chamada com throttle pela view. */
  publishLanternCharge: (seconds: number) => void;
  /**
   * Segura a carga enquanto o jogador esta na luz da casa.
   *
   * Empurra o prazo junto com o relogio, e — se a lanterna estiver apagada —
   * acende de graca. Reacender em casa nao cobra conta nem moeda: e o unico
   * lugar do jogo onde a luz e simplesmente dada.
   */
  keepLanternTopped: (now: number, delta: number) => void;
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
  lanternCharge: 0,

  rechargeLantern: (ratio, now = dayNightClock.seconds) =>
    set((state) => {
      const melhorada = state.owned.includes('lanterna-maior');
      const lantern = { chargedUntil: rechargeUntil(state.lantern, now, ratio, melhorada) };
      // A amostra e atualizada junto: sem isso a barra do HUD so subiria no
      // proximo tick da view, e a recarga pareceria nao ter funcionado.
      return { lantern, lanternCharge: chargeRemaining(lantern, now) };
    }),

  keepLanternTopped: (now, delta) =>
    set((state) => {
      const carga = chargeRemaining(state.lantern, now);
      const cheia = lanternChargeSeconds(state.owned.includes('lanterna-maior'));
      if (carga >= cheia) return state;

      // Acende do zero se preciso, e senao empurra o prazo. `delta * 2` para a
      // lanterna encher rapido em casa: o abrigo nao pode virar sala de espera.
      const alvo = Math.min(cheia, carga + Math.max(delta, delta * 2));
      return { lantern: { chargedUntil: now + alvo }, lanternCharge: alvo };
    }),

  publishLanternCharge: (seconds) =>
    set((state) => {
      // A barra e desenhada em segundos inteiros; sem esta guarda o store
      // notificaria os assinantes a cada amostra, sem mudanca visivel no HUD.
      if (Math.ceil(state.lanternCharge) === Math.ceil(seconds)) return state;
      return { lanternCharge: seconds };
    }),

  resetLantern: () => set({ lantern: APAGADA, lanternCharge: 0 }),
});
