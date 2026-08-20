import { useGameStore } from '../../app/store';
import { migrateAvatar } from '../avatar/avatar.logic';
import { bundleFor } from '../../i18n';
import { dayNightClock } from '../daynight/dayNightClock';
import { dayNumber } from '../daynight/daynight.logic';
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
    seeds: state.seeds,
    garden: state.garden,
    avatar: state.avatar,
    openBridges: state.openBridges,
    animalBook: state.animalBook,
    pet: state.pet,
    locale: state.locale,
    structures: state.structures,
    clockSeconds: dayNightClock.seconds,
    volume: state.volume,
    cameraSensitivity: state.cameraSensitivity,
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
  // O relogio vivo precisa voltar junto: o combustível da fogueira e o dia da
  // horta são prazos/contagens relativos a ele.
  dayNightClock.seconds = save.clockSeconds;

  useGameStore.setState({
    coins: save.coins,
    knownFacts: save.knownFacts,
    inventory: save.inventory,
    owned: save.owned,
    hints: save.hints,
    seeds: save.seeds,
    garden: save.garden,
    avatar: migrateAvatar(save.avatar),
    openBridges: save.openBridges,
    animalBook: save.animalBook,
    pet: save.pet,
    locale: save.locale,
    text: bundleFor(save.locale),
    // O dia deriva dos segundos salvos; a fase recomeça de dia.
    clock: { ...useGameStore.getState().clock, day: dayNumber(save.clockSeconds) },
  });

  // Restaura as construções e ajusta o contador de ids para não duplicar.
  useGameStore.getState().loadStructures(save.structures);

  // Volume e sensibilidade voltam com o save; loadSettings também aplica o
  // volume no AudioContext (que ainda pode estar fechado — o valor fica salvo).
  useGameStore.getState().loadSettings(save.volume, save.cameraSensitivity);
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
 * Assinatura do progresso durável, **sem o relógio vivo**.
 *
 * `clockSeconds` muda a cada quadro; incluí-lo na comparação do autosave faria o
 * debounce se rearmar para sempre e o save nunca sairia — o mesmo bug que o
 * filtro de igualdade original já resolvia. O relógio continua sendo gravado,
 * só não participa da decisão de *quando* gravar.
 */
function durableSignature(): string {
  const { clockSeconds, ...duravel } = snapshot();
  void clockSeconds;
  return JSON.stringify(duravel);
}

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
  let ultimo = durableSignature();

  const unsubscribe = useGameStore.subscribe(() => {
    const atual = durableSignature();
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
