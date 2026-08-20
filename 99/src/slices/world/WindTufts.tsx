import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { playerTransform } from '../player/playerTransform';
import { createWindTufts, tuftPose } from './wind.logic';

/**
 * Tufos de vegetação que respondem ao vento e ao jogador.
 *
 * Poucos (36 no total) e individuais, de propósito: o grosso do cenário continua
 * instanciado e barato; estes são os que dão a ilusão de que a vegetação é viva.
 */
export function WindTufts({ seed }: { seed: number }) {
  const tufts = useMemo(() => createWindTufts(seed), [seed]);
  const refs = useRef<Array<Mesh | null>>([]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    for (let i = 0; i < tufts.length; i += 1) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      const pose = tuftPose(tufts[i].position, playerTransform, time, tufts[i].seed);
      mesh.rotation.x = pose.rotationX;
      mesh.rotation.z = pose.rotationZ;
      mesh.scale.y = pose.scaleY;
    }
  });

  return (
    <group name="vento">
      {tufts.map((tuft, index) => (
        <mesh
          key={tuft.id}
          ref={(mesh) => {
            refs.current[index] = mesh;
          }}
          position={[tuft.position.x, tuft.position.y, tuft.position.z]}
          castShadow
        >
          <coneGeometry args={[0.2, 0.7, 4]} />
          <meshLambertMaterial color={tuft.color} flatShading />
        </mesh>
      ))}
    </group>
  );
}
