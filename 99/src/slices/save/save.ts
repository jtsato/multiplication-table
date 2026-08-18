import { useGameStore } from '../../app/store';
import { migrateAvatar } from '../avatar/avatar.logic';
import { saveRepository, type GameSave, SAVE_VERSION } from './save.repository';

/** Quanto tempo esperar antes de gravar, em milissegundos. */
const DEBOUNCE_MS = 800;

/** Recorta do estado o que e durável — o resto se recria a cada partida. */
export function snapshot(): GameSave {
  const state = useGameStore.getState();
  return {
    version: SAVE_VERSION,
    coins: state.coins,
    knownFacts: state.knownFacts,
    inventory: state.inventory,
    owned: state.owned,
    hints: state.hints,
    avatar: state.avatar,
  };
}

/**
 * Aplica um save ao estado.
 *
 * O avatar passa por `migrateAvatar` de novo aqui, de proposito: um acessorio
 * pode ter sido salvo e o marco correspondente ainda constar — a validacao de
 * disponibilidade fica com o store, que conhece `knownFacts` no momento certo.
 */
export function applySave(save: GameSave): void {
  useGameStore.setState({
    coins: save.coins,
    knownFacts: save.knownFacts,
    inventory: save.inventory,
    owned: save.owned,
    hints: save.hints,
    avatar: migrateAvatar(save.avatar),
  });
}

/** Carrega o save, se houver. Devolve `false` quando comeca do zero. */
export function loadGame(): boolean {
  const save = saveRepository.load();
  if (!save) return false;
  applySave(save);
  return true;
}

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Assina o store e grava com atraso.
 *
 * Com debounce, e nunca por quadro: comprar tres itens seguidos escreve uma vez
 * so, e nada do que muda continuamente — posicao, relogio, carga da lanterna —
 * esta no recorte durável, entao nem chega aqui.
 *
 * Devolve o cancelamento, para os testes nao deixarem timer vivo.
 */
export function startAutoSave(): () => void {
  const unsubscribe = useGameStore.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      saveRepository.save(snapshot());
    }, DEBOUNCE_MS);
  });

  return () => {
    if (timer) clearTimeout(timer);
    timer = null;
    unsubscribe();
  };
}
