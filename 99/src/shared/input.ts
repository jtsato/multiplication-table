import { useEffect, useRef } from 'react';

/**
 * Acoes do jogo, independentes de como foram acionadas.
 *
 * Esta camada existe para que teclado e toque nao virem dois caminhos paralelos.
 * Antes, cada slice escutava uma tecla fisica (`useKeyPress('KeyE')`); qualquer
 * acao nova no celular teria que ser duplicada e as duas copias divergiriam com
 * o tempo. Agora ha um unico mapa de entrada fisica -> acao, e as slices escutam
 * a acao.
 */
export type GameAction =
  | 'interagir'
  | 'construir-fogueira'
  | 'construir-cerca'
  | 'confirmar'
  | 'cancelar'
  | 'responder-1'
  | 'responder-2'
  | 'responder-3';

type Handler = () => void;

const listeners = new Map<GameAction, Set<Handler>>();

/** Dispara uma acao para todos os interessados. */
export function emitAction(action: GameAction): void {
  const handlers = listeners.get(action);
  if (!handlers) return;
  // Copia antes de percorrer: um handler pode desmontar outro componente.
  for (const handler of [...handlers]) handler();
}

/**
 * Escuta uma acao fora do React (loop de quadro, testes) e devolve o cancelamento.
 * Componentes devem usar `useGameAction`, que cuida do ciclo de vida.
 */
export function subscribeAction(action: GameAction, handler: Handler): () => void {
  let handlers = listeners.get(action);
  if (!handlers) {
    handlers = new Set();
    listeners.set(action, handlers);
  }
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/** Reage a uma acao do jogo, venha de tecla ou de toque. */
export function useGameAction(action: GameAction, handler: Handler): void {
  const handlerRef = useRef(handler);
  // Em efeito, nao durante o render (regra react-hooks/refs).
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => subscribeAction(action, () => handlerRef.current()), [action]);
}

/**
 * Mapa de teclas fisicas para acoes.
 *
 * `event.code` e nao `event.key`: as teclas continuam no mesmo lugar fisico em
 * teclados AZERTY ou Dvorak.
 */
export const KEY_BINDINGS: Record<string, GameAction> = {
  KeyE: 'interagir',
  KeyB: 'construir-fogueira',
  KeyC: 'construir-cerca',
  Space: 'confirmar',
  Escape: 'cancelar',
  Digit1: 'responder-1',
  Digit2: 'responder-2',
  Digit3: 'responder-3',
};

/**
 * Instala a ponte teclado -> acao. Deve ser montada uma unica vez, na raiz.
 *
 * `event.repeat` e ignorado: segurar E nao pode abrir um desafio por quadro.
 */
export function useKeyboardBindings(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = KEY_BINDINGS[event.code];
      if (!action || event.repeat) return;
      // Espaco rolaria a pagina e Escape sairia de tela cheia.
      event.preventDefault();
      emitAction(action);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/**
 * Eixos de movimento vindos do toque, de -1 a 1.
 *
 * Objeto mutavel fora do React, como `playerTransform`: o valor muda a cada
 * quadro enquanto o dedo se move, e passar por estado do React re-renderizaria
 * a arvore inteira 60 vezes por segundo.
 */
export const touchAxes = { x: 0, z: 0 };

export function resetTouchAxes(): void {
  touchAxes.x = 0;
  touchAxes.z = 0;
}

export interface JoystickVector {
  x: number;
  z: number;
  /** Intensidade de 0 a 1 — o quanto o dedo se afastou do centro. */
  magnitude: number;
}

/**
 * Converte a posicao do dedo em vetor de movimento analogico.
 *
 * O resultado e limitado ao circulo unitario, entao empurrar para a diagonal
 * nao anda mais rapido — o mesmo cuidado que `inputToDirection` toma com o
 * teclado. Como o vetor e analogico, encostar de leve anda devagar, o que ajuda
 * a manobrar perto de um recurso sem passar direto.
 */
export function joystickVector(
  center: { x: number; y: number },
  point: { x: number; y: number },
  radius: number,
): JoystickVector {
  if (radius <= 0) return { x: 0, z: 0, magnitude: 0 };

  const dx = point.x - center.x;
  // Y da tela cresce para baixo; Z do mundo cresce para tras. Empurrar o dedo
  // para cima tem que andar para frente, dai a inversao.
  const dy = point.y - center.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) return { x: 0, z: 0, magnitude: 0 };

  const magnitude = Math.min(1, distance / radius);
  return {
    x: (dx / distance) * magnitude,
    z: (dy / distance) * magnitude,
    magnitude,
  };
}

/** Abaixo disto o toque conta como parado — evita deriva com o dedo apoiado. */
export const JOYSTICK_DEADZONE = 0.12;

/** Aplica a zona morta ao vetor do joystick. */
export function applyDeadzone(
  vector: JoystickVector,
  deadzone = JOYSTICK_DEADZONE,
): JoystickVector {
  if (vector.magnitude <= deadzone) return { x: 0, z: 0, magnitude: 0 };
  return vector;
}
