import { useEffect, useRef } from 'react';
import { useGameStore } from './store';
import { HOME_SPOT_LABELS } from '../slices/home/home.logic';
import {
  applyDeadzone,
  emitAction,
  joystickVector,
  resetTouchAxes,
  touchAxes,
  type GameAction,
} from '../shared/input';
import { STRUCTURES, canAfford } from '../slices/building/building.logic';
import { animalById, canFeedAnimal } from '../slices/wildlife/wildlife.logic';
import { orderQuantity } from '../slices/npc/npc.logic';
import './touch.css';

/** Raio util do joystick, em pixels. Casado com o tamanho da base no CSS. */
const JOYSTICK_RADIUS = 56;

/**
 * Joystick analogico do polegar esquerdo.
 *
 * Escreve direto em `touchAxes`, fora do React: o vetor muda a cada movimento
 * do dedo e passar por estado re-renderizaria a arvore dezenas de vezes por
 * segundo. So a posicao visual do bastao usa estado, e ainda assim por um ref
 * aplicado ao proprio elemento.
 */
function Joystick() {
  const t = useGameStore((state) => state.text).strings;

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
    <div className="touch__joystick" ref={baseRef} aria-label={t.joystickLabel} role="application">
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
      aria-disabled={disabled || undefined}
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
 * do desafio ficam no painel centralizado da tela.
 */
export function TouchControls() {
  const highlightedNodeId = useGameStore((state) => state.highlightedNodeId);
  const activeChallenge = useGameStore((state) => state.activeChallenge);
  const buildMode = useGameStore((state) => state.buildMode);
  const inventory = useGameStore((state) => state.inventory);
  const structures = useGameStore((state) => state.structures);
  const nearbySpot = useGameStore((state) => state.nearbySpot);
  const nearbyAnimalId = useGameStore((state) => state.nearbyAnimalId);
  const animals = useGameStore((state) => state.animals);
  const nearbyOrderId = useGameStore((state) => state.nearbyOrderId);
  const orders = useGameStore((state) => state.orders);

  const animalPerto = nearbyAnimalId ? animalById(animals, nearbyAnimalId) : null;
  const podeAlimentar = animalPerto ? canFeedAnimal(animalPerto, inventory) : false;
  const orderPerto = nearbyOrderId ? orders.find((order) => order.id === nearbyOrderId) : null;
  const podeEntregar = orderPerto ? inventory[orderPerto.kind] >= orderQuantity(orderPerto) : false;

  const temFogueira = structures.some((structure) => structure.kind === 'fogueira');
  // Colher aparece com recurso ao alcance; abastecer, quando ja existe fogueira;
  // o movel, quando a crianca esta em frente a ele dentro de casa; alimentar,
  // quando um animal amigavel esta perto; e entregar, com um NPC de encomenda.
  const podeInteragir =
    Boolean(highlightedNodeId) ||
    Boolean(nearbySpot) ||
    temFogueira ||
    podeAlimentar ||
    podeEntregar;

  const rotuloInteragir = highlightedNodeId
    ? 'Colher'
    : nearbySpot
      ? HOME_SPOT_LABELS[nearbySpot]
      : podeAlimentar
        ? 'Alimentar'
        : podeEntregar
          ? 'Entregar'
          : 'Acender';

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
              <ActionButton action="interagir" label={rotuloInteragir} variant="interagir" />
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
            {/* A loja fica por último: é a ação menos frequente das quatro, e o
                polegar alcança melhor as de cima. */}
            {!activeChallenge && <ActionButton action="loja" label="Loja" />}
          </>
        )}
      </div>
    </div>
  );
}
