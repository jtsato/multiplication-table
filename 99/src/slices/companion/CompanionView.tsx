import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { playerTransform } from '../player/playerTransform';
import { PET, petFollow } from './companion.logic';
import { petTransform } from './petTransform';

/**
 * O pet na cena.
 *
 * Nao tem corpo fisico: a posicao e calculada por quadro em `petTransform` e o
 * grupo so segue o numero. O pet tambem desenterra uma moeda de vez em quando —
 * um agrado gentil, no mesmo ritmo em que a crianca resolve contas.
 */
export function CompanionView() {
  const pet = useGameStore((state) => state.pet);
  const groupRef = useRef<Group>(null);
  const coinTimerRef = useRef(0);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (!state.pet) return;

    const proximo = petFollow(
      { x: petTransform.x, y: petTransform.y, z: petTransform.z },
      playerTransform,
      playerTransform.yaw,
      delta,
    );
    petTransform.x = proximo.x;
    petTransform.y = playerTransform.y;
    petTransform.z = proximo.z;

    if (groupRef.current) {
      groupRef.current.position.set(proximo.x, playerTransform.y, proximo.z);
    }

    coinTimerRef.current += delta;
    if (coinTimerRef.current >= PET.coinIntervalSeconds) {
      coinTimerRef.current = 0;
      state.addCoins(1);
    }
  });

  if (!pet) return null;

  return (
    <group ref={groupRef} name="pet">
      {/* Corpo */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.42, 0.38, 0.7]} />
        <meshLambertMaterial color={palette.fence} flatShading />
      </mesh>
      {/* Cabeca */}
      <mesh position={[0, 0.62, 0.38]} castShadow>
        <boxGeometry args={[0.3, 0.28, 0.24]} />
        <meshLambertMaterial color={palette.bridgeDeck} flatShading />
      </mesh>
      {/* Orelhas */}
      <mesh position={[-0.12, 0.78, 0.36]} rotation={[0.2, 0, -0.3]}>
        <boxGeometry args={[0.12, 0.16, 0.05]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>
      <mesh position={[0.12, 0.78, 0.36]} rotation={[0.2, 0, 0.3]}>
        <boxGeometry args={[0.12, 0.16, 0.05]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>
      {/* Rabo */}
      <mesh position={[0, 0.5, -0.45]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.08, 0.22, 0.08]} />
        <meshLambertMaterial color={palette.bridgeDeck} flatShading />
      </mesh>
    </group>
  );
}
