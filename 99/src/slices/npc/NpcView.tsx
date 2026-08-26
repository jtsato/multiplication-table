import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import type { Group } from 'three';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { useGameAction } from '../../shared/input';
import { playerTransform } from '../player/playerTransform';
import { REGIONS, type RegionId } from '../regions/regions.logic';
import {
  NPC,
  merchantPosition,
  nearestOrder,
  npcPositionsFor,
  orderTarget,
  teacherPosition,
  type NpcRole,
} from './npc.logic';

/** Um NPC: corpo, rosto expressivo e acessório do papel. */
function NpcMesh({
  role,
  regionId,
  position,
}: {
  role: NpcRole;
  regionId: RegionId;
  position: [number, number, number];
}) {
  const groupRef = useRef<Group>(null);
  const greetingText = useGameStore((state) => state.text.strings.npcGreeting);
  const [greeting, setGreeting] = useState(false);
  const greetingRef = useRef(false);
  const phase = position[0] * 0.13 + position[2] * 0.07;

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const elapsed = clock.getElapsedTime() + phase;
    const distance = Math.hypot(
      playerTransform.x - position[0],
      playerTransform.z - position[2],
    );
    const nextGreeting = distance <= NPC.interactRange;
    if (greetingRef.current !== nextGreeting) {
      greetingRef.current = nextGreeting;
      setGreeting(nextGreeting);
    }
    group.position.y = Math.abs(Math.sin(elapsed * 1.8)) * 0.04;
    group.scale.setScalar(distance <= NPC.interactRange ? 1.08 : 1);
  });

  const cor =
    role === 'comerciante'
      ? palette.honey
      : role === 'professor'
        ? palette.mushroom
        : palette.playerBody;
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[position[0], position[1], position[2]]}
      name={`npc-${role}-${regionId}-body`}
    >
      <CapsuleCollider args={[0.45, 0.35]} />
      <group ref={groupRef} name={`npc-${role}-${regionId}`}>
        {/* Corpo */}
        <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.6, 0.9, 0.4]} />
        <meshLambertMaterial color={cor} flatShading />
      </mesh>
      {/* Cabeca */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.28, 6, 5]} />
        <meshLambertMaterial color={palette.playerHead} flatShading />
      </mesh>
      {/* Rosto: olhos e sorriso, para o NPC não ser só uma placa com corpo. */}
      <mesh position={[-0.1, 1.4, 0.24]}>
        <boxGeometry args={[0.06, 0.07, 0.02]} />
        <meshLambertMaterial color={palette.glasses} flatShading />
      </mesh>
      <mesh position={[0.1, 1.4, 0.24]}>
        <boxGeometry args={[0.06, 0.07, 0.02]} />
        <meshLambertMaterial color={palette.glasses} flatShading />
      </mesh>
      <mesh position={[0, 1.29, 0.26]}>
        <boxGeometry args={[0.15, 0.03, 0.02]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>

      {/* Professor: óculos — a identidade dele é o olhar de quem ensina. */}
      {role === 'professor' && (
        <group position={[0, 1.4, 0.22]}>
          {[-0.11, 0.11].map((offset) => (
            <mesh key={offset} position={[offset, 0, 0]}>
              <boxGeometry args={[0.18, 0.13, 0.04]} />
              <meshBasicMaterial color={palette.glasses} />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.09, 0.03, 0.03]} />
            <meshBasicMaterial color={palette.glasses} />
          </mesh>
        </group>
      )}

      {/* Comerciante: chapéu de feira. */}
      {role === 'comerciante' && (
        <group position={[0, 1.56, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.24, 0.26, 8]} />
            <meshLambertMaterial color={palette.trunk} flatShading />
          </mesh>
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.05, 10]} />
            <meshLambertMaterial color={palette.trunk} flatShading />
          </mesh>
        </group>
      )}

      {/* Encomendas: boné de entregador. */}
      {role === 'encomendas' && (
        <group position={[0, 1.56, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.27, 8, 5, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
            <meshLambertMaterial color={palette.homeBed} flatShading />
          </mesh>
          <mesh position={[0, -0.05, 0.2]} castShadow>
            <boxGeometry args={[0.44, 0.06, 0.3]} />
            <meshLambertMaterial color={palette.homeBed} flatShading />
          </mesh>
        </group>
      )}

      {/* Placa */}
      <mesh position={[0, 1.0, 0.45]} castShadow>
        <boxGeometry args={[0.5, 0.34, 0.06]} />
        <meshLambertMaterial color={palette.homeChart} flatShading />
      </mesh>
      {greeting && (
        <Text
          position={[0, 2.1, 0]}
          fontSize={0.26}
          color={palette.homeChart}
          anchorX="center"
        >
          {greetingText}
        </Text>
      )}
      </group>
    </RigidBody>
  );
}

/**
 * Os NPCs do mundo.
 *
 * - **Encomendas**: um por regiao; falar abre o desafio de entrega.
 * - **Comerciante**: na Praia; falar abre a loja (o mesmo painel do `L`).
 * - **Professor**: um por regiao; falar abre a tabuada de graca, em qualquer
 *   lugar do mundo — o porto seguro da matematica nao e so a casa.
 *
 * Quem esta em cada regiao sai de `npcRolesFor`, que ja aplica o teto de tres.
 * A view nao decide isso: assim a regra vale para o jogo e para o teste.
 */
export function NpcView() {
  const orders = useGameStore((state) => state.orders);

  useFrame(() => {
    const state = useGameStore.getState();

    const perto = nearestOrder(playerTransform, state.orders);
    state.setNearbyOrder(perto?.id ?? null);

    const comerciante = merchantPosition();
    const pertoDaComerciante =
      Math.hypot(playerTransform.x - comerciante.x, playerTransform.z - comerciante.z) <=
      NPC.interactRange;
    state.setNearbyMerchant(pertoDaComerciante);

    let professor: RegionId | null = null;
    let menorDistancia: number = NPC.interactRange;
    for (const regiao of REGIONS) {
      const pos = teacherPosition(regiao.id);
      const distancia = Math.hypot(playerTransform.x - pos.x, playerTransform.z - pos.z);
      if (distancia <= menorDistancia) {
        menorDistancia = distancia;
        professor = regiao.id;
      }
    }
    state.setNearbyTeacherRegion(professor);
  });

  useGameAction('interagir', () => {
    const state = useGameStore.getState();
    if (
      state.activeChallenge ||
      state.highlightedNodeId ||
      state.nearbySpot ||
      state.nearbyBridge ||
      state.nearbyAnimalId
    ) {
      return;
    }

    // Encomenda tem prioridade: e a unica que cobra conta e recurso.
    const order = state.orders.find((candidate) => candidate.id === state.nearbyOrderId);
    if (order) {
      if (state.inventory[order.kind] >= order.groups * order.perGroup) {
        state.startChallenge(orderTarget(order), 'encomenda');
      }
      return;
    }

    if (state.nearbyMerchant) {
      state.toggleShop();
      return;
    }

    if (state.nearbyTeacherRegion) {
      state.openChartFromNpc(state.nearbyTeacherRegion);
    }
  });

  return (
    <group name="npcs">
      {/* Quem existe, onde, e a regra de que sem encomenda do dia nao ha NPC de
          encomenda moram todas em `npcPositionsFor`. A view so desenha o que
          ela devolve: assim o jogo e o teste nunca discordam da contagem. */}
      {npcPositionsFor(orders).map(({ role, regionId, position }) => (
        <NpcMesh
          key={`${regionId}-${role}`}
          role={role}
          regionId={regionId}
          position={[position.x, position.y, position.z]}
        />
      ))}
    </group>
  );
}
