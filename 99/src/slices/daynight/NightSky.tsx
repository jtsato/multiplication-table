import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { MeshBasicMaterial, PointsMaterial } from 'three';
import { dayNightClock } from './dayNightClock';
import { createStarPositions, cyclePosition, NIGHT_SKY, phaseFor } from './daynight.logic';

/** Opacidade do céu noturno (estrelas e lua) em cada fase. */
function nightOpacity(phase: 'dia' | 'entardecer' | 'noite' | 'amanhecer'): number {
  if (phase === 'noite') return 1;
  if (phase === 'entardecer' || phase === 'amanhecer') return 0.35;
  return 0;
}

/**
 * Estrelas e lua.
 *
 * A noite deixa de ser só "escurecer": ganha um céu estrelado e uma lua visível.
 * A opacidade acompanha a fase — de dia as estrelas somem; no entardecer e no
 * amanhecer aparecem tímidas; de noite brilham.
 */
export function NightSky() {
  const starMaterialRef = useRef<PointsMaterial>(null);
  const moonMaterialRef = useRef<MeshBasicMaterial>(null);
  const positions = useMemo(() => createStarPositions(), []);

  useFrame(() => {
    const phase = phaseFor(cyclePosition(dayNightClock.seconds));
    const opacity = nightOpacity(phase);
    if (starMaterialRef.current) starMaterialRef.current.opacity = opacity;
    if (moonMaterialRef.current) moonMaterialRef.current.opacity = Math.min(1, opacity * 0.9);
  });

  return (
    <group>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={starMaterialRef}
          size={0.35}
          color="#ffffff"
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <mesh position={[NIGHT_SKY.moonPosition.x, NIGHT_SKY.moonPosition.y, NIGHT_SKY.moonPosition.z]}>
        <sphereGeometry args={[1.8, 12, 12]} />
        <meshBasicMaterial ref={moonMaterialRef} color="#f2f0e6" transparent opacity={0} />
      </mesh>
    </group>
  );
}
