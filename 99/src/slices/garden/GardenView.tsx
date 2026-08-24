import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { useGameAction } from '../../shared/input';
import { playerTransform } from '../player/playerTransform';
import { ITEM_COLOR } from '../resources/resources.look';
import { GARDEN, gardenStatus, type GardenPlot } from './garden.logic';

function GardenMesh({ plot }: { plot: GardenPlot }) {
  const status = useGameStore((state) => gardenStatus(plot, state.clock.day));
  const produceColor = ITEM_COLOR[plot.crop];

  return (
    <group position={[plot.position.x, plot.position.y, plot.position.z]} name={plot.id}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.24, 1.4]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>
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
                <meshLambertMaterial color={produceColor} flatShading />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

export function GardenView() {
  const garden = useGameStore((state) => state.garden);

  useFrame(() => {
    const state = useGameStore.getState();
    let nearestId: string | null = null;
    let nearestDistanceSq = GARDEN.interactRange * GARDEN.interactRange;

    for (const plot of state.garden) {
      const distanceSq =
        (playerTransform.x - plot.position.x) ** 2 + (playerTransform.z - plot.position.z) ** 2;
      if (distanceSq <= nearestDistanceSq) {
        nearestId = plot.id;
        nearestDistanceSq = distanceSq;
      }
    }

    state.setNearbyGarden(nearestId);
  });

  useGameAction('plantar-canteiro', () => {
    useGameStore.getState().plantGardenAtPlayer();
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

    const plot = state.garden.find((candidate) => candidate.id === state.nearbyGardenId);
    if (!plot) return;

    const status = gardenStatus(plot, state.clock.day);
    if (status === 'empty') state.plantGarden();
    if (status === 'ready') state.harvestGarden();
  });

  return (
    <>
      {garden.map((plot) => (
        <GardenMesh key={plot.id} plot={plot} />
      ))}
    </>
  );
}
