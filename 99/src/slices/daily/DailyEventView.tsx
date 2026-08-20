import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { BufferAttribute, BufferGeometry, Group, PointsMaterial } from 'three';
import { palette } from '../../shared/palette';
import { useGameStore } from '../../app/store';
import { playerTransform } from '../player/playerTransform';
import { eventForDay, VISITOR_BOAT_POSITION } from './daily.logic';

/**
 * O lado visível dos eventos diários.
 *
 * Chuva ganha cortinas de água caindo em volta do jogador; o visitante especial
 * ganha um barco balançando no mar do Porto. Os eventos são determinísticos,
 * então a cena apenas lê `clock.day` — não há estado novo para salvar.
 */

const RAIN_COUNT = 80;
const RAIN_SPREAD = 16;
const RAIN_HEIGHT = 8;

interface RainDrop {
  x: number;
  z: number;
  speed: number;
}

const rainDrops: RainDrop[] = Array.from({ length: RAIN_COUNT }, () => ({
  x: (Math.random() - 0.5) * RAIN_SPREAD,
  z: (Math.random() - 0.5) * RAIN_SPREAD,
  speed: 6 + Math.random() * 4,
}));

const rainPositions = new Float32Array(RAIN_COUNT * 3);

function Rain() {
  const attributeRef = useRef<BufferAttribute>(null);
  const geometryRef = useRef<BufferGeometry>(null);
  const materialRef = useRef<PointsMaterial>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    for (let i = 0; i < RAIN_COUNT; i += 1) {
      const drop = rainDrops[i];
      // `i` na fase evita que todas as gotas caiam no mesmo plano.
      const y = RAIN_HEIGHT - ((time * drop.speed + i) % RAIN_HEIGHT);
      rainPositions[i * 3] = playerTransform.x + drop.x;
      rainPositions[i * 3 + 1] = playerTransform.y + y;
      rainPositions[i * 3 + 2] = playerTransform.z + drop.z;
    }
    if (attributeRef.current) attributeRef.current.needsUpdate = true;
    geometryRef.current?.setDrawRange(0, RAIN_COUNT * 3);
    if (materialRef.current) materialRef.current.opacity = 0.55;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" ref={attributeRef} args={[rainPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#bfe3ff"
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

function VisitorBoat() {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    groupRef.current?.position.set(
      VISITOR_BOAT_POSITION.x,
      Math.sin(state.clock.elapsedTime * 1.5) * 0.15 - 0.8,
      VISITOR_BOAT_POSITION.z,
    );
  });

  return (
    <group ref={groupRef} name="barco-visitante">
      {/* Casco */}
      <mesh position={[0, 0, 0]} castShadow scale={[1.6, 0.5, 2.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>
      {/* Mastro */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.6, 5]} />
        <meshLambertMaterial color={palette.trunk} flatShading />
      </mesh>
      {/* Vela */}
      <mesh position={[0, 1.5, -0.55]} rotation={[0.15, 0, 0]}>
        <coneGeometry args={[0.5, 1.1, 4]} />
        <meshLambertMaterial color={palette.shell} flatShading side={2} />
      </mesh>
    </group>
  );
}

export function DailyEventView() {
  const day = useGameStore((state) => state.clock.day);
  const event = useMemo(() => eventForDay(day), [day]);

  return (
    <group name="evento-diario">
      {event.kind === 'chuva' && <Rain />}
      {event.kind === 'visitante' && <VisitorBoat />}
    </group>
  );
}
