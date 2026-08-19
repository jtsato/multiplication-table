import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { useGameAction } from '../../shared/input';
import { playerTransform } from '../player/playerTransform';
import { cyclePosition, phaseFor } from '../daynight/daynight.logic';
import { dayNightClock } from '../daynight/dayNightClock';
import {
  animalIsVisible,
  canFeedAnimal,
  feedTarget,
  nearestFeedableAnimal,
  type AnimalKind,
} from './wildlife.logic';

/** Corpo de um animal pequeno, reusado pelas especies de ambiente. */
function AnimalCorpo({
  cor,
  tamanho,
  chifre = false,
  cauda = false,
}: {
  cor: string;
  tamanho: [number, number, number];
  chifre?: boolean;
  cauda?: boolean;
}) {
  const [largura, altura, comprimento] = tamanho;
  return (
    <group>
      {/* Corpo */}
      <mesh position={[0, altura / 2, 0]} castShadow>
        <boxGeometry args={tamanho} />
        <meshLambertMaterial color={cor} flatShading />
      </mesh>
      {/* Cabeca */}
      <mesh position={[0, altura + 0.14, comprimento / 2 + 0.12]} castShadow>
        <boxGeometry args={[largura * 0.55, altura * 0.55, comprimento * 0.35]} />
        <meshLambertMaterial color={cor} flatShading />
      </mesh>
      {/* Quatro pernas curtas */}
      {[-1, 1].flatMap((lado) =>
        [-1, 1].map((frente) => (
          <mesh
            key={`${lado}-${frente}`}
            position={[lado * (largura * 0.35), altura * 0.16, frente * (comprimento * 0.3)]}
          >
            <boxGeometry args={[largura * 0.18, altura * 0.32, comprimento * 0.14]} />
            <meshLambertMaterial color={cor} flatShading />
          </mesh>
        )),
      )}
      {chifre && (
        <mesh position={[0, altura + 0.45, comprimento / 2 + 0.15]} castShadow>
          <coneGeometry args={[0.09, 0.35, 6]} />
          <meshLambertMaterial color={palette.honey} flatShading />
        </mesh>
      )}
      {cauda && (
        <mesh position={[0, altura * 0.55, -comprimento / 2 - 0.25]} rotation={[0.5, 0, 0]}>
          <coneGeometry args={[0.14, 0.5, 6]} />
          <meshLambertMaterial color={cor} flatShading />
        </mesh>
      )}
    </group>
  );
}

/** Uma gaivota: corpo pequeno, bico laranja. */
function Gaivota() {
  return (
    <group>
      <AnimalCorpo cor="#f4f4f4" tamanho={[0.32, 0.28, 0.5]} />
      <mesh position={[0, 0.5, 0.42]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.07, 0.14, 4]} />
        <meshLambertMaterial color={palette.fire} flatShading />
      </mesh>
    </group>
  );
}

/** Peixe de cardume: corpo alongado e nadadeira. */
function Peixe() {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.22, 0.22]} />
        <meshLambertMaterial color={palette.fish} flatShading />
      </mesh>
      <mesh position={[-0.32, 0, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.14, 0.3, 4]} />
        <meshLambertMaterial color={palette.fish} flatShading />
      </mesh>
    </group>
  );
}

/** Cachorro: corpo marrom, orelhas caidas. */
function Cachorro() {
  return (
    <group>
      <AnimalCorpo cor="#a9743f" tamanho={[0.5, 0.45, 0.8]} cauda />
      <mesh position={[-0.14, 0.72, 0.42]} rotation={[0.3, 0, -0.3]}>
        <boxGeometry args={[0.16, 0.22, 0.06]} />
        <meshLambertMaterial color="#6b4a2f" flatShading />
      </mesh>
      <mesh position={[0.14, 0.72, 0.42]} rotation={[0.3, 0, 0.3]}>
        <boxGeometry args={[0.16, 0.22, 0.06]} />
        <meshLambertMaterial color="#6b4a2f" flatShading />
      </mesh>
    </group>
  );
}

/** Gato: corpo cinza, orelhas pontudas. */
function Gato() {
  return (
    <group>
      <AnimalCorpo cor="#8d949e" tamanho={[0.42, 0.38, 0.7]} cauda />
      <mesh position={[-0.12, 0.62, 0.38]} rotation={[0, 0, -0.35]}>
        <coneGeometry args={[0.08, 0.16, 4]} />
        <meshLambertMaterial color="#4e545d" flatShading />
      </mesh>
      <mesh position={[0.12, 0.62, 0.38]} rotation={[0, 0, 0.35]}>
        <coneGeometry args={[0.08, 0.16, 4]} />
        <meshLambertMaterial color="#4e545d" flatShading />
      </mesh>
    </group>
  );
}

/** Cavalo: corpo grande, crina e cauda. */
function Cavalo() {
  return (
    <group>
      <AnimalCorpo cor="#7a5230" tamanho={[0.7, 0.9, 1.3]} cauda />
      <mesh position={[0, 1.15, 0.35]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.12]} />
        <meshLambertMaterial color="#4a3728" flatShading />
      </mesh>
    </group>
  );
}

/** Vaca: corpo branco com manchas escuras. */
function Vaca() {
  return (
    <group>
      <AnimalCorpo cor="#f2f0e6" tamanho={[0.8, 0.7, 1.2]} />
      <mesh position={[0.2, 0.75, 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.35]} />
        <meshLambertMaterial color="#4e545d" flatShading />
      </mesh>
      <mesh position={[-0.15, 0.85, -0.3]} castShadow>
        <boxGeometry args={[0.25, 0.25, 0.3]} />
        <meshLambertMaterial color="#4e545d" flatShading />
      </mesh>
    </group>
  );
}

/** Unicornio: cavalo branco com chifre dourado. */
function Unicornio() {
  return (
    <group>
      <AnimalCorpo cor="#f4f4f4" tamanho={[0.7, 0.9, 1.3]} chifre cauda />
      <mesh position={[0, 1.2, 0.4]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.12]} />
        <meshLambertMaterial color="#e6d9b8" flatShading />
      </mesh>
    </group>
  );
}

/** Dinossauro: corpo grande, cauda longa. */
function Dinossauro() {
  return (
    <group>
      <AnimalCorpo cor="#3f8f45" tamanho={[0.9, 1.1, 1.6]} cauda />
      <mesh position={[0, 1.4, 0.5]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.3, 0.6, 0.16]} />
        <meshLambertMaterial color="#2c6b34" flatShading />
      </mesh>
    </group>
  );
}

function AnimalMesh({ kind }: { kind: AnimalKind }) {
  switch (kind) {
    case 'gaivota':
      return <Gaivota />;
    case 'peixe':
      return <Peixe />;
    case 'cachorro':
      return <Cachorro />;
    case 'gato':
      return <Gato />;
    case 'cavalo':
      return <Cavalo />;
    case 'vaca':
      return <Vaca />;
    case 'unicornio':
      return <Unicornio />;
    case 'dinossauro':
      return <Dinossauro />;
  }
}

/**
 * Os animais no mundo.
 *
 * Eles nao tem corpo fisico nem pathfinding: ficam parados (ou levemente
 * instanciados) e so respondem a proximidade. A interacao abre o mesmo
 * `ChallengePanel` de sempre — o pedido de comida *e* a conta.
 */
export function WildlifeView() {
  const animals = useGameStore((state) => state.animals);
  const phase = useGameStore((state) => state.clock.phase);
  const streak = useGameStore((state) => state.streak);

  const visiveis = useMemo(
    () => animals.filter((animal) => animalIsVisible(animal, phase, streak)),
    [animals, phase, streak],
  );

  useFrame(() => {
    const state = useGameStore.getState();
    const fase = phaseFor(cyclePosition(dayNightClock.seconds));
    const sequencia = state.streak;

    const proximo = nearestFeedableAnimal(playerTransform, state.animals, fase, sequencia);
    state.setNearbyAnimal(proximo?.id ?? null);

    // "Visto" entra na caderneta por aproximacao, sem exigir interacao: a
    // crianca que passou perto ja pode ver na casa que descobriu o bicho.
    if (proximo) state.markSeen(proximo.kind);
  });

  // A mesma tecla de colher, agora para alimentar. Prioridade: recurso, movel,
  // ponte e fogueira continuam na frente — animal so quando nada mais disputa.
  useGameAction('interagir', () => {
    const state = useGameStore.getState();
    if (
      state.activeChallenge ||
      state.highlightedNodeId ||
      state.nearbySpot ||
      state.nearbyBridge
    ) {
      return;
    }
    const fase = phaseFor(cyclePosition(dayNightClock.seconds));
    const animal = nearestFeedableAnimal(playerTransform, state.animals, fase, state.streak);
    if (!animal) return;
    if (!canFeedAnimal(animal, state.inventory)) return;

    state.startChallenge(feedTarget(animal), 'alimentar');
  });

  return (
    <group name="animais">
      {visiveis.map((animal) => (
        <group
          key={animal.id}
          name={`animal-${animal.kind}`}
          position={[animal.position.x, animal.position.y, animal.position.z]}
        >
          <AnimalMesh kind={animal.kind} />
        </group>
      ))}
    </group>
  );
}
