import { useEffect, useRef, useState } from 'react';
import { useGameStore } from './store';
import {
  applyDeadzone,
  emitAction,
  joystickVector,
  resetTouchAxes,
  touchAxes,
  type GameAction,
} from '../shared/input';
import { STRUCTURES, canAfford } from '../slices/building';
import './touch.css';

/** Raio util do joystick, em pixels. Casado com o tamanho da base no CSS. */
const JOYSTICK_RADIUS = 56;

/**
 * Detecta aparelho de toque.
 *
 * `pointer: coarse` e mais confiavel que farejar o user agent: descreve o
 * apontador de fato em uso, entao tablets e celulares entram e um desktop com
 * tela sensivel ao toque mas com mouse fica de fora.
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    setIsTouch(query.matches);

    const onChange = (event: MediaQueryListEvent) => setIsTouch(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return isTouch;
}

/**
 * Joystick analogico do polegar esquerdo.
 *
 * Escreve direto em `touchAxes`, fora do React: o vetor muda a cada movimento
 * do dedo e passar por estado re-renderizaria a arvore dezenas de vezes por
 * segundo. So a posicao visual do bastao usa estado, e ainda assim por um ref
 * aplicado ao proprio elemento.
 */
function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!base || !knob) return;

    const centro = () => {
      const rect = base.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const mover = (event: PointerEvent) => {
      const vector = applyDeadzone(
        joystickVector(centro(), { x: event.clientX, y: event.clientY }, JOYSTICK_RADIUS),
      );
      touchAxes.x = vector.x;
      touchAxes.z = vector.z;
      knob.style.transform = `translate(${vector.x * JOYSTICK_RADIUS}px, ${
        vector.z * JOYSTICK_RADIUS
      }px)`;
    };

    const onPointerDown = (event: PointerEvent) => {
      // Um dedo por vez neste controle; o outro polegar fica livre para a camera.
      if (pointerIdRef.current !== null) return;
      pointerIdRef.current = event.pointerId;
      // Captura: o dedo pode escorregar para fora da base sem perder o controle.
      base.setPointerCapture(event.pointerId);
      mover(event);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;
      mover(event);
    };

    const soltar = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = null;
      resetTouchAxes();
      knob.style.transform = 'translate(0px, 0px)';
    };

    base.addEventListener('pointerdown', onPointerDown);
    base.addEventListener('pointermove', onPointerMove);
    base.addEventListener('pointerup', soltar);
    base.addEventListener('pointercancel', soltar);

    return () => {
      base.removeEventListener('pointerdown', onPointerDown);
      base.removeEventListener('pointermove', onPointerMove);
      base.removeEventListener('pointerup', soltar);
      base.removeEventListener('pointercancel', soltar);
      resetTouchAxes();
    };
  }, []);

  return (
    <div className="touch__joystick" ref={baseRef} aria-label="Mover" role="application">
      <div className="touch__knob" ref={knobRef} />
    </div>
  );
}

function ActionButton({
  action,
  label,
  hint,
  variant,
  disabled,
}: {
  action: GameAction;
  label: string;
  hint?: string;
  variant?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`touch__button ${variant ? `touch__button--${variant}` : ''}`}
      disabled={disabled}
      // `pointerdown` e nao `click`: dispara no encostar do dedo, sem os ~300 ms
      // que o navegador espera para decidir se foi toque duplo.
      onPointerDown={(event) => {
        event.preventDefault();
        emitAction(action);
      }}
    >
      <strong>{label}</strong>
      {hint && <small>{hint}</small>}
    </button>
  );
}

/**
 * Controles de toque.
 *
 * Os botoes mostrados dependem do contexto, e nao de um teclado virtual fixo:
 * no celular nao ha espaco para oito comandos ao mesmo tempo. Colher so aparece
 * com algo ao alcance; confirmar e cancelar so no modo construcao. As respostas
 * do desafio ficam no proprio painel ancorado no recurso.
 */
export function TouchControls() {
  const highlightedNodeId = useGameStore((state) => state.highlightedNodeId);
  const activeChallenge = useGameStore((state) => state.activeChallenge);
  const buildMode = useGameStore((state) => state.buildMode);
  const inventory = useGameStore((state) => state.inventory);
  const outcome = useGameStore((state) => state.outcome);
  const structures = useGameStore((state) => state.structures);

  // Com a partida decidida, a tela de desfecho assume.
  if (outcome !== 'jogando') return null;

  const temFogueira = structures.some((structure) => structure.kind === 'fogueira');
  // Colher aparece com recurso ao alcance; abastecer, quando ja existe fogueira.
  const podeInteragir = Boolean(highlightedNodeId) || temFogueira;

  return (
    <div className="touch">
      <Joystick />

      <div className="touch__actions">
        {buildMode ? (
          <>
            <ActionButton action="confirmar" label="Construir" variant="confirmar" />
            <ActionButton action="cancelar" label="Cancelar" variant="cancelar" />
          </>
        ) : (
          <>
            {!activeChallenge && podeInteragir && (
              <ActionButton
                action="interagir"
                label={highlightedNodeId ? 'Colher' : 'Lenha'}
                variant="interagir"
              />
            )}
            <ActionButton
              action="construir-fogueira"
              label="Fogueira"
              hint="8 mad · 4 ped"
              disabled={!canAfford(inventory, STRUCTURES.fogueira.recipe)}
            />
            <ActionButton
              action="construir-cerca"
              label="Cerca"
              hint="6 mad"
              disabled={!canAfford(inventory, STRUCTURES.cerca.recipe)}
            />
          </>
        )}
      </div>
    </div>
  );
}
