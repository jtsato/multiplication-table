import { useFrame } from '@react-three/fiber';
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

/** Um NPC: corpo simples, com uma placa na frente. */
function NpcMesh({
  role,
  regionId,
  position,
}: {
  role: NpcRole;
  regionId: RegionId;
  position: [number, number, number];
}) {
  const cor =
    role === 'comerciante'
      ? palette.honey
      : role === 'professor'
        ? palette.mushroom
        : palette.playerBody;
  return (
    <group position={position} name={`npc-${role}-${regionId}`}>
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
      {/* Placa */}
      <mesh position={[0, 1.0, 0.45]} castShadow>
        <boxGeometry args={[0.5, 0.34, 0.06]} />
        <meshLambertMaterial color={palette.homeChart} flatShading />
      </mesh>
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
