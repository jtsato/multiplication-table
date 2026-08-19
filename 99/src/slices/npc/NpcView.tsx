import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { useGameAction } from '../../shared/input';
import { playerTransform } from '../player/playerTransform';
import { REGIONS } from '../regions/regions.logic';
import { nearestOrder, npcPosition, orderTarget, type Order } from './npc.logic';

/** Um NPC de encomendas: corpo simples, com uma placa na frente. */
function NpcMesh({ order }: { order: Order }) {
  const pos = npcPosition(order.regionId);
  return (
    <group position={[pos.x, pos.y, pos.z]} name={`npc-${order.regionId}`}>
      {/* Corpo */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.6, 0.9, 0.4]} />
        <meshLambertMaterial color={palette.playerBody} flatShading />
      </mesh>
      {/* Cabeca */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.28, 6, 5]} />
        <meshLambertMaterial color={palette.playerHead} flatShading />
      </mesh>
      {/* Placa de encomenda */}
      <mesh position={[0, 1.0, 0.45]} castShadow>
        <boxGeometry args={[0.5, 0.34, 0.06]} />
        <meshLambertMaterial color={palette.homeChart} flatShading />
      </mesh>
    </group>
  );
}

/**
 * Os NPCs de encomendas.
 *
 * Um por regiao, parado. Falar com ele abre o mesmo `ChallengePanel` de sempre —
 * o pedido e a conta, e entregar debita a quantidade da mochila e paga moedas.
 */
export function NpcView() {
  const orders = useGameStore((state) => state.orders);

  useFrame(() => {
    const state = useGameStore.getState();
    const perto = nearestOrder(playerTransform, state.orders);
    state.setNearbyOrder(perto?.id ?? null);
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
    const order = state.orders.find((candidate) => candidate.id === state.nearbyOrderId);
    if (!order) return;
    if (state.inventory[order.kind] < order.groups * order.perGroup) return;

    state.startChallenge(orderTarget(order), 'encomenda');
  });

  return (
    <group name="npcs">
      {REGIONS.map((regiao) => {
        const order = orders.find((candidate) => candidate.regionId === regiao.id);
        if (!order) return null;
        return <NpcMesh key={order.id} order={order} />;
      })}
    </group>
  );
}
