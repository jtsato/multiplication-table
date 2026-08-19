import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { useGameAction } from '../../shared/input';
import { playerTransform } from '../player/playerTransform';
import { GARDEN, gardenPosition, gardenStatus } from './garden.logic';

/** A horta do Pomar, em tres estados: terra, brotando e madura. */
function GardenMesh() {
  const pos = gardenPosition();
  const estado = useGameStore((state) => state.garden);
  const day = useGameStore((state) => state.clock.day);
  const status = gardenStatus(estado, day);

  return (
    <group position={[pos.x, pos.y, pos.z]} name="horta">
      {/* Canteiro */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.24, 1.4]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>
      {/* Terra */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[1.9, 0.08, 1.1]} />
        <meshLambertMaterial color={palette.rock} flatShading />
      </mesh>

      {status === 'growing' && (
        <group>
          {[-0.6, 0, 0.6].map((x) => (
            <mesh key={x} position={[x, 0.55, 0]} castShadow>
              <boxGeometry args={[0.12, 0.5, 0.12]} />
              <meshLambertMaterial color={palette.leaves} flatShading />
            </mesh>
          ))}
        </group>
      )}

      {status === 'ready' && (
        <group>
          {[-0.6, 0, 0.6].map((x) => (
            <group key={x} position={[x, 0.55, 0]}>
              <mesh position={[0, 0.15, 0]} castShadow>
                <boxGeometry args={[0.12, 0.3, 0.12]} />
                <meshLambertMaterial color={palette.leaves} flatShading />
              </mesh>
              <mesh position={[0, 0.42, 0]} castShadow>
                <sphereGeometry args={[0.18, 6, 5]} />
                <meshLambertMaterial color={palette.berry} flatShading />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

/**
 * A horta do Pomar.
 *
 * Plantar usa uma semente; a horta fica "crescendo" no mesmo dia e "pronta" a
 * partir do dia seguinte. Colher entrega frutas de graca — a recompensa e por
 * voltar, nao por resolver mais uma conta.
 */
export function GardenView() {
  useFrame(() => {
    const state = useGameStore.getState();
    const pos = gardenPosition();
    const perto =
      Math.hypot(playerTransform.x - pos.x, playerTransform.z - pos.z) <= GARDEN.interactRange;
    state.setNearbyGarden(perto);
  });

  useGameAction('interagir', () => {
    const state = useGameStore.getState();
    if (
      state.activeChallenge ||
      state.highlightedNodeId ||
      state.nearbySpot ||
      state.nearbyBridge ||
      state.nearbyAnimalId ||
      state.nearbyOrderId ||
      state.nearbyMerchant ||
      state.nearbyTeacherRegion
    ) {
      return;
    }
    if (!state.nearbyGarden) return;

    const status = gardenStatus(state.garden, state.clock.day);
    if (status === 'empty') state.plantGarden();
    if (status === 'ready') state.harvestGarden();
  });

  return <GardenMesh />;
}
