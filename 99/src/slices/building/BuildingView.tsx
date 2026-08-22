import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import type { Group, Mesh, MeshBasicMaterial, PointLight } from 'three';
import { useGameStore } from '../../app/store';
import { useGameAction } from '../../shared/input';
import { palette } from '../../shared/palette';
import { dayNightClock } from '../daynight/dayNightClock';
import { playerTransform } from '../player';
import { DEFAULT_PER_GROUP } from '../resources/resources.logic';
import {
  BUILDING,
  STRUCTURES,
  checkPlacement,
  fuelRemaining,
  nearestRefuelable,
  nearestRemovableFence,
  placementPosition,
  snapFencePlacement,
  type StructureKind,
  type Structure,
} from './building.logic';

function buildPlacement(
  buildMode: StructureKind,
  inventory: Parameters<typeof snapFencePlacement>[2],
  structures: Parameters<typeof snapFencePlacement>[3],
  nodes: Parameters<typeof snapFencePlacement>[4],
) {
  const manualPosition = placementPosition(playerTransform, playerTransform.yaw);
  return buildMode === 'cerca'
    ? snapFencePlacement(manualPosition, playerTransform.yaw, inventory, structures, nodes)
    : { position: manualPosition, rotation: playerTransform.yaw };
}

/** Fogueira: tres toras cruzadas, uma chama e a luz que ela emite. */
function Campfire({ structure }: { structure: Structure }) {
  const flameRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);
  const { x, y, z } = structure.position;

  useFrame((state) => {
    // A chama encolhe conforme o combustivel acaba e apaga de vez no zero.
    // Tudo escrito direto nos objetos do Three: o combustivel muda
    // continuamente e nao pode passar pelo React.
    const fuel = fuelRemaining(structure, dayNightClock.seconds);
    const strength = Math.min(1, fuel / BUILDING.fireFuelSeconds);
    const lit = fuel > 0;

    // Tremulacao barata: duas senoides fora de fase evitam a pulsacao regular
    // demais de uma so.
    const t = state.clock.elapsedTime;
    const flicker = 1 + Math.sin(t * 9) * 0.12 + Math.sin(t * 14.3) * 0.06;
    const scale = lit ? flicker * (0.45 + strength * 0.55) : 0;

    if (flameRef.current) {
      flameRef.current.scale.set(scale, lit ? 1 + (flicker - 1) * 2 : 0, scale);
    }
    if (coreRef.current) {
      coreRef.current.scale.setScalar(scale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = lit ? 8 + strength * 22 : 0;
    }
  });

  return (
    <group position={[x, y, z]}>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          position={[0, 0.18, 0]}
          rotation={[Math.PI / 2.4, (index / 3) * Math.PI * 2, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.1, 0.12, 1.3, 5]} />
          <meshLambertMaterial color={palette.trunk} flatShading />
        </mesh>
      ))}

      {/* Pedras em volta, para a fogueira parecer contida. */}
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2;
        return (
          <mesh
            key={`pedra-${index}`}
            position={[Math.cos(angle) * 0.75, 0.1, Math.sin(angle) * 0.75]}
            castShadow
          >
            <dodecahedronGeometry args={[0.19, 0]} />
            <meshLambertMaterial color={palette.rock} flatShading />
          </mesh>
        );
      })}

      <mesh ref={flameRef} position={[0, 0.75, 0]}>
        <coneGeometry args={[0.34, 0.95, 5]} />
        <meshBasicMaterial color={palette.fire} />
      </mesh>
      <mesh ref={coreRef} position={[0, 0.58, 0]}>
        <coneGeometry args={[0.18, 0.5, 5]} />
        <meshBasicMaterial color={palette.fireCore} />
      </mesh>

      {/* `distance` limita o alcance: sem isso a luz custaria caro em toda a cena. */}
      <pointLight
        ref={lightRef}
        position={[0, 1.1, 0]}
        color={palette.fire}
        intensity={26}
        distance={BUILDING.fireLightRadius}
        decay={2}
      />
    </group>
  );
}

/** Cerca: dois postes e duas travessas, com colisor que barra o caminho. */
function Fence({ structure }: { structure: Structure }) {
  const { x, y, z } = structure.position;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, y, z]}
      rotation={[0, structure.rotation, 0]}
    >
      {[-0.9, 0.9].map((offset) => (
        <mesh key={offset} position={[offset, 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.17, 1.4, 0.17]} />
          <meshLambertMaterial color={palette.fence} flatShading />
        </mesh>
      ))}
      {[0.55, 1.05].map((height) => (
        <mesh key={height} position={[0, height, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.14, 0.1]} />
          <meshLambertMaterial color={palette.fence} flatShading />
        </mesh>
      ))}
      <CuboidCollider args={[1, 0.7, 0.12]} position={[0, 0.7, 0]} />
    </RigidBody>
  );
}

/**
 * Fantasma translucido da construcao, preso a frente do jogador.
 *
 * Posicao e cor sao escritas direto nos objetos do Three dentro do `useFrame`.
 * Passar por estado do React re-renderizaria a arvore 60 vezes por segundo — e
 * a validade da posicao muda a cada passo que o jogador da.
 */
function PlacementGhost() {
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const buildMode = useGameStore((state) => state.buildMode);

  useFrame(() => {
    const group = groupRef.current;
    const material = materialRef.current;
    if (!group || !material) return;

    const state = useGameStore.getState();
    if (!state.buildMode) return;

    const spec = STRUCTURES[state.buildMode];
    const placement = buildPlacement(
      state.buildMode,
      state.inventory,
      state.structures,
      state.nodes,
    );
    group.position.set(placement.position.x, placement.position.y, placement.position.z);
    group.rotation.y = placement.rotation;

    const check = checkPlacement(
      spec,
      placement.position,
      state.inventory,
      state.structures,
      state.nodes,
      placement.rotation,
    );
    material.color.set(check.ok ? palette.correct : palette.wrong);
  });

  if (!buildMode) return null;
  const spec = STRUCTURES[buildMode];

  return (
    <group ref={groupRef} name="fantasma-construcao">
      <mesh position={[0, 0.7, 0]}>
        {buildMode === 'cerca' ? (
          <boxGeometry args={[2, 1.4, 0.2]} />
        ) : (
          <cylinderGeometry args={[spec.footprint, spec.footprint, 1, 12]} />
        )}
        <meshBasicMaterial ref={materialRef} color={palette.correct} transparent opacity={0.42} />
      </mesh>
      {/* Marca no chao: deixa claro onde a base vai encostar. */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[spec.footprint - 0.12, spec.footprint, 20]} />
        <meshBasicMaterial color={palette.highlight} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export function BuildingView() {
  const structures = useGameStore((state) => state.structures);
  const buildError = useGameStore((state) => state.buildError);
  const toggleBuildMode = useGameStore((state) => state.toggleBuildMode);
  const exitBuildMode = useGameStore((state) => state.exitBuildMode);
  const clearBuildError = useGameStore((state) => state.clearBuildError);

  /**
   * Uma acao por estrutura, em vez de um modo com submenu.
   *
   * As acoes de resposta 1-2-3 ja pertencem ao desafio; reaproveita-las para
   * escolher a construcao criaria um conflito silencioso justamente quando os
   * dois estivessem abertos ao mesmo tempo.
   */
  useGameAction('construir-fogueira', () => toggleBuildMode('fogueira'));
  useGameAction('construir-cerca', () => toggleBuildMode('cerca'));
  useGameAction('cancelar', () => exitBuildMode());

  /** `R` remove a cerca mais próxima — ninguém pode ficar cercado. */
  useGameAction('remover-cerca', () => {
    const state = useGameStore.getState();
    if (state.buildMode) return;
    const cerca = nearestRemovableFence(state.structures, playerTransform);
    if (cerca) state.removeStructure(cerca.id);
  });

  useGameAction('confirmar', () => {
    const state = useGameStore.getState();
    if (!state.buildMode) return;
    const placement = buildPlacement(
      state.buildMode,
      state.inventory,
      state.structures,
      state.nodes,
    );
    // A construção vira um desafio: Espaço valida a posição e abre a conta;
    // acertar ergue a estrutura, errar permite tentar de novo.
    state.requestBuild(placement.position, placement.rotation);
  });

  /**
   * Abastecer a fogueira tambem cobra uma multiplicacao.
   *
   * E o fecho do loop: de dia a conta rende recurso, a noite ela rende luz. A
   * mesma tecla **E** da colheita, porque para a crianca a acao e a mesma:
   * chegar perto e resolver.
   */
  useGameAction('interagir', () => {
    const state = useGameStore.getState();
    // O recurso tem prioridade: se ha um no ao alcance, `ResourcesView` cuida.
    // Um movel da casa tambem vem antes — dentro de casa nao se abastece nada.
    if (state.activeChallenge || state.highlightedNodeId || state.nearbySpot) return;

    const fogueira = nearestRefuelable(state.structures, playerTransform);
    if (!fogueira) return;

    state.startChallenge(
      {
        id: fogueira.id,
        kind: 'madeira',
        groups: state.rollFuelGroups(),
        // A fogueira pergunta a tabuada de onde ela esta. Enquanto nao ha
        // regioes, e a da Praia.
        perGroup: DEFAULT_PER_GROUP,
      },
      'abastecer',
    );
  });

  // A mensagem de recusa some sozinha; ficar presa na tela viraria ruido.
  useEffect(() => {
    if (!buildError) return;
    const timer = setTimeout(clearBuildError, 2200);
    return () => clearTimeout(timer);
  }, [buildError, clearBuildError]);

  return (
    <>
      {structures.map((structure) =>
        structure.kind === 'fogueira' ? (
          <Campfire key={structure.id} structure={structure} />
        ) : (
          <Fence key={structure.id} structure={structure} />
        ),
      )}
      <PlacementGhost />
    </>
  );
}
