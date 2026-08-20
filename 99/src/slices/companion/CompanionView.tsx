import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { useGameStore } from '../../app/store';
import { palette } from '../../shared/palette';
import { playerTransform } from '../player/playerTransform';
import { nearestNodeInRange } from '../resources/resources.logic';
import { PET, petFollow, petRestAmount, sniffAngle } from './companion.logic';
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
  const headRef = useRef<Mesh>(null);
  const coinTimerRef = useRef(0);
  const idleTimeRef = useRef(0);
  const prevPlayerRef = useRef({ x: playerTransform.x, z: playerTransform.z });

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (!state.pet) return;

    // Descanso: quando o jogador fica parado, o pet se acomoda.
    const moved =
      Math.hypot(
        playerTransform.x - prevPlayerRef.current.x,
        playerTransform.z - prevPlayerRef.current.z,
      ) > 0.05;
    prevPlayerRef.current.x = playerTransform.x;
    prevPlayerRef.current.z = playerTransform.z;
    if (moved) idleTimeRef.current = 0;
    else idleTimeRef.current += delta;
    const descanso = petRestAmount(idleTimeRef.current);

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
      groupRef.current.position.set(
        proximo.x,
        playerTransform.y - descanso * 0.1,
        proximo.z,
      );
      groupRef.current.scale.y = 1 - descanso * 0.12;
    }

    // Fareja o no mais proximo: a cabeca vira para ele, e volta ao normal quando
    // nao ha nada perto. Descansando, a cabeca tambem baixa um pouco.
    if (headRef.current) {
      const no = nearestNodeInRange(proximo, state.nodes, PET.sniffRange);
      const alvo = no ? sniffAngle(proximo, no.position) : 0;
      const atual = headRef.current.rotation.y;
      headRef.current.rotation.y = atual + (alvo - atual) * Math.min(1, delta * 8);
      headRef.current.rotation.x = descanso * 0.35;
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
      <mesh ref={headRef} position={[0, 0.62, 0.38]} castShadow>
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
