import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
import { palette } from '../../shared/palette';
import { createRng, randomRange } from '../../shared/rng';
import { ISLAND, scatterPositions } from './world.logic';

/** Altura do disco de terra abaixo do nivel do chao. */
const ISLAND_THICKNESS = 3;
/** Quantos segmentos de parede invisivel formam a borda da ilha. */
const WALL_SEGMENTS = 24;

/**
 * Parede invisivel na borda da ilha.
 *
 * Preferida a "grudar" a posicao do jogador dentro do raio por codigo: corrigir
 * a posicao todo quadro briga com o solver do Rapier e produz tremor. Um anel de
 * colisores deixa a contencao a cargo da propria fisica.
 */
function IslandWalls() {
  const segments = useMemo(() => {
    const width = (2 * Math.PI * ISLAND.radius) / WALL_SEGMENTS;
    return Array.from({ length: WALL_SEGMENTS }, (_, index) => {
      const angle = (index / WALL_SEGMENTS) * Math.PI * 2;
      return {
        key: index,
        position: [Math.cos(angle) * ISLAND.radius, 1.5, Math.sin(angle) * ISLAND.radius] as const,
        // O colisor gira para ficar tangente ao circulo.
        rotation: [0, -angle, 0] as const,
        // Meia-largura com folga, para os segmentos se sobreporem e nao deixarem fresta.
        halfWidth: width * 0.75,
      };
    });
  }, []);

  return (
    <RigidBody type="fixed" colliders={false}>
      {segments.map((segment) => (
        <CuboidCollider
          key={segment.key}
          args={[0.3, 2.5, segment.halfWidth]}
          position={segment.position}
          rotation={segment.rotation}
        />
      ))}
    </RigidBody>
  );
}

/**
 * Cenario decorativo instanciado.
 *
 * Tufos de grama e pedrinhas somam centenas de objetos; como `InstancedMesh`
 * eles custam uma unica chamada de desenho por tipo. Arvores e moitas nao estao
 * aqui — na Fatia 2 elas viram nos interativos, com estado proprio.
 */
function Scenery({ seed }: { seed: number }) {
  const { tufts, pebbles } = useMemo(() => {
    const rng = createRng(seed);
    const tuftPositions = scatterPositions(rng, 140, 1.6);
    const pebblePositions = scatterPositions(rng, 60, 2.2);

    return {
      tufts: tuftPositions.map((position, index) => ({
        key: index,
        position: [position.x, 0.18, position.z] as const,
        rotation: [0, randomRange(rng, 0, Math.PI * 2), 0] as const,
        scale: randomRange(rng, 0.7, 1.4),
      })),
      pebbles: pebblePositions.map((position, index) => ({
        key: index,
        position: [position.x, 0.12, position.z] as const,
        rotation: [
          randomRange(rng, 0, Math.PI),
          randomRange(rng, 0, Math.PI * 2),
          randomRange(rng, 0, Math.PI),
        ] as const,
        scale: randomRange(rng, 0.18, 0.42),
      })),
    };
  }, [seed]);

  return (
    <>
      <Instances limit={tufts.length} castShadow>
        <coneGeometry args={[0.22, 0.55, 4]} />
        <meshLambertMaterial color={palette.grassDark} flatShading />
        {tufts.map((tuft) => (
          <Instance
            key={tuft.key}
            position={tuft.position}
            rotation={tuft.rotation}
            scale={tuft.scale}
          />
        ))}
      </Instances>

      <Instances limit={pebbles.length} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color={palette.rock} flatShading />
        {pebbles.map((pebble) => (
          <Instance
            key={pebble.key}
            position={pebble.position}
            rotation={pebble.rotation}
            scale={pebble.scale}
          />
        ))}
      </Instances>
    </>
  );
}

export function WorldView({ seed }: { seed: number }) {
  return (
    <>
      {/* As luzes ficam em `DayNightView`: quem manda nelas e o ciclo, nao a
          geometria. Aqui mora so o que compoe fisicamente a ilha. */}

      {/* Mar: plano grande e barato, sem fisica — o jogador nunca chega nele. */}
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[400, 400]} />
        <meshLambertMaterial color={palette.water} />
      </mesh>

      {/*
        Faixa de areia: anel em volta do gramado.

        O topo tem que ficar ABAIXO de `groundY` (0), que e o topo do gramado.
        Na primeira versao este disco terminava em y = +0.05 e, sendo maior que a
        ilha, cobria o gramado inteiro — a ilha aparecia bege e sem sombra
        nenhuma, porque as sombras caiam neste disco em vez de na grama.
      */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[ISLAND.radius + 2.2, ISLAND.radius + 1.2, 1, 24]} />
        <meshLambertMaterial color={palette.sand} flatShading />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, -ISLAND_THICKNESS / 2, 0]} receiveShadow>
          <cylinderGeometry args={[ISLAND.radius, ISLAND.radius - 1.5, ISLAND_THICKNESS, 24]} />
          <meshLambertMaterial color={palette.grass} flatShading />
        </mesh>
        <CylinderCollider
          args={[ISLAND_THICKNESS / 2, ISLAND.radius]}
          position={[0, -ISLAND_THICKNESS / 2, 0]}
        />
      </RigidBody>

      <IslandWalls />
      <Scenery seed={seed} />
    </>
  );
}
