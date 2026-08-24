import { useEffect, useRef } from 'react';
import { useGameStore } from './store';
import { homeSpotLabel } from '../slices/home/home.logic';
import {
  applyDeadzone,
  emitAction,
  joystickVector,
  resetTouchAxes,
  touchAxes,
  type GameAction,
} from '../shared/input';
import { BUILDING, STRUCTURES, canAfford, formatRecipe, fuelRemaining } from '../slices/building/building.logic';
import { campfireWindowOpen } from '../slices/daynight/daynight.logic';
import { gardenStatus } from '../slices/garden/garden.logic';
import { dayNightClock } from '../slices/daynight/dayNightClock';
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

/**
 * Um botao de acao.
 *
 * **Nao existe mais estado desabilitado.** Um botao cinza que nao responde
 * ensina a crianca a ignorar aquele canto da tela, e ainda ocupa o espaco que o
 * polegar precisa para o que da para fazer agora. Quem decide se o botao existe
 * e quem monta a lista: se a acao nao cabe neste momento, o botao nao e
 * renderizado — o mesmo criterio que "Colher" ja seguia.
 */
function ActionButton({
  action,
  label,
  hint,
  variant,
}: {
  action: GameAction;
  label: string;
  hint?: string;
  variant?: string;
}) {
  return (
    <button
      type="button"
      className={`touch__button ${variant ? `touch__button--${variant}` : ''}`}
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
  const seeds = useGameStore((state) => state.seeds);
  const nearbyGardenId = useGameStore((state) => state.nearbyGardenId);
  const garden = useGameStore((state) => state.garden);
  const clock = useGameStore((state) => state.clock);
  const bundle = useGameStore((state) => state.text);
  const t = bundle.strings;

  const animalPerto = nearbyAnimalId ? animalById(animals, nearbyAnimalId) : null;
  const podeAlimentar = animalPerto ? canFeedAnimal(animalPerto, inventory) : false;
  const orderPerto = nearbyOrderId ? orders.find((order) => order.id === nearbyOrderId) : null;
  const podeEntregar = orderPerto ? inventory[orderPerto.kind] >= orderQuantity(orderPerto) : false;

  const temFogueira =
    campfireWindowOpen(clock.phase) &&
    structures.some(
      (structure) =>
        structure.kind === 'fogueira' &&
        fuelRemaining(structure, dayNightClock.seconds) < BUILDING.fireFuelSeconds * 2,
    );
  // Colher aparece com recurso ao alcance; abastecer, quando ja existe fogueira;
  // o movel, quando a crianca esta em frente a ele dentro de casa; alimentar,
  // quando um animal amigavel esta perto; e entregar, com um NPC de encomenda.
  const nearbyGarden = nearbyGardenId
    ? garden.find((plot) => plot.id === nearbyGardenId) ?? null
    : null;
  const gardenStatusNearby = nearbyGarden ? gardenStatus(nearbyGarden, clock.day) : null;
  const podeInteragirComHorta =
    nearbyGarden && (gardenStatusNearby === 'ready' || (gardenStatusNearby === 'empty' && seeds > 0));
  const podeInteragir =
    Boolean(highlightedNodeId) ||
    Boolean(nearbySpot) ||
    temFogueira ||
    podeAlimentar ||
    podeEntregar ||
    Boolean(podeInteragirComHorta);

  // Construir e contextual como o resto: a fogueira depende da hora **e** do
  // material; a cerca, so do material. Sem material nao ha o que construir, e o
  // que a crianca precisa nesse momento e a receita — que o HUD ja mostra o
  // tempo todo, com destaque quando ela junta o suficiente.
  const podeConstruirFogueira =
    campfireWindowOpen(clock.phase) && canAfford(inventory, STRUCTURES.fogueira.recipe);
  const podeConstruirCerca = canAfford(inventory, STRUCTURES.cerca.recipe);

  const rotuloInteragir = highlightedNodeId
    ? t.touchHarvest
    : nearbySpot
      ? homeSpotLabel(nearbySpot, t)
      : podeAlimentar
        ? t.touchFeed
        : podeEntregar
          ? t.touchOrder
          : nearbyGarden && gardenStatus(nearbyGarden, clock.day) === 'empty'
            ? t.touchPlant
            : nearbyGarden && gardenStatus(nearbyGarden, clock.day) === 'ready'
              ? t.touchHarvest
              : t.touchRefuel;

  return (
    <div className="touch">
      <Joystick />

      <div className="touch__actions">
        {buildMode ? (
          <>
            <ActionButton action="confirmar" label={t.touchBuild} variant="confirmar" />
            <ActionButton action="cancelar" label={t.touchCancel} variant="cancelar" />
          </>
        ) : (
          <>
            {!activeChallenge && podeInteragir && (
              <ActionButton action="interagir" label={rotuloInteragir} variant="interagir" />
            )}
            {/* A fogueira so aparece quando da para erguer uma: no entardecer ou
                a noite (a janela que `campfireWindowOpen` define) e com os 8
                gravetos e 2 pedras na mochila. De dia ela nao serve para nada, e
                um botao que nao serve para nada nao precisa estar na tela. */}
            {podeConstruirFogueira && (
              <ActionButton
                action="construir-fogueira"
                label={t.campfire}
                hint={formatRecipe(STRUCTURES.fogueira.recipe, bundle)}
              />
            )}
            {podeConstruirCerca && (
              <ActionButton
                action="construir-cerca"
                label={t.fence}
                hint={formatRecipe(STRUCTURES.cerca.recipe, bundle)}
              />
            )}
            {seeds > 0 && (
              <>
                <ActionButton action="plantar-arvore" label={t.plantTree} />
                <ActionButton action="plantar-frutifera" label={t.plantFruitTree} />
                <ActionButton action="plantar-canteiro" label={t.touchPlant} />
              </>
            )}
            {/* A loja fica por último: é a ação menos frequente das quatro, e o
                polegar alcança melhor as de cima. */}
            {!activeChallenge && <ActionButton action="loja" label={t.shopTitle} />}
          </>
        )}
      </div>
    </div>
  );
}
