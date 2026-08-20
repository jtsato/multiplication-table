import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { palette } from '../../shared/palette';
import { playerTransform } from '../player/playerTransform';
import {
  birdOffset,
  createAmbient,
  facingAngle,
  fleeVector,
  flutterOffset,
  type AmbientCreature,
} from './ambient.logic';

/**
 * Fauna de ambiente na cena.
 *
 * Borboletas pairam perto da âncora e fogem quando o jogador chega perto;
 * pássaros circulam no céu. Não têm física nem interação — são o "mundo vivo"
 * que o jogador vê de relance enquanto caminha.
 */

function Borboleta({ creature }: { creature: AmbientCreature }) {
  const groupRef = useRef<Group>(null);
  const wingsRef = useRef<Group>(null);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    const offset = flutterOffset(creature.seed, t);
    const flee = fleeVector(creature.anchor, playerTransform);
    group.position.set(
      creature.anchor.x + offset.x + flee.x,
      creature.anchor.y + offset.y,
      creature.anchor.z + offset.z + flee.z,
    );
    group.rotation.y = Math.sin(t * 1.2 + creature.seed) * 0.4;
    if (wingsRef.current) {
      wingsRef.current.rotation.x = Math.sin(t * 12 + creature.seed) * 0.6;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={wingsRef}>
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.14, 0.24, 3]} />
          <meshLambertMaterial color={palette.crown} flatShading side={2} />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.14, 0.24, 3]} />
          <meshLambertMaterial color={palette.crown} flatShading side={2} />
        </mesh>
      </group>
      <mesh>
        <boxGeometry args={[0.05, 0.14, 0.05]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>
    </group>
  );
}

function Passaro({ creature }: { creature: AmbientCreature }) {
  const groupRef = useRef<Group>(null);
  const wingsRef = useRef<Group>(null);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    const offset = birdOffset(creature.seed, t);
    group.position.set(
      creature.anchor.x + offset.x,
      creature.anchor.y + offset.y,
      creature.anchor.z + offset.z,
    );
    // O pássaro olha na tangente do círculo.
    const angle = t * 0.5 + creature.seed;
    group.rotation.y = facingAngle(-Math.sin(angle), Math.cos(angle));
    if (wingsRef.current) {
      wingsRef.current.rotation.x = Math.sin(t * 8 + creature.seed) * 0.7;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.16, 6, 4]} />
        <meshLambertMaterial color={palette.shell} flatShading />
      </mesh>
      <group ref={wingsRef}>
        <mesh position={[-0.28, 0, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.16, 0.5, 3]} />
          <meshLambertMaterial color={palette.shellBase} flatShading side={2} />
        </mesh>
        <mesh position={[0.28, 0, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.16, 0.5, 3]} />
          <meshLambertMaterial color={palette.shellBase} flatShading side={2} />
        </mesh>
      </group>
    </group>
  );
}

export function AmbientView({ seed }: { seed: number }) {
  const creatures = useMemo(() => createAmbient(seed), [seed]);

  return (
    <group name="fauna-ambiente">
      {creatures.map((creature) =>
        creature.kind === 'borboleta' ? (
          <Borboleta key={creature.id} creature={creature} />
        ) : (
          <Passaro key={creature.id} creature={creature} />
        ),
      )}
    </group>
  );
}
