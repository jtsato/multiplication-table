import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import type { Mesh, MeshLambertMaterial, PointLight } from 'three';
import { useGameStore } from '../../app/store';
import { useGameAction } from '../../shared/input';
import { palette } from '../../shared/palette';
import { cyclePosition, phaseFor } from '../daynight/daynight.logic';
import { dayNightClock } from '../daynight/dayNightClock';
import { playerTransform } from '../player/playerTransform';
import { HOME, HOME_SPOT_OFFSETS, isInsideHome, nearestSpot } from './home.logic';

/** Publicacao para o HUD: 4 Hz basta para "voce esta perto do espelho". */
const PUBLISH_INTERVAL = 0.25;

/** Opacidade do telhado quando o jogador esta dentro. */
const ROOF_INSIDE = 0.12;

/** Espessura das paredes. */
const WALL = 0.22;

/** Espelho, mural e cama, em geometria simples. */
function Furniture() {
  return (
    <>
      {/* Espelho: moldura clara encostada na parede do fundo. */}
      <mesh
        position={[HOME_SPOT_OFFSETS.espelho.x, 1.1, HOME_SPOT_OFFSETS.espelho.z - 0.25]}
        castShadow
      >
        <boxGeometry args={[1.1, 1.6, 0.12]} />
        <meshLambertMaterial color={palette.homeMirror} flatShading />
      </mesh>

      {/* Mural: quadro grande, do tamanho de uma tabuada inteira. */}
      <mesh
        position={[HOME_SPOT_OFFSETS.mural.x, 1.3, HOME_SPOT_OFFSETS.mural.z - 0.25]}
        castShadow
      >
        <boxGeometry args={[1.6, 1.2, 0.1]} />
        <meshLambertMaterial color={palette.homeChart} flatShading />
      </mesh>

      {/* Cama: colchao e travesseiro. */}
      <group position={[HOME_SPOT_OFFSETS.cama.x, 0, HOME_SPOT_OFFSETS.cama.z]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.5, 1.9]} />
          <meshLambertMaterial color={palette.homeBed} flatShading />
        </mesh>
        <mesh position={[0, 0.62, -0.6]} castShadow>
          <boxGeometry args={[0.9, 0.22, 0.5]} />
          <meshLambertMaterial color={palette.homePillow} flatShading />
        </mesh>
      </group>
    </>
  );
}

/**
 * A casa.
 *
 * Fica no mesmo terreno, sem carregar outra cena: quando a crianca entra, o
 * telhado fica quase transparente e a leitura vira a de uma casa de boneca. E
 * barato em low poly e nao exige gerenciar duas cenas.
 *
 * A opacidade e escrita **direto no material dentro do `useFrame`**. Passar por
 * estado do React re-renderizaria a arvore a cada passo na soleira da porta.
 */
export function HomeView() {
  /**
   * A mesma tecla **E** de colher e de acender.
   *
   * Prioridade: recurso primeiro, movel depois. Quem esta perto de uma arvore
   * quis colher, nao abrir o guarda-roupa — e os moveis so respondem de dentro
   * de casa, onde nao ha recurso nenhum.
   */
  useGameAction('interagir', () => {
    const state = useGameStore.getState();
    if (state.activeChallenge || state.highlightedNodeId) return;
    state.openNearbySpot();
  });

  const roofRef = useRef<Mesh>(null);
  const roofMaterialRef = useRef<MeshLambertMaterial>(null);
  const windowLightRef = useRef<PointLight>(null);
  const publishTimerRef = useRef(0);

  useFrame((_, delta) => {
    const dentro = isInsideHome(playerTransform);

    if (roofMaterialRef.current) {
      // Interpola em vez de trocar de estalo: cruzar a porta tem que ser uma
      // transicao, nao um susto.
      const alvo = dentro ? ROOF_INSIDE : 1;
      const atual = roofMaterialRef.current.opacity;
      roofMaterialRef.current.opacity = atual + (alvo - atual) * Math.min(1, delta * 8);
    }
    if (roofRef.current) {
      // Telhado invisivel nao precisa de sombra — e a sombra dele escureceria a
      // sala inteira justamente quando a crianca entra.
      roofRef.current.castShadow = !dentro;
    }

    if (windowLightRef.current) {
      // As janelas acendem quando escurece. A luz da porta nunca apaga; esta,
      // de dentro, so faz sentido quando ha contraste.
      const fase = phaseFor(cyclePosition(dayNightClock.seconds));
      const acesa = fase === 'noite' || fase === 'entardecer' || fase === 'amanhecer';
      windowLightRef.current.intensity = acesa ? 14 : 2;
    }

    publishTimerRef.current += delta;
    if (publishTimerRef.current >= PUBLISH_INTERVAL) {
      publishTimerRef.current = 0;
      const state = useGameStore.getState();
      state.setInsideHome(dentro);
      state.setNearbySpot(nearestSpot(playerTransform));
    }
  });

  const { x, z } = HOME.position;
  const largura = HOME.halfWidth * 2;
  const profundidade = HOME.halfDepth * 2;

  return (
    <group position={[x, 0, z]} name="casa">
      <RigidBody type="fixed" colliders={false}>
        {/* Piso */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[largura, 0.1, profundidade]} />
          <meshLambertMaterial color={palette.homeFloor} flatShading />
        </mesh>

        {/* Fundo e laterais. A frente tem o vao da porta. */}
        <mesh position={[0, HOME.wallHeight / 2, -HOME.halfDepth]} castShadow receiveShadow>
          <boxGeometry args={[largura, HOME.wallHeight, WALL]} />
          <meshLambertMaterial color={palette.homeWall} flatShading />
        </mesh>
        <CuboidCollider
          args={[HOME.halfWidth, HOME.wallHeight / 2, WALL / 2]}
          position={[0, HOME.wallHeight / 2, -HOME.halfDepth]}
        />

        {[-1, 1].map((lado) => (
          <group key={lado}>
            <mesh
              position={[lado * HOME.halfWidth, HOME.wallHeight / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[WALL, HOME.wallHeight, profundidade]} />
              <meshLambertMaterial color={palette.homeWall} flatShading />
            </mesh>
            <CuboidCollider
              args={[WALL / 2, HOME.wallHeight / 2, HOME.halfDepth]}
              position={[lado * HOME.halfWidth, HOME.wallHeight / 2, 0]}
            />
          </group>
        ))}

        {/* Frente: dois trechos, deixando o vao da porta no meio. */}
        {[-1, 1].map((lado) => {
          const trecho = HOME.halfWidth - 0.9;
          const centro = lado * (HOME.halfWidth - trecho / 2);
          return (
            <group key={`frente-${lado}`}>
              <mesh position={[centro, HOME.wallHeight / 2, HOME.halfDepth]} castShadow>
                <boxGeometry args={[trecho, HOME.wallHeight, WALL]} />
                <meshLambertMaterial color={palette.homeWall} flatShading />
              </mesh>
              <CuboidCollider
                args={[trecho / 2, HOME.wallHeight / 2, WALL / 2]}
                position={[centro, HOME.wallHeight / 2, HOME.halfDepth]}
              />
            </group>
          );
        })}
      </RigidBody>

      <Furniture />

      {/* Telhado de duas aguas, simplificado como uma piramide achatada. */}
      <mesh ref={roofRef} position={[0, HOME.wallHeight + 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[HOME.halfWidth * 1.5, 1.4, 4]} />
        <meshLambertMaterial
          ref={roofMaterialRef}
          color={palette.homeRoof}
          flatShading
          transparent
          opacity={1}
        />
      </mesh>

      {/* Luz de dentro: acende quando escurece. */}
      <pointLight
        ref={windowLightRef}
        position={[0, HOME.wallHeight - 0.6, 0]}
        color={palette.homeGlow}
        intensity={2}
        distance={HOME.lightRadius}
        decay={2}
      />

      {/*
        O lampiao da porta **nunca apaga**.
        E a promessa visual do porto seguro, e ela precisa ser vista de longe: a
        crianca perdida no escuro tem que conseguir olhar em volta e achar casa.
      */}
      <group position={[1.0, 2.0, HOME.halfDepth + 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.34, 0.28]} />
          <meshBasicMaterial color={palette.homeGlow} />
        </mesh>
        <pointLight color={palette.homeGlow} intensity={12} distance={HOME.lightRadius} decay={2} />
      </group>
    </group>
  );
}
