import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { palette } from '../../shared/palette';
import { dayNightClock } from '../daynight/dayNightClock';
import { dayNumber } from '../daynight/daynight.logic';
import { eventForDay, whalePositionFor } from '../daily/daily.logic';
import { WHALE, whaleHeight, whaleIsSpouting, whaleState } from './whale.logic';

/**
 * A baleia do Porto na cena.
 *
 * O corpo fica sempre na arvore, mas abaixo da agua quando a janela esta
 * fechada; o `useFrame` so sobe e desce o grupo. O esguicho so aparece no meio
 * da janela. Nenhuma escrita no store: e puro acontecimento visual.
 */
export function WhaleView() {
  const groupRef = useRef<Group>(null);
  const spoutRef = useRef<Group>(null);

  useFrame(() => {
    const state = whaleState(dayNightClock.seconds);
    const altura = whaleHeight(state);
    const dia = dayNumber(dayNightClock.seconds);
    const posicao = whalePositionFor(eventForDay(dia).kind) ?? WHALE.position;

    if (groupRef.current) {
      groupRef.current.position.set(posicao.x, altura, posicao.z);
    }
    if (spoutRef.current) {
      spoutRef.current.visible = whaleIsSpouting(state);
    }
  });

  return (
    <group ref={groupRef} position={[WHALE.position.x, -10, WHALE.position.z]} name="baleia">
      {/* Corpo: esfera achatada, como uma baleia low poly. */}
      <mesh position={[0, 0.6, 0]} castShadow scale={[1.7, 0.8, 2.6]}>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshLambertMaterial color={palette.moonAmbient} flatShading />
      </mesh>
      {/* Cauda */}
      <mesh position={[-1.7, 0.7, 0]} rotation={[0, 0, -0.5]} scale={[1, 0.35, 1]}>
        <coneGeometry args={[0.5, 1.3, 4]} />
        <meshLambertMaterial color={palette.moonAmbient} flatShading />
      </mesh>

      {/* Esguicho: visivel apenas no auge da janela. */}
      <group ref={spoutRef} position={[0, 1.6, 0]} visible={false}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
          <meshLambertMaterial color={palette.foam} flatShading />
        </mesh>
        <mesh position={[-0.3, 0.9, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.8, 6]} />
          <meshLambertMaterial color={palette.foam} flatShading />
        </mesh>
        <mesh position={[0.3, 0.9, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.8, 6]} />
          <meshLambertMaterial color={palette.foam} flatShading />
        </mesh>
      </group>
    </group>
  );
}
