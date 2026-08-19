import { useGameStore } from '../../app/store';
import { migrateAvatar } from '../avatar/avatar.logic';
import { bundleFor } from '../../i18n';
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
    openBridges: state.openBridges,
    animalBook: state.animalBook,
    pet: state.pet,
    locale: state.locale,
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
    openBridges: save.openBridges,
    animalBook: save.animalBook,
    pet: save.pet,
    locale: save.locale,
    text: bundleFor(save.locale),
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
 * **O filtro de igualdade nao e otimizacao — sem ele o save nunca acontece.** O
 * store e notificado a 4 Hz o tempo todo (o relogio publica a fase, a lanterna
 * publica a carga), entao um debounce puro se rearmava a cada tique e o
 * temporizador nunca chegava ao fim. O bug so apareceu no teste de navegador:
 * a aparencia escolhida no espelho nao sobrevivia a recarregar a pagina.
 *
 * Comparando o recorte duravel, a esmagadora maioria das notificacoes e
 * descartada de imediato, e o atraso so corre quando algo que importa mudou —
 * comprar tres itens seguidos ainda escreve uma vez so.
 *
 * Devolve o cancelamento, para os testes nao deixarem timer vivo.
 */
export function startAutoSave(): () => void {
  let ultimo = JSON.stringify(snapshot());

  const unsubscribe = useGameStore.subscribe(() => {
    const atual = JSON.stringify(snapshot());
    if (atual === ultimo) return;
    ultimo = atual;

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
