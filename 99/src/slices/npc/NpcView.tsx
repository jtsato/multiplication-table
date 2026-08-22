import { useFrame } from '@react-three/fiber';
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
  npcPosition,
  orderTarget,
  teacherPosition,
  type NpcRole,
  type Order,
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
  const [greeting, setGreeting] = useState(false);
  const greetingRef = useRef(false);
  const phase = position[0] * 0.13 + position[2] * 0.07;

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const elapsed = clock.getElapsedTime() + phase;
    const distance = Math.hypot(playerTransform.x - position[0], playerTransform.z - position[2]);
    const nextGreeting = distance <= NPC.interactRange;
    if (greetingRef.current !== nextGreeting) {
      greetingRef.current = nextGreeting;
      setGreeting(nextGreeting);
    }
    group.position.x = Math.sin(elapsed * 0.35) * 0.8;
    group.position.z = Math.cos(elapsed * 0.27) * 0.8;
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
    <group ref={groupRef} position={position} name={`npc-${role}-${regionId}`}>
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
        <Text position={[0, 2.1, 0]} fontSize={0.26} color={palette.homeChart} anchorX="center">
          Olá!
        </Text>
      )}
    </group>
  );
}

/** NPC de encomendas: um por regiao. */
function OrderNpc({ order }: { order: Order }) {
  const pos = npcPosition(order.regionId);
  return <NpcMesh role="encomendas" regionId={order.regionId} position={[pos.x, pos.y, pos.z]} />;
}

/**
 * Os NPCs do mundo.
 *
 * - **Encomendas**: um por regiao; falar abre o desafio de entrega.
 * - **Comerciante**: na Praia; falar abre a loja (o mesmo painel do `L`).
 * - **Professor**: um por regiao; falar abre a tabuada de graca, em qualquer
 *   lugar do mundo — o porto seguro da matematica nao e so a casa.
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
      state.openChartFromNpc();
    }
  });

  return (
    <group name="npcs">
      {REGIONS.map((regiao) => {
        const order = orders.find((candidate) => candidate.regionId === regiao.id);
        return (
          <group key={regiao.id}>
            {order && <OrderNpc order={order} />}
            <NpcMesh
              role="professor"
              regionId={regiao.id}
              position={(() => {
                const pos = teacherPosition(regiao.id);
                return [pos.x, pos.y, pos.z];
              })()}
            />
          </group>
        );
      })}

      <NpcMesh
        role="comerciante"
        regionId="praia"
        position={(() => {
          const pos = merchantPosition();
          return [pos.x, pos.y, pos.z];
        })()}
      />
    </group>
  );
}
